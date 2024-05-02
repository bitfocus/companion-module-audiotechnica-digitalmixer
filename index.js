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
			...utils,
			...models,
			...constants
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

		this.DATA = {
			operator_page: []
		}

		for (let i = 1; i <= 8; i++) {
			let obj = {}
			for (let j = 1; j <=8; j++) {
				obj[`fader_${j}_level`] = 0
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

		if (model.data_request.includes('subinput_channel_settings')) {
			this.DATA.sub_input_channel_settings = [];
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

		console.log('processing response: ' + response);
		console.log('params: ' + params);

		let model = this.MODELS.find((model) => model.id == this.config.model);

		let inputChannel = '';
		let outputChannel = '';

		let found = false;

		switch (category) {
			case 'g_input_channel_settings':
				inputChannel = params[0].toString();

				let input_source = '';
				if (params[1]) {
					input_source = params[1].toString();
				}

				let input_phantom_power = false;
				if (params[2]) {
					input_phantom_power = (params[2].toString() == '1' ? true : false);
				}

				let input_phase = 'Normal';
				if (params[3]) {
					input_phase = (params[3].toString() == '1' ? 'Invert' : 'Normal');
				}

				let input_lowcut = false;
				if (params[4]) {
					input_lowcut = (params[4].toString() == '1' ? true : false);
				}

				let input_aec = false;
				if (params[5]) {
					input_aec = (params[5].toString() == '1' ? true : false);
				}

				let input_smartmix = false;
				if (params[6]) {
					input_smartmix = (params[6].toString() == '1' ? true : false);
				}

				let input_link = '';
				if (params[7]) {
					input_link = (params[7].toString() == '1' ? 'Link' : 'Unlink');
				}

				let input_channelname = '';
				if (params[19]) {
					input_channelname = params[19].toString();
				}

				let input_color = '';
				if (params[20]) {
					input_color = params[20].toString();
				}

				let input_virtualmicorientation = '';
				if (params[21]) {
					input_virtualmicorientation = params[21].toString();
				}

				let input_virtualmictilt = '';
				if (params[22]) {
					input_virtualmictilt = params[22].toString();
				}

				let input_virtualmicpattern = '';
				if (params[23]) {
					input_virtualmicpattern = params[23].toString();
				}

				let input_fadergroup = '';
				if (params[25]) {
					input_fadergroup = params[25].toString();
				}

				let input_smartmixgroup = '';
				if (params[26]) {
					input_smartmixgroup = params[26].toString();
				}

				let input_mono = false;
				if (params[27]) {
					input_mono = (params[27].toString() == '1' ? true : false);
				}

				let inputChannelSettingsObj = {
					id: inputChannel,
					source: input_source,
					phantomPower: input_phantom_power,
					phase: input_phase,
					lowCut: input_lowcut,
					aec: input_aec,
					smartMix: input_smartmix,
					link: input_link,
					//8-18 are reserved
					channelName: input_channelname,
					color: input_color,
					virtualMicOrientation: input_virtualmicorientation,
					virtualMicTilt: input_virtualmictilt,
					virtualMicPattern: input_virtualmicpattern,
					//24 is reserved
					faderGroup: input_fadergroup,
					smartMixGroup: input_smartmixgroup,
					mono: input_mono
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
			case 'g_subinput_channel_settings':
				let subinputChannel = params[0].toString();

				let subinput_source = ''
				if (params[1]) {
					subinput_source = params[1].toString();
				}

				let subinputgainlevel_inputgaintablemicObj = this.input_gain_table_mic.find((ROW) => ROW.id == params[2].toString());
				let subinputgainlevel_mic_gain = '';
				let subinputgainlevel_mic_gain_label = '';

				if (subinputgainlevel_inputgaintablemicObj !== undefined) {
					subinputgainlevel_mic_gain = subinputgainlevel_inputgaintablemicObj.id;
					subinputgainlevel_mic_gain_label = subinputgainlevel_inputgaintablemicObj.label;
				}

				let subinput_lowcut = false;
				if (params[3]) {
					subinput_lowcut = (params[3].toString() == '1' ? true : false);
				}

				let subinput_link = '';
				if (params[4]) {
					subinput_link = (params[4].toString() == '1' ? 'Link' : 'Unlink');
				}

				let subinput_channelname = '';
				if (params[5]) {
					subinput_channelname = params[5].toString();
				}

				let subinput_color = '';
				if (params[6]) {
					subinput_color = params[6].toString();
				}

				let subinput_fadergroup = '';
				if (params[7]) {
					subinput_fadergroup = params[7].toString();
				}

				let subinputChannelSettingsObj = {
					id: subinputChannel,
					source: subinput_source,
					input_gain: subinputgainlevel_mic_gain,
					input_gain_label: subinputgainlevel_mic_gain_label,
					lowCut: subinput_lowcut,
					link: subinput_link,
					channelName: subinput_channelname,
					color: subinput_color,
					faderGroup: subinput_fadergroup
				}

				found = false;

				for (let i = 0; i < this.DATA.sub_input_channel_settings.length; i++) { 
					if (this.DATA.sub_input_channel_settings[i].id == subinputChannel) {
						//update in place
						this.DATA.sub_input_channel_settings[i] = subinputChannelSettingsObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.sub_input_channel_settings.push(subinputChannelSettingsObj);
				}

				break;
			case 'g_input_gain_level':
				inputChannel = params[0].toString();
				let model_inputChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputChannel);

				let inputgainlevel_mic_gain = '';
				let inputgainlevel_mic_gain_label = '';

				if (params[1]) {
					let inputgainlevel_inputgaintablemicObj = this.input_gain_table_mic.find((ROW) => ROW.id == params[1].toString());
					inputgainlevel_mic_gain = params[1];

					if (inputgainlevel_inputgaintablemicObj !== undefined) {
						inputgainlevel_mic_gain_label = inputgainlevel_inputgaintablemicObj.label;
					}
				}				

				let inputgainlevel_line_gain = '';
				let inputgainlevel_line_gain_label = '';

				if (params[2]) {
					let inputgainlevel_inputgaintablelineObj = this.input_gain_table_line.find((ROW) => ROW.id == params[2].toString());
					inputgainlevel_line_gain = params[2];

					if (inputgainlevel_inputgaintablelineObj !== undefined) {
						inputgainlevel_line_gain_label = inputgainlevel_inputgaintablelineObj.label;
					}
				}
				
				let inputgainlevel_level = '';
				let inputgainlevel_level_label = '';

				if (params[3]) {
					let inputgainlevel_levelfadertableObj = this.fader_table.find((ROW) => ROW.id == params[3].toString());
					inputgainlevel_level = params[3];

					if (inputgainlevel_levelfadertableObj !== undefined) {
						inputgainlevel_level_label = inputgainlevel_levelfadertableObj.label;
					}
				}

				let inputgainlevel_max_vol_enabled = false;

				if (params[4]) {
					inputgainlevel_max_vol_enabled = (params[4].toString() == '1' ? true : false);
				}
				
				let inputgainlevel_max_vol = '';
				let inputgainlevel_max_vol_label = '';

				if (params[5]) {
					let inputgainlevel_maxvolfadertableObj = this.fader_table.find((ROW) => ROW.id == params[5].toString());
					inputgainlevel_max_vol = params[5];

					if (inputgainlevel_maxvolfadertableObj !== undefined) {
						inputgainlevel_max_vol_label = inputgainlevel_maxvolfadertableObj.label;
					}
				}

				let inputgainlevel_mute = false;

				if (params[6]) {
					inputgainlevel_mute = (params[6].toString() == '1' ? true : false);
				}
				
				let inputGainLevelObj = {
					id: inputChannel,
					mic_gain: inputgainlevel_mic_gain,
					mic_gain_label: inputgainlevel_mic_gain_label,
					line_gain: inputgainlevel_line_gain,
					line_gain_label: inputgainlevel_line_gain_label,
					level: inputgainlevel_level,
					level_label: inputgainlevel_level_label,
					max_vol_enabled: inputgainlevel_max_vol_enabled,
					max_vol: inputgainlevel_max_vol,
					max_vol_label: inputgainlevel_max_vol_label,
					mute: inputgainlevel_mute,
					virtual_mic_gain: 0
				}

				if (model.id == 'atdm-1012') {
					inputGainLevelObj.min_vol_enabled = (params[7].toString() == '1' ? true : false);

					let inputgainlevel_min_vol = '0';
					let inputgainlevel_min_vol_label = '-∞';

					if (params[8]) {
						let inputgainlevel_minvolfadertableObj = this.fader_table.find((ROW) => ROW.id == params[8].toString());
						inputgainlevel_min_vol = params[8];

						if (inputgainlevel_minvolfadertableObj !== undefined) {
							inputgainlevel_min_vol_label = inputgainlevel_minvolfadertableObj.label;
						}
					}					

					inputGainLevelObj.min_vol = inputgainlevel_min_vol;
					inputGainLevelObj.min_vol_label = inputgainlevel_min_vol_label;
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
					mic_gain: params[1],
					mic_gain_label: this.input_gain_table_mic.find((ROW) => ROW.id == params[1].toString()).label,
					line_gain: params[2],
					line_gain_label: this.input_gain_table_line.find((ROW) => ROW.id == params[2].toString()).label,
					level: params[3],
					level_label: this.fader_table.find((ROW) => ROW.id == params[3].toString()).label,
					mute: (params[4].toString() == '1' ? true : false)
				}
				
				found = false;

				for (let i = 0; i < this.DATA.input_gain_levels.length; i++) {
					if (this.DATA.input_gain_levels[i].id == inputChannel) {
						//update in place
						this.DATA.input_gain_levels[i].mic_gain = notice_inputGainLevelObj.mic_gain;
						this.DATA.input_gain_levels[i].mic_gain_label = notice_inputGainLevelObj.mic_gain_label;
						this.DATA.input_gain_levels[i].line_gain = notice_inputGainLevelObj.line_gain;
						this.DATA.input_gain_levels[i].line_gain_label = notice_inputGainLevelObj.line_gain_label;
						this.DATA.input_gain_levels[i].level = notice_inputGainLevelObj.level;
						this.DATA.input_gain_levels[i].level_label = notice_inputGainLevelObj.level_label;
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

				let outputlevel_level = '';
				let outputlevel_level_label = '';

				if (params[1]) {
					let outputlevel_levelfadertableObj = this.fader_table.find((ROW) => ROW.id == params[1].toString());
					outputlevel_level = params[1];

					if (outputlevel_levelfadertableObj !== undefined) {
						outputlevel_level_label = outputlevel_levelfadertableObj.label;
					}
				}

				let max_vol_enabled = false;
				if (params[2]) {
					max_vol_enabled = (params[2].toString() == '1' ? true : false);
				}

				let outputlevel_maxvol = '';
				let outputlevel_maxvol_label = '';
				
				if (params[3]) {
					let outputlevel_maxvolfadertableObj = this.fader_table.find((ROW) => ROW.id == params[3].toString());
					outputlevel_maxvol = params[3];

					if (outputlevel_maxvolfadertableObj !== undefined) {
						outputlevel_maxvol_label = outputlevel_maxvolfadertableObj.label;
					}
				}

				let min_vol_enabled = false;
				if (params[4]) {
					min_vol_enabled = (params[4].toString() == '1' ? true : false);
				}

				let outputlevel_minvol = '';
				let outputlevel_minvol_label = '';
				
				if (params[5]) {
					let outputlevel_minvolfadertableObj = this.fader_table.find((ROW) => ROW.id == params[5].toString());
					outputlevel_minvol = params[5];

					if (outputlevel_minvolfadertableObj !== undefined) {
						outputlevel_minvol_label = outputlevel_minvolfadertableObj.label;
					}
				}			

				let outputLevelObj = {
					id: outputChannel,
					level: outputlevel_level,
					level_label: outputlevel_level_label,
					max_vol_enabled: max_vol_enabled,
					max_vol: outputlevel_maxvol,
					max_vol_label: outputlevel_maxvol_label,
					min_vol_enabled: min_vol_enabled,
					min_vol: outputlevel_minvol,
					min_vol_label: outputlevel_minvol_label
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
				/*outputChannel = params[0].toString();
				let notice_outputLevelObj = {
					id: outputChannel,
					level_label: this.fader_table.find((ROW) => ROW.id == params[1].toString()).label
				}

				found = false;

				for (let i = 0; i < this.DATA.output_levels.length; i++) {
					if (this.DATA.output_levels[i].id == outputChannel) {
						//update in place
						this.DATA.output_levels[i].level = params[1];
						this.DATA.output_levels[i].level_label = notice_outputLevelObj.level_label;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.output_levels.push(notice_outputLevelObj);
				}*/
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
				if (model.id == 'atdm-1012') {
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
						this.DATA.open_channels.push(openChannelObj);
					}
				}
				else if (this.config.model == 'atdm-0604a') {
					this.DATA.open_channels = []; //reset the array

					this.DATA.open_channels.push({ id: '0', status: (params[0].toString() == '1' ? true : false)}); //input 1
					this.DATA.open_channels.push({ id: '1', status: (params[1].toString() == '1' ? true : false)}); //input 2
					this.DATA.open_channels.push({ id: '2', status: (params[2].toString() == '1' ? true : false)}); //input 3
					this.DATA.open_channels.push({ id: '3', status: (params[3].toString() == '1' ? true : false)}); //input 4
					this.DATA.open_channels.push({ id: '4', status: (params[4].toString() == '1' ? true : false)}); //input 5
					this.DATA.open_channels.push({ id: '5', status: (params[5].toString() == '1' ? true : false)}); //input 6			
				}

			case 'gopl':
				this.DATA.operator_page[parseInt(params[0].toString()) - 1][`fader_${params[1].toString()}_level`] = parseInt(params[2].toString());
				break;

			case 'gopm':
				this.DATA.operator_page[parseInt(params[0].toString()) - 1][`fader_${params[1].toString()}_mute`] = (params[2].toString() == '1' ? true : false);
				break;

			default:
				console.log('Other Response from device:');
				console.log(response);
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
