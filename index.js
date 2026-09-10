// Audio Technica Digital Mixer

const { InstanceBase, InstanceStatus, Regex, runEntrypoint, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')

const config = require('./src/config')
const actions = require('./src/actions')
const feedbacks = require('./src/feedbacks')
const variables = require('./src/variables')
const presets = require('./src/presets')
const internalData = require('./src/data')
const processResponse = require('./src/process-response')

const utils = require('./src/utils')
const commandQueue = require('./src/command-queue')
const notices = require('./src/notices')

const models = require('./src/models')
const constants = require('./src/constants')

class atdmInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...internalData,
			...utils,
			...commandQueue,
			...notices,
			...models,
			...constants,
            ...processResponse,
		})

		this.socket = undefined
		this.noticeSocket = undefined

		this.lastReturnedCommand = undefined

		this.responseTimer = undefined
		this.uiUpdateTimer = undefined
		this.pollTimer = undefined
		this.reconnectTimer = undefined

		this.CONTROL_MODELID= '0000';
		this.CONTROL_UNITNUMBER = '00';
		this.CONTROL_CONTINUESELECT = 'NC';
		this.CONTROL_ACK = 'ACK'
		this.CONTROL_NAK = 'NAK'
		this.CONTROL_END = '\r';

		// The mixer answers in about a millisecond, so anything near this means the response was lost.
		this.RESPONSE_TIMEOUT = 5000

		// Commands in flight at once. The protocol allows this; the mixer NAKs with 90 (Busy) if pushed
		// too hard, and the window drops to one for a moment when that happens.
		// Poll ticks between full snapshots while notifications are running, to recover from a dropped
		// datagram.
		this.FULL_SNAPSHOT_EVERY = 20

		this.PIPELINE_DEPTH = 8
		this.PIPELINE_DEPTH_MAX = 32
		this.BUSY_BACKOFF = 2000

		// Defaults from the protocol specification; the mixer lets both be changed.
		this.MULTICAST_ADDRESS = '225.0.0.100'
		this.MULTICAST_PORT = 17000

		this.DATA = {};

		this.resetQueues()
	}

	async destroy() {
		this.stopPolling()
		this.stopNotices()
		this.clearResponseTimeout()

		if (this.uiUpdateTimer !== undefined) {
			clearTimeout(this.uiUpdateTimer)
			this.uiUpdateTimer = undefined
		}

		if (this.reconnectTimer !== undefined) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}

		if (this.socket !== undefined) {
			this.socket.destroy()
			this.socket = undefined
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	async configUpdated(config) {
		this.stopPolling()
		this.stopNotices()

		if (this.reconnectTimer !== undefined) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}

		this.config = config

		this.initData();
		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()

		this.initTCP()
	}

	initTCP() {
		this.updateStatus(InstanceStatus.Connecting)

		if (this.socket !== undefined) {
			this.socket.destroy()
			this.socket = undefined
		}

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port > 0 ? this.config.port : 17300)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				this.log('error', 'Network error: ' + err.message)
				this.updateStatus(InstanceStatus.ConnectionFailure)
				this.stopPolling()
				this.clearResponseTimeout()

				if (this.socket !== undefined) {
					this.socket.destroy()
					this.socket = undefined
				}

				if (err.message.toString().indexOf('ECONNRESET') > -1 && this.reconnectTimer === undefined) {
					this.reconnectTimer = setTimeout(() => {
						this.reconnectTimer = undefined
						this.initTCP()
					}, 10000) //try again in 10 seconds
				}
			})

			this.socket.on('connect', () => {
				this.resetQueues()

				this.initNotices()
				this.applyLevelMeterInterval()
				this.requestDeviceInfo()
				this.initPolling()

				this.updateStatus(InstanceStatus.Ok)
			})

			this.socket.on('data', (receivebuffer) => {
				this.handleIncoming(receivebuffer.toString('utf8'))
			})
		}
	}

	/**
	 * Variables and feedbacks are refreshed once per batch of responses rather than once per response.
	 * A poll of an ATDM-1012 returns 200 responses, and rebuilding every variable for each of them
	 * pushes tens of thousands of updates a second at Companion for no benefit.
	 */
	requestUiUpdate() {
		if (this.uiUpdateTimer !== undefined) {
			return
		}

		this.uiUpdateTimer = setTimeout(() => {
			this.uiUpdateTimer = undefined
			this.checkVariables()
			this.checkFeedbacks()
		}, 100)
	}

	stopPolling() {
		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			this.pollTimer = undefined
		}

		this.pollQueue = []
	}

	initPolling() {
		if (this.pollTimer !== undefined || this.config.polling !== true) {
			return
		}

		const interval = this.config.poll_interval > 0 ? this.config.poll_interval : 1000

		this.pollsSinceFullSnapshot = 0

		this.buildPollBatch(true) // populate variables and feedbacks now rather than one interval from now

		this.pollTimer = setInterval(() => {
			// Never stack poll batches. If the previous one has not drained the queue would grow without
			// bound and every button press would end up behind it.
			if (this.pollQueue.length > 0) {
				return
			}

			// With notifications on, most values arrive as they change, so only the settings the mixer
			// never announces are asked for each tick. UDP can drop a datagram, so take a full snapshot
			// every so often to resynchronise.
			this.pollsSinceFullSnapshot++

			const full = this.config.notices !== true || this.pollsSinceFullSnapshot >= this.FULL_SNAPSHOT_EVERY

			if (full) {
				this.pollsSinceFullSnapshot = 0
			}

			this.buildPollBatch(full)
		}, interval)
	}

	/**
	 * Values that only change when somebody reconfigures the mixer. Asked for once per connection rather
	 * than on every poll.
	 */
	requestDeviceInfo() {
		let model = this.MODELS.find((model) => model.id == this.config.model)

		if (!model) {
			return
		}

		if (model.variables.includes('device_info')) {
			this.pollCommand('g_firmware_version', 'O', '')

			if (model.id == 'atdm-1012') {
				this.pollCommand('g_deviceid', 'O', '') // the ATDM-0604 has no device ID command
			}
		}

		if (model.variables.includes('preset_names')) {
			for (let i = 0; i < model.preset_choices.length; i++) {
				this.pollCommand('g_name_bank', 'O', `${model.preset_choices[i].id}`)
			}
		}
	}

	/**
	 * @param {boolean} full ask for everything, rather than only the settings the mixer never
	 *                       announces through a notification
	 */
	buildPollBatch(full) {
		let model = this.MODELS.find((model) => model.id == this.config.model);

		if (!model) {
			return
		}

		// Values that arrive as notifications when notifications are enabled.
		const announced = full !== true

		//grab specific data requests as per model
		if (!announced && model.data_request.includes('gopl')) {
			for (let i = 1; i <= 8; i++) {
				for (let j = 1; j <=8; j++) {
					this.pollCommand('GOPL', 'O', `${i},${j}`)
				}
			}
		}

		if (!announced && model.data_request.includes('gopm')) {
			for (let i = 1; i <= 8; i++) {
				for (let j = 1; j <=8; j++) {
					this.pollCommand('GOPM', 'O', `${i},${j}`)
				}
			}
		}

		if (model.data_request.includes('input_channel_settings')) {
			for (let i = 0; i < model.input_channels_request.length; i++) {
				this.pollCommand('g_input_channel_settings', 'O', model.input_channels_request[i].id)
			}
		}

		if (model.data_request.includes('subinput_channel_settings')) {
			for (let i = 0; i < model.sub_input_channels.length; i++) {
				this.pollCommand('g_subinput_channel_settings', 'O', model.sub_input_channels[i].id)
			}
		}

		if (!announced && model.data_request.includes('input_gain_level')) {
			for (let i = 0; i < model.input_channels.length; i++) {
				this.pollCommand('g_input_gain_level', 'O', model.input_channels[i].id)
			}
		}

		if (model.data_request.includes('output_channel_settings')) {
			for (let i = 0; i < model.output_channels.length; i++) {
				this.pollCommand('g_output_channel_settings', 'O', model.output_channels[i].id)
			}
		}

		if (!announced && model.data_request.includes('output_level')) {
			for (let i = 0; i < model.output_channels.length; i++) {
				this.pollCommand('g_output_level', 'O', model.output_channels[i].id)
			}
		}

		if (!announced && model.data_request.includes('output_mute')) {
			for (let i = 0; i < model.output_channels.length; i++) {
				this.pollCommand('g_output_mute', 'O', model.output_channels[i].id)
			}
		}

		if (!announced && model.data_request.includes('preset_number')) {
			this.pollCommand('g_preset_number', 'O', ``)
		}

		if (!announced && model.data_request.includes('partial_preset_number')) {
			this.pollCommand('g_partial_preset_number', 'O', ``)
		}

		// Level meters are not polled: the mixer streams them as notifications at the interval set by
		// s_level_meter_interval, which is far cheaper than one request per monitor point.
	}
}

runEntrypoint(atdmInstance, UpgradeScripts)
