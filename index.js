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
			...models,
			...constants,
            ...processResponse,
		})

		this.socket = undefined

		this.cmdPipe = [];
		this.lastReturnedCommand = undefined;

		this.pollTimer = undefined

		this.CONTROL_MODELID= '0000';
		this.CONTROL_UNITNUMBER = '00';
		this.CONTROL_CONTINUESELECT = 'NC';
		this.CONTROL_ACK = 'ACK'
		this.CONTROL_NAK = 'NAK'
		this.CONTROL_END = '\r';

		this.DATA = {};
	}

	async destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	async configUpdated(config) {
		// polling is running and polling has been de-selected by config change
		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
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

		let pipeline = ''

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.config.port === undefined) {
			this.config.port = 17300
		}

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				this.log('error', 'Network error: ' + err.message)
				this.updateStatus(InstanceStatus.ConnectionFailure)
				clearInterval(this.pollTimer);
				this.socket.destroy()
				this.socket == null

				if (err.message.toString().indexOf('ECONNRESET') > -1) {
					setTimeout(initTCP, 10000); //try again in 10 seconds
				}
			})

			this.socket.on('connect', () => {
				this.cmdPipe = []

				this.initPolling()

				this.updateStatus(InstanceStatus.Ok)
			})

			this.socket.on('data', (receivebuffer) => {
				pipeline += receivebuffer.toString('utf8')

				if (pipeline.includes(this.CONTROL_ACK)) { // ACKs are sent when a command is received, no processing is needed, we should have one command to one ACK
					pipeline = '';
				}
				else if (pipeline.includes(this.CONTROL_END)) { // Every command ends with CR or an ACK if nothing needed
					let pipeline_responses = pipeline.split(this.CONTROL_END);
					for (let i = 0; i < pipeline_responses.length; i++) {
						if (pipeline_responses[i] !== '') {
							if (pipeline_responses[i].includes(this.CONTROL_NAK)) {// NAKs are sent on error, let's see what error we got
								this.processError(pipeline_responses[i])
							}
							else {
								this.processResponse(pipeline_responses[i])
							}
						}
					}

					pipeline = '';
				}

				this.lastReturnedCommand = this.cmdPipeNext()
			})
		}
	}

	cmdPipeNext() {
		const return_cmd = this.cmdPipe.shift()

		if(this.cmdPipe.length > 0) {
			let command = this.cmdPipe[0];
			this.runCommand(command.cmd, command.handshake, command.params);
		}

		return return_cmd
	}

	sendCommand(cmd, handshake, params) {
		if (cmd !== undefined) {
			this.cmdPipe.push({
				cmd: cmd,
				handshake: handshake,
				params: params
			});

			if(this.cmdPipe.length === 1) {
				this.runCommand(cmd, handshake, params);
			}
		}
	}

	runCommand(cmd, handshake, params) {
		if (this.socket !== undefined && this.socket.isConnected) {
			console.log('sending: ' + this.buildCommand(cmd, handshake, params));
			this.socket.send(this.buildCommand(cmd, handshake, params))
			.then((result) => {
				//console.log('send result: ' + result);
			})
			.catch((error) => {
				//console.log('send error: ' + error);
			});
		}
		else {
			this.log('error', 'Network error: Connection to Device not opened.')
			clearInterval(this.pollTimer);
		}
	}

	initPolling() {
		if (this.pollTimer === undefined && this.config.poll_interval > 0) {
			this.pollTimer = setInterval(() => {
				let model = this.MODELS.find((model) => model.id == this.config.model);

				if (model) {
					//grab specific data requests as per model
					if (model.data_request.includes('gopl')) {
						for (let i = 1; i <= 8; i++) {
							for (let j = 1; j <=8; j++) {
								this.sendCommand('GOPL', 'O', `${i},${j}`)
							}
						}
					}

					if (model.data_request.includes('gopm')) {
						for (let i = 1; i <= 8; i++) {
							for (let j = 1; j <=8; j++) {
								this.sendCommand('GOPM', 'O', `${i},${j}`)
							}
						}
					}

					if (model.data_request.includes('input_channel_settings')) {
						for (let i = 0; i < model.input_channels_request.length; i++) {
							this.sendCommand('g_input_channel_settings', 'O', model.input_channels_request[i].id)
						}
					}

					if (model.data_request.includes('subinput_channel_settings')) {
						for (let i = 0; i < model.sub_input_channels.length; i++) {
							this.sendCommand('g_subinput_channel_settings', 'O', model.sub_input_channels[i].id)
						}
					}

					if (model.data_request.includes('input_gain_level')) {
						for (let i = 0; i < model.input_channels.length; i++) {
							this.sendCommand('g_input_gain_level', 'O', model.input_channels[i].id)
						}
					}

					if (model.data_request.includes('output_channel_settings')) {
						for (let i = 0; i < model.output_channels.length; i++) {
							this.sendCommand('g_output_channel_settings', 'O', model.output_channels[i].id)
						}
					}

					if (model.data_request.includes('output_level')) {
						for (let i = 0; i < model.output_channels.length; i++) {
							this.sendCommand('g_output_level', 'O', model.output_channels[i].id)
						}
					}

					if (model.data_request.includes('output_mute')) {
						for (let i = 0; i < model.output_channels.length; i++) {
							this.sendCommand('g_output_mute', 'O', model.output_channels[i].id)
						}
					}

					if (model.data_request.includes('preset_number')) {
						this.sendCommand('g_preset_number', 'O', ``)
					}

					if (model.data_request.includes('partial_preset_number')) {
						this.sendCommand('g_partial_preset_number', 'O', ``)
					}

					if (model.data_request.includes('level_meter')) {
						for (let i = 0; i <= 43; i++) {
							//this.sendCommand('g_level_meter', 'O', `${i}`)
						}
					}
				}

			}, this.config.poll_interval)
		}
	}
}

runEntrypoint(atdmInstance, UpgradeScripts)
