// Audio Technica Digital Mixer

const { InstanceBase, InstanceStatus, Regex, runEntrypoint, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')

const config = require('./src/config')
const actions = require('./src/actions')
const feedbacks = require('./src/feedbacks')
const variables = require('./src/variables')
const presets = require('./src/presets')

const utils = require('./src/utils')

const models = require('./src/models')
const constants = require('./src/constants')

class moduleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...utils,
			...models,
			...constants
		})

		this.socket = undefined

		this.pollTimer = undefined

		this.DATA = {}

		this.CONTROL_MODELID= '0000';
		this.CONTROL_UNITNUMBER = '00';
		this.CONTROL_CONTINUESELECT = 'NC';
		this.CONTROL_ACK = 'ACK'
		this.CONTROL_NAK = 'NAK'
		this.CONTROL_END = '\r';

		this.DATA = {
			operator_page: []
		}

		for (let i = 1; i <= 8; i++) {
			let obj = {}
			for (let j = 1; j <=8; j++) {
				obj[`fader_${j}_level`] = ''
				obj[`fader_${j}_mute`] = false
			}
			this.DATA.operator_page.push(obj);
		}
	}

	async destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
		}

		//debug('destroy', this.id)
	}

	async init(config) {
		this.updateStatus(InstanceStatus.Connecting)
		this.configUpdated(config)
	}

	async configUpdated(config) {
		// polling is running and polling has been de-selected by config change
		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
		}
		this.config = config

		this.setUpInternalDataArrays();
		
		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()

		this.initTCP()
	}

	setUpInternalDataArrays() {
		let model = this.MODELS.find((model) => model.id == this.config.model);

		if (model.data_request.includes('input_channel_settings')) {
			this.DATA.input_channel_settings = [];
		}

		if (model.data_request.includes('input_gain_level')) {
			this.DATA.input_gain_levels = [];
		}

		if (model.data_request.includes('output_channel_settings')) {
			this.DATA.output_channel_settings = [];
		}

		if (model.data_request.includes('output_level')) {
			this.DATA.output_levels = [];
		}

		if (model.data_request.includes('output_mute')) {
			this.DATA.output_mutes = [];
		}

		if (model.data_request.includes('level_meter')) {
			this.DATA.meter_levels = [];
		}

		this.DATA.open_channels = [];
	}

	initTCP() {
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
			})

			this.socket.on('connect', () => {
				this.initPolling()

				this.updateStatus(InstanceStatus.Ok)
			})

			this.socket.on('data', (receivebuffer) => {
				pipeline += receivebuffer.toString('utf8')

				//this whole area needs work because I think ACKs are sent on good response as well as a request for data

				if (pipeline.includes(this.CONTROL_ACK)) { // ACKs are sent when a command is received, no processing is needed
					pipeline = '';
				}
				else if (pipeline.includes(this.CONTROL_NAK)) {// NAKs are sent on error, let's see what error we got
					this.processError(pipeline)
					pipeline = '';
				}
				else if (pipeline.includes(this.CONTROL_END)) { // Every command ends with CR or an ACK if nothing needed
					let pipeline_responses = pipeline.split(this.CONTROL_END);
					for (let i = 0; i < pipeline_responses.length; i++) {
						if (pipeline_responses[i] !== '') {
							this.processResponse(pipeline_responses[i])
						}
					}
					
					pipeline = '';
				}
			})
		}
	}

	sendCommmand(cmd, handshake, params) {
		if (cmd !== undefined) {
			if (this.socket !== undefined && this.socket.isConnected) {
				this.socket.send(this.buildCommand(cmd, handshake, params))
				.then((result) => {
					//console.log('send result: ' + result);
				})
				.catch((error) => {
					//console.log('send error: ' + error);
				});
			} else {
				this.log('error', 'Network error: Connection to Device not opened.')
				clearInterval(this.pollTimer);
			}
		}
	}

	processResponse(response) {
		let category = 'XXX'
		let args = []
		let params = ''
 
		//args = response.split(' ')
		args = response.match(/\\?.|^$/g).reduce((p, c) => {
			if(c === '"'){
				p.quote ^= 1;
			}else if(!p.quote && c === ' '){
				p.a.push('');
			}else{
				p.a[p.a.length-1] += c.replace(/\\(.)/,"$1");
			}
			return  p;
		}, {a: ['']}).a

		if (args.length >= 1) {
			category = args[0].trim().toLowerCase();
		}		

		if (args.length >= 5) {
			params = args[4];
		}
		
		params = params.split(',');

		let model = this.MODELS.find((model) => model.id == this.config.model);

		let inputChannel = '';
		let outputChannel = '';

		let found = false;

		switch (category) {
			case 'g_input_channel_settings':
				inputChannel = params[0].toString();

				let inputChannelSettingsObj = {
					id: inputChannel,
					source: params[1].toString(),
					phantomPower: (params[2].toString() == '1' ? true : false),
					phase: (params[3].toString() == '1' ? 'Invert' : 'Normal'),
					lowCut: (params[4].toString() == '1' ? true : false),
					aec: (params[5].toString() == ' 1' ? true : false),
					smartMix: (params[6].toString() == '1' ? true : false),
					link: (params[7].toString() == '1' ? 'Link' : 'Unlink'),
					//8-18 are reserved
					channelName: params[19] || '',
					color: params[20] || '',
					virtualMicOrientation: params[21] || '',
					virtualMicTilt: params[22] || '',
					virtualMicPattern: params[23] || '',
					//24 is reserved
					faderGroup: params[25] || '',
					smartMixGroup: params[26] || '',
					mono: (params[27] == '1' ? true : false)
				}

				found = false;

				for (let i = 0; i < this.DATA.input_channel_settings.length; i++) { 
					if (this.DATA.input_channel_settings[i].id == inputChannel) {
						//update in place
						this.DATA.input_channel_settings[i] = inputChannelSettingsObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.input_channel_settings.push(inputChannelSettingsObj);
				}

				break;
			case 'g_input_gain_level':
				inputChannel = params[0].toString();
				let model_inputChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputChannel);

				let inputGainLevelObj = {
					id: inputChannel,
					mic_gain: this.input_gain_table_mic.find((ROW) => ROW.id == params[1].toString()).id,
					mic_gain_label: this.input_gain_table_mic.find((ROW) => ROW.id == params[1].toString()).label,
					line_gain: this.input_gain_table_line.find((ROW) => ROW.id == params[2].toString()).id,
					line_gain_label: this.input_gain_table_line.find((ROW) => ROW.id == params[2].toString()).label,
					level: this.fader_table.find((ROW) => ROW.id == params[3].toString()).id,
					level_label: this.fader_table.find((ROW) => ROW.id == params[3].toString()).label,
					max_vol_enabled: (params[4].toString() == '1' ? true : false),
					max_vol: this.fader_table.find((ROW) => ROW.id == params[5].toString()).id,
					max_vol_label: this.fader_table.find((ROW) => ROW.id == params[5].toString()).label,
					mute: (params[6].toString() == '1' ? true : false),
					virtual_mic_gain: 0
				}

				if (model_inputChannelObj.id == 'atdm-1012') {
					inputGainLevelObj.min_vol_enabled = (params[7].toString() == '1' ? true : false);
					inputGainLevelObj.min_vol = this.fader_table.find((ROW) => ROW.id == params[8].toString()).id;
					inputGainLevelObj.min_vol_label = this.fader_table.find((ROW) => ROW.id == params[8].toString()).label;
				}
				
				found = false;

				for (let i = 0; i < this.DATA.input_gain_levels.length; i++) {
					if (this.DATA.input_gain_levels[i].id == inputChannel) {
						//update in place
						this.DATA.input_gain_levels[i] = inputGainLevelObj;
						found = true;
						break;
					}
				}
				
				if (!found) {
					//add to array
					this.DATA.input_gain_levels.push(inputGainLevelObj);
				}
				break
			case 'md_input_gain_level_notice':
				inputChannel = params[0].toString();

				let notice_inputGainLevelObj = {
					id: inputChannel,
					mic_gain: this.input_gain_table_mic.find((ROW) => ROW.id == params[1].toString()).label,
					line_gain: this.input_gain_table_line.find((ROW) => ROW.id == params[2].toString()).label,
					level: this.fader_table.find((ROW) => ROW.id == params[3].toString()).label,
					mute: (params[4].toString() == '1' ? true : false)
				}
				
				found = false;

				for (let i = 0; i < this.DATA.input_gain_levels.length; i++) {
					if (this.DATA.input_gain_levels[i].id == inputChannel) {
						//update in place
						this.DATA.input_gain_levels[i].mic_gain = notice_inputGainLevelObj.mic_gain;
						this.DATA.input_gain_levels[i].line_gain = notice_inputGainLevelObj.line_gain;
						this.DATA.input_gain_levels[i].level = notice_inputGainLevelObj.level;
						this.DATA.input_gain_levels[i].mute = notice_inputGainLevelObj.mute;
						found = true;
						break;
					}
				}
				
				if (!found) {
					//add to array
					this.DATA.input_gain_levels.push(notice_inputGainLevelObj);
				}
				break
			case 'g_output_channel_settings':
				outputChannel = params[0].toString();
				let outputChannelSettingsObj = {
					id: outputChannel,
					unity: params[1].toString(),
					channelName: params[2].toString(),
					color: params[3] || '',
					link: (params[4] == '1' ? 'Link' : 'Unlink'),
					source: params[5] || '',
					faderGroup: params[6] || ''
				}

				found = false;

				for (let i = 0; i < this.DATA.output_channel_settings.length; i++) {
					if (this.DATA.output_channel_settings[i].id == outputChannel) {
						//update in place
						this.DATA.output_channel_settings[i] = outputChannelSettingsObj;
						found = true;
						break;
					}
				}
				
				if (!found) {
					//add to array
					this.DATA.output_channel_settings.push(outputChannelSettingsObj);
				}
				break
			case 'g_output_level':
				outputChannel = params[0].toString();
				let outputLevelObj = {
					id: outputChannel,
					level: this.fader_table.find((ROW) => ROW.id == params[1].toString()).id,
					level_label: this.fader_table.find((ROW) => ROW.id == params[1].toString()).label,
					max_vol_enabled: (params[2].toString() == '1' ? true : false),
					max_vol: this.fader_table.find((ROW) => ROW.id == params[3].toString()).id,
					max_vol_label: this.fader_table.find((ROW) => ROW.id == params[3].toString()).label,
					min_vol_enabled: (params[4].toString() == '1' ? true : false),
					min_vol: this.fader_table.find((ROW) => ROW.id == params[5].toString()).id,
					min_vol_label: this.fader_table.find((ROW) => ROW.id == params[5].toString()).label,
				}

				found = false;

				for (let i = 0; i < this.DATA.output_levels.length; i++) {
					if (this.DATA.output_levels[i].id == outputChannel) {
						//update in place
						this.DATA.output_levels[i] = outputLevelObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.output_levels.push(outputLevelObj);
				}
				break
			case 'md_output_level_notice':
				outputChannel = params[0].toString();
				let notice_outputLevelObj = {
					id: outputChannel,
					level: this.fader_table.find((ROW) => ROW.id == params[1].toString()).label
				}

				found = false;

				for (let i = 0; i < this.DATA.output_levels.length; i++) {
					if (this.DATA.output_levels[i].id == outputChannel) {
						//update in place
						this.DATA.output_levels[i].level = notice_outputLevelObj.level;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.output_levels.push(notice_outputLevelObj);
				}
				break
			case 'g_output_mute':
				outputChannel = params[0].toString();
				let outputMuteObj = {
					id: outputChannel,
					mute: (params[1].toString() == '1' ? true : false)
				}

				found = false;

				for (let i = 0; i < this.DATA.output_mutes.length; i++) {
					if (this.DATA.output_mutes[i].id == outputChannel) {
						//update in place
						this.DATA.output_mutes[i] = outputMuteObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.output_mutes.push(outputMuteObj);
				}
				break;
			case 'g_preset_number':
				this.DATA.preset_number = params[0].toString()
				break;
			case 'md_recall_preset_notice':
				this.DATA.preset_number = params[0].toString()
				break;
			case 'g_partial_preset_number':
				this.DATA.partial_preset_number = params[0].toString()
				break;
			case 'md_recall_partial_preset_notice':
				this.DATA.partial_preset_number = params[0].toString()
				break;
			case 'g_level_meter':
				let monitorPoint = params[0].toString();
				let meterLevelObj = {
					monitorPoint: monitorPoint,
					level: params[1].toString()
				}

				found = false;

				for (let i = 0; i < this.DATA.meter_levels.length; i++) {
					if (this.DATA.meter_levels[i].monitorPoint == monitorPoint) {
						//update in place
						this.DATA.meter_levels[i] = meterLevelObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.meter_levels.push(meterLevelObj);
				}
				break;
			case 'md_level_meter_notice':
				for (let i = 0; i < params.length; i++) {
					let notice_monitorPoint = (i+1);

					for (let i = 0; i < this.DATA.meter_levels.length; i++) {
						if (this.DATA.meter_levels[i].monitorPoint == notice_monitorPoint) {
							//update in place
							this.DATA.meter_levels[i] = params[i];
							break;
						}
					}
				}

				break
			case 'md_open_channel_notice':
				inputChannel = params[0].toString();

				let openChannelObj = {
					id: inputChannel,
					smartmixGroup: params[1].toString(),
					status: (params[2].toString() == '1' ? true : false)
				}

				found = false;

				for (let i = 0; i < this.DATA.open_channels.length; i++) { 
					if (this.DATA.open_channels[i].id == inputChannel) {
						if (this.DATA.open_channels[i].smartmixGroup == openChannelObj.smartmixGroup) {
							//update in place
							this.DATA.open_channels[i] = openChannelObj;
							found = true;
							break;
						}
					}
				}

				if (!found) {
					//add to array
					this.DATA.input_channel_settings.push(openChannelObj);
				}
				break;
		}

		this.checkFeedbacks()
		this.checkVariables()
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
								this.sendCommmand('GOPL', 'O', `${i},${j}`)
							}
						}
					}

					if (model.data_request.includes('gopm')) {
						for (let i = 1; i <= 8; i++) {
							for (let j = 1; j <=8; j++) {
								this.sendCommmand('GOPM', 'O', `${i},${j}`)
							}
						}
					}

					if (model.data_request.includes('input_channel_settings')) {
						for (let i = 0; i < model.input_channels.length; i++) {
							this.sendCommmand('g_input_channel_settings', 'O', `${model.input_channels[i].id}`)
						}
					}

					if (model.data_request.includes('input_gain_level')) {
						for (let i = 0; i < model.input_channels.length; i++) {
							this.sendCommmand('g_input_gain_level', 'O', `${model.input_channels[i].id}`)
						}
					}

					if (model.data_request.includes('output_channel_settings')) {
						for (let i = 0; i < model.output_channels.length; i++) {
							this.sendCommmand('g_output_channel_settings', 'O', `${model.output_channels[i].id}`)
						}
					}

					if (model.data_request.includes('output_level')) {
						for (let i = 0; i < model.output_channels.length; i++) {
							this.sendCommmand('g_output_level', 'O', `${model.output_channels[i].id}`)
						}
					}

					if (model.data_request.includes('output_mute')) {
						for (let i = 0; i < model.output_channels.length; i++) {
							this.sendCommmand('g_output_mute', 'O', `${model.output_channels[i].id}`)
						}
					}

					if (model.data_request.includes('preset_number')) {
						this.sendCommmand('g_preset_number', 'O', ``)
					}

					if (model.data_request.includes('partial_preset_number')) {
						this.sendCommmand('g_partial_preset_number', 'O', ``)
					}

					if (model.data_request.includes('level_meter')) {
						for (let i = 0; i <= 43; i++) {
							//this.sendCommmand('g_level_meter', 'O', `${i}`)
						}
					}
				}

			}, this.config.poll_interval)
		}
	}
}

runEntrypoint(moduleInstance, UpgradeScripts)
