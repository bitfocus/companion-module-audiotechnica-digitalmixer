import { InstanceBase, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { FEEDBACK_IDS, UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdateVariableDefinitions, checkVariables, type VariablesSchema } from './variables.js'
import { UpdatePresets } from './presets.js'
import { getModel, type Model } from './models.js'
import { createState, type ModuleState } from './state.js'
import { processResponse } from './process-response.js'
import { CommandQueue } from './command-queue.js'
import { NoticeListener } from './notices.js'
import { Link } from './link.js'
import { CONTROL_NAK, describeError } from './utils.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

/** Poll ticks between full snapshots while notifications are running, to recover from a dropped datagram. */
const FULL_SNAPSHOT_EVERY = 20

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig
	state: ModuleState = createState(undefined)
	model: Model | undefined

	private link: Link | undefined
	private queue: CommandQueue
	private notices: NoticeListener | undefined

	private pollTimer: NodeJS.Timeout | undefined
	private uiUpdateTimer: NodeJS.Timeout | undefined
	private pollsSinceFullSnapshot = 0

	constructor(internal: unknown) {
		super(internal)

		this.queue = new CommandQueue({
			write: (payload) => {
				if (this.link?.send(payload) === false) {
					this.log('error', 'Network error: the command could not be sent.')
				}
			},
			isConnected: () => this.link?.isConnected === true,
			processFrame: (frame) => {
				if (frame.includes(CONTROL_NAK)) {
					this.log('error', `Error: ${frame} Error type: ${describeError(frame)}`)
				} else {
					processResponse(this, frame)
				}
			},
			pipelineDepth: () => (this.config?.pipeline_depth > 0 ? this.config.pipeline_depth : 8),
			log: (level, message) => this.log(level, message),
			onNotConnected: () => this.stopPolling(),
		})
	}

	async init(config: ModuleConfig): Promise<void> {
		await this.configUpdated(config)
	}

	async destroy(): Promise<void> {
		this.stopPolling()
		this.notices?.stop()
		this.queue.clearResponseTimeout()

		if (this.uiUpdateTimer !== undefined) {
			clearTimeout(this.uiUpdateTimer)
			this.uiUpdateTimer = undefined
		}

		this.link?.close()
		this.link = undefined
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.stopPolling()
		this.notices?.stop()

		this.config = config
		this.model = getModel(config.model)
		this.state = createState(this.model)

		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresets()

		this.initTCP()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	// --- connection -----------------------------------------------------------------------------

	private initTCP(): void {
		this.link?.close()

		this.link = new Link({
			host: this.config.host,
			port: this.config.port > 0 ? this.config.port : 17300,
			// Silence only means the link is dead if something was asked for in the first place.
			expectsTraffic: () => this.config.polling === true,
			onConnect: () => {
				this.queue.reset()

				this.initNotices()
				this.applyLevelMeterInterval()
				this.requestDeviceInfo()
				this.initPolling()
			},
			onDisconnect: () => {
				this.stopPolling()
				this.queue.clearResponseTimeout()
			},
			onData: (chunk) => this.queue.handleIncoming(chunk),
			onStatus: (status, message) => this.updateStatus(status, message),
			log: (level, message) => this.log(level, message),
		})

		this.link.open()
	}

	private initNotices(): void {
		this.notices?.stop()

		if (this.config.notices !== true) {
			return
		}

		this.notices = new NoticeListener({
			address: this.config.multicast_address,
			port: this.config.multicast_port,
			interface: this.config.multicast_interface ?? '',
			host: this.config.host,
			processFrame: (frame) => processResponse(this, frame),
			log: (level, message) => this.log(level, message),
		})

		this.notices.start()
	}

	/**
	 * Level meter notifications are only sent while an interval is set, and the mixer keeps that setting,
	 * so ask for the rate we want rather than relying on whatever was left behind.
	 */
	private applyLevelMeterInterval(): void {
		if (this.config.notices !== true || this.config.level_meters !== true) {
			return
		}

		const interval = this.config.level_meter_interval > 0 ? this.config.level_meter_interval : 100

		this.sendCommand('s_level_meter_interval', 'S', `${interval}`)
	}

	// --- commands -------------------------------------------------------------------------------

	sendCommand(cmd: string, handshake: string, params: string): void {
		this.queue.send(cmd, handshake, params)
	}

	pollCommand(cmd: string, handshake: string, params: string): void {
		this.queue.poll(cmd, handshake, params)
	}

	// --- state ----------------------------------------------------------------------------------

	/**
	 * Variables and feedbacks are refreshed once per batch of responses rather than once per response.
	 * A poll of an ATDM-1012 returns 200 responses, and rebuilding every variable for each of them pushes
	 * tens of thousands of updates a second at Companion for no benefit.
	 */
	requestUiUpdate(): void {
		if (this.uiUpdateTimer !== undefined) {
			return
		}

		this.uiUpdateTimer = setTimeout(() => {
			this.uiUpdateTimer = undefined
			checkVariables(this)
			this.checkFeedbacks(...FEEDBACK_IDS)
		}, 100)
	}

	/**
	 * The mixer confirms a set command with an ACK, but the new value is only reported by the next poll.
	 * At a ten second interval that leaves a button showing the old state long enough to read as the
	 * command having been ignored. Applying the change locally keeps the button honest; the next poll or
	 * notification still wins if the mixer disagrees.
	 */
	setOutputMuteState(outputChannel: string | number, mute: boolean): void {
		const id = outputChannel.toString()
		const existing = this.state.output_mutes.find((channel) => channel.id === id)

		if (existing) {
			existing.mute = mute
		} else {
			this.state.output_mutes.push({ id, mute })
		}

		this.requestUiUpdate()
	}

	setInputMuteState(inputChannel: string | number, mute: boolean): void {
		const id = inputChannel.toString()
		const existing = this.state.input_gain_levels.find((channel) => channel.id === id)

		if (existing) {
			existing.mute = mute
		} else {
			this.state.input_gain_levels.push({ id, mute })
		}

		this.requestUiUpdate()
	}

	setOperatorFaderMuteState(page: string | number, fader: string | number, mute: boolean): void {
		const index = Number(page) - 1

		if (!this.state.operator_page[index]) {
			return
		}

		this.state.operator_page[index][`fader_${fader}_mute`] = mute

		this.requestUiUpdate()
	}

	setArrayMicMuteState(mute: boolean): void {
		this.state.arraymic_mute = mute

		this.requestUiUpdate()
	}

	// --- polling --------------------------------------------------------------------------------

	private stopPolling(): void {
		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			this.pollTimer = undefined
		}
	}

	private initPolling(): void {
		if (this.pollTimer !== undefined || this.config.polling !== true) {
			return
		}

		const interval = this.config.poll_interval > 0 ? this.config.poll_interval : 1000

		this.pollsSinceFullSnapshot = 0
		this.buildPollBatch(true)

		this.pollTimer = setInterval(() => {
			// Never stack poll batches. If the previous one has not drained the queue would grow without
			// bound and every button press would end up behind it.
			if (this.queue.pollQueueLength > 0) {
				return
			}

			// With notifications on, most values arrive as they change, so only the settings the mixer
			// never announces are asked for each tick. UDP can drop a datagram, so take a full snapshot
			// every so often to resynchronise.
			this.pollsSinceFullSnapshot++

			const full = this.config.notices !== true || this.pollsSinceFullSnapshot >= FULL_SNAPSHOT_EVERY

			if (full) {
				this.pollsSinceFullSnapshot = 0
			}

			this.buildPollBatch(full)
		}, interval)
	}

	/** Values that only change when somebody reconfigures the mixer. Asked for once per connection. */
	private requestDeviceInfo(): void {
		const model = this.model

		if (!model) {
			return
		}

		if (model.variables.includes('device_info')) {
			this.pollCommand('g_firmware_version', 'O', '')

			if (model.id === 'atdm-1012') {
				this.pollCommand('g_deviceid', 'O', '') // the ATDM-0604 has no device ID command
			}
		}

		if (model.variables.includes('preset_names')) {
			for (const preset of model.preset_choices) {
				this.pollCommand('g_name_bank', 'O', `${preset.id}`)
			}
		}
	}

	/**
	 * @param full ask for everything, rather than only the settings the mixer never announces through a
	 *             notification
	 */
	private buildPollBatch(full: boolean): void {
		const model = this.model

		if (!model) {
			return
		}

		// Values that arrive as notifications when notifications are enabled.
		const announced = !full

		if (!announced && model.data_request.includes('gopl')) {
			for (let i = 1; i <= 8; i++) {
				for (let j = 1; j <= 8; j++) {
					this.pollCommand('GOPL', 'O', `${i},${j}`)
				}
			}
		}

		if (!announced && model.data_request.includes('gopm')) {
			for (let i = 1; i <= 8; i++) {
				for (let j = 1; j <= 8; j++) {
					this.pollCommand('GOPM', 'O', `${i},${j}`)
				}
			}
		}

		if (model.data_request.includes('input_channel_settings')) {
			for (const channel of model.input_channels_request) {
				this.pollCommand('g_input_channel_settings', 'O', `${channel.id}`)
			}
		}

		if (model.data_request.includes('subinput_channel_settings')) {
			for (const channel of model.sub_input_channels ?? []) {
				this.pollCommand('g_subinput_channel_settings', 'O', `${channel.id}`)
			}
		}

		if (!announced && model.data_request.includes('input_gain_level')) {
			for (const channel of model.input_channels) {
				this.pollCommand('g_input_gain_level', 'O', `${channel.id}`)
			}
		}

		if (model.data_request.includes('output_channel_settings')) {
			for (const channel of model.output_channels) {
				this.pollCommand('g_output_channel_settings', 'O', `${channel.id}`)
			}
		}

		if (!announced && model.data_request.includes('output_level')) {
			for (const channel of model.output_channels) {
				this.pollCommand('g_output_level', 'O', `${channel.id}`)
			}
		}

		if (!announced && model.data_request.includes('output_mute')) {
			for (const channel of model.output_channels) {
				this.pollCommand('g_output_mute', 'O', `${channel.id}`)
			}
		}

		if (!announced && model.data_request.includes('preset_number')) {
			this.pollCommand('g_preset_number', 'O', '')
		}

		if (!announced && model.data_request.includes('partial_preset_number')) {
			this.pollCommand('g_partial_preset_number', 'O', '')
		}

		// Level meters are not polled: the mixer streams them as notifications at the interval set by
		// s_level_meter_interval, which is far cheaper than one request per monitor point.
	}
}
