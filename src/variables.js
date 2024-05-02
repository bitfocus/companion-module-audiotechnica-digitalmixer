
module.exports = {
	initVariables() {
		let variables = []

		variables.push({ variableId: 'model', name: 'Model' })

		let model = this.MODELS.find((model) => model.id == this.config.model);

		if (model) { //push model specific variables
			if (model.variables.includes('arraymic_mute')) {
				variables.push({variableId: 'arraymic_mute',  name: 'Array Mic Mute Status'})
			}

			if (model.variables.includes('gopl')) {
				for (let i = 1; i <= 8; i++) {
					for (let j = 1; j <=8; j++) {
						variables.push({variableId: `gopl_${i}_${j}`,  name: `Operator Fader Page ${i} Fader ${j} Level`})
					}
				}
			}

			if (model.variables.includes('gopm')) {
				for (let i = 1; i <= 8; i++) {
					for (let j = 1; j <=8; j++) {
						variables.push({variableId: `gopm_${i}_${j}`,  name: `Operator Fader Page ${i} Fader ${j} Mute Status`})
					}
				}
			}

			if (model.variables.includes('input_channel_settings')) {
				for (let i = 0; i < model.input_channels_request.length; i++) {
					variables.push({ variableId: `${model.input_channels[i].variableId}_source`, name: `${model.input_channels[i].label} Source`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_phantompower`, name: `${model.input_channels[i].label} Phantom Power`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_phase`, name: `${model.input_channels[i].label} Phase`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_lowcut`, name: `${model.input_channels[i].label} Low Cut`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_aec`, name: `${model.input_channels[i].label} AEC`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_smartmix`, name: `${model.input_channels[i].label} Smart Mix`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_link`, name: `${model.input_channels[i].label} Link`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_channelname`, name: `${model.input_channels[i].label} Channel Name`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_color`, name: `${model.input_channels[i].label} Color`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_virtualmic_orientation`, name: `${model.input_channels[i].label} Virtual Mic Orientation`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_virtualmic_tilt`, name: `${model.input_channels[i].label} Virtual Mic Tilt`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_virtualmic_pattern`, name: `${model.input_channels[i].label} Virtual Mic Pattern`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_fadergroup`, name: `${model.input_channels[i].label} Fader Group`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_smartmixgroup`, name: `${model.input_channels[i].label} Smart Mix Group`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_mono`, name: `${model.input_channels[i].label} Mono`})
				}
			}

			if (model.variables.includes('sub_input_channel_settings')) {
				for (let i = 0; i < model.sub_input_channels.length; i++) {
					variables.push({ variableId: `${model.sub_input_channels[i].variableId}_source`, name: `${model.sub_input_channels[i].label} Source`})
					variables.push({ variableId: `${model.sub_input_channels[i].variableId}_inputgain`, name: `${model.sub_input_channels[i].label} Input Gain`})
					variables.push({ variableId: `${model.sub_input_channels[i].variableId}_lowcut`, name: `${model.sub_input_channels[i].label} Low Cut`})
					variables.push({ variableId: `${model.sub_input_channels[i].variableId}_link`, name: `${model.sub_input_channels[i].label} Link`})
					variables.push({ variableId: `${model.sub_input_channels[i].variableId}_channelname`, name: `${model.sub_input_channels[i].label} Channel Name`})
					variables.push({ variableId: `${model.sub_input_channels[i].variableId}_color`, name: `${model.sub_input_channels[i].label} Color`})
					variables.push({ variableId: `${model.sub_input_channels[i].variableId}_fadergroup`, name: `${model.sub_input_channels[i].label} Fader Group`})
				}
			}

			if (model.variables.includes('input_gain_level')) {
				for (let i = 0; i < model.input_channels_request.length; i++) {
					variables.push({ variableId: `${model.input_channels[i].variableId}_mic_gain`, name: `${model.input_channels[i].label} Mic Gain`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_line_gain`, name: `${model.input_channels[i].label} Line Gain`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_level`, name: `${model.input_channels[i].label} Level`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_maxvolume_enabled`, name: `${model.input_channels[i].label} Max Volume Enabled`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_maxvolume`, name: `${model.input_channels[i].label} Max Volume Level`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_mute`, name: `${model.input_channels[i].label} Mute`})
				}
			}

			if (model.variables.includes('output_channel_settings')) {
				for (let i = 0; i < model.output_channels.length; i++) {
					variables.push({ variableId: `${model.output_channels[i].variableId}_unity`, name: `${model.output_channels[i].label} Unity`})
					variables.push({ variableId: `${model.output_channels[i].variableId}_channelname`, name: `${model.output_channels[i].label} Channel Name`})
					variables.push({ variableId: `${model.output_channels[i].variableId}_color`, name: `${model.output_channels[i].label} Color`})
					variables.push({ variableId: `${model.output_channels[i].variableId}_link`, name: `${model.output_channels[i].label} Link`})
					variables.push({ variableId: `${model.output_channels[i].variableId}_source`, name: `${model.output_channels[i].label} Source`})
					variables.push({ variableId: `${model.output_channels[i].variableId}_fadergroup`, name: `${model.output_channels[i].label} Fader Group`})
				}
			}

			if (model.variables.includes('output_level')) {
				for (let i = 0; i < model.output_channels.length; i++) {
					variables.push({ variableId: `${model.output_channels[i].variableId}_level`, name: `${model.output_channels[i].label} Level`})
					variables.push({ variableId: `${model.output_channels[i].variableId}_maxvolume_enabled`, name: `${model.output_channels[i].label} Max Volume Enabled`})
					variables.push({ variableId: `${model.output_channels[i].variableId}_maxvolume`, name: `${model.output_channels[i].label} Max Volume`})
					variables.push({ variableId: `${model.output_channels[i].variableId}_minvolume_enabled`, name: `${model.output_channels[i].label} Min Volume Enabled`})
					variables.push({ variableId: `${model.output_channels[i].variableId}_minvolume`, name: `${model.output_channels[i].label} Min Volume`})
				}
			}

			if (model.variables.includes('output_mute')) {
				for (let i = 0; i < model.output_channels.length; i++) {
					variables.push({ variableId: `${model.output_channels[i].variableId}_mute`, name: `${model.output_channels[i].label} Mute`})
				}
			}

			if (model.variables.includes('preset_number')) {
				variables.push({ variableId: `preset_number`, name: `Current Preset Number`})
			}

			if (model.variables.includes('partial_preset_number')) {
				variables.push({ variableId: `partial_preset_number`, name: `Current Partial Preset Number`})
			}

			if (model.variables.includes('meter_level')) {
				for (let i = 0; i <= 41; i++) {
					variables.push({ variableId: `meterlevel_${i}`, name: `Meter Level ${i}`})
				}
			}

			if (model.variables.includes('open_channel_notice')) {
				if (model.id == 'atdm-1012') {
					for (let i = 0; i < model.input_channels_request.length; i++) {
						for (let j = 1; j <= 4; j++) {
							variables.push({ variableId: `${model.input_channels[i].variableId}_smartmix${j}_open`, name: `${model.input_channels[i].label} Smart Mix ${j} Open`})
						}					
					}
				}
				else if (model.id == 'atdm-0604a') {
					for (let i = 0; i < 6; i++) {
						variables.push({ variableId: `${model.input_channels[i].variableId}_open`, name: `${model.input_channels[i].label} Open`})
					}
				}				
			}
		}

		this.setVariableDefinitions(variables)

		this.setVariableValues({
			model: model.label,
		})
	},

	checkVariables() {
		try {
			let model = this.MODELS.find((model) => model.id == this.config.model);

			if (model) {
				if (model.variables.includes('input_channel_settings')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.input_channel_settings.length; i++) {
					let inputChannelSettingsObj = this.DATA.input_channel_settings[i];
						let modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputChannelSettingsObj.id);
						
						variableObj[`${modelChannelObj.variableId}_source`] = model.input_channel_sources.find((SOURCE) => SOURCE.id == inputChannelSettingsObj.source).label || '';
						variableObj[`${modelChannelObj.variableId}_phantompower`] = (inputChannelSettingsObj.phantomPower == true ? 'On' : 'Off')
						variableObj[`${modelChannelObj.variableId}_phase`] = inputChannelSettingsObj.phase;
						variableObj[`${modelChannelObj.variableId}_lowcut`] = (inputChannelSettingsObj.lowCut == true ? 'On' : 'Off');
						variableObj[`${modelChannelObj.variableId}_aec`] = (inputChannelSettingsObj.aec == true ? 'On' : 'Off');
						variableObj[`${modelChannelObj.variableId}_smartmix`] = (inputChannelSettingsObj.smartMix == true ? 'On' : 'Off');
						variableObj[`${modelChannelObj.variableId}_link`] = inputChannelSettingsObj.link;
						variableObj[`${modelChannelObj.variableId}_channelname`] = inputChannelSettingsObj.channelName;
						
						variableObj[`${modelChannelObj.variableId}_color`] = '';

						if (inputChannelSettingsObj.color) {
							let modelColorObj = model.colors.find((COLOR) => COLOR.id == inputChannelSettingsObj.color);
							if (modelColorObj) {
								variableObj[`${modelChannelObj.variableId}_color`] = modelColorObj.label;
							}
							else {
								if (inputChannelSettingsObj.color) {
									variableObj[`${modelChannelObj.variableId}_color`] = inputChannelSettingsObj.color;
								}
							}
						}
						
						variableObj[`${modelChannelObj.variableId}_virtualmic_orientation`] = inputChannelSettingsObj.virtualMicOrientation;
						variableObj[`${modelChannelObj.variableId}_virtualmic_tilt`] = inputChannelSettingsObj.virtualMicTilt;
						variableObj[`${modelChannelObj.variableId}_virtualmic_pattern`] = inputChannelSettingsObj.virtualMicPattern;
						variableObj[`${modelChannelObj.variableId}_fadergroup`] = inputChannelSettingsObj.faderGroup;
						variableObj[`${modelChannelObj.variableId}_smartmixgroup`] = inputChannelSettingsObj.smartMixGroup;
						variableObj[`${modelChannelObj.variableId}_mono`] = inputChannelSettingsObj.mono;
					}
	
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('sub_input_channel_settings')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.sub_input_channel_settings.length; i++) {
					let subinputChannelSettingsObj = this.DATA.sub_input_channel_settings[i];
						let modelChannelObj = model.sub_input_channels.find((CHANNEL) => CHANNEL.id == subinputChannelSettingsObj.id);
	
						variableObj[`${modelChannelObj.variableId}_source`] = model.sub_input_channel_sources.find((SOURCE) => SOURCE.id == subinputChannelSettingsObj.source).label || '';
						variableObj[`${modelChannelObj.variableId}_inputgain`] = subinputChannelSettingsObj.input_gain_label;
						variableObj[`${modelChannelObj.variableId}_lowcut`] = (subinputChannelSettingsObj.lowCut == true ? 'On' : 'Off');
						variableObj[`${modelChannelObj.variableId}_link`] = subinputChannelSettingsObj.link;
						variableObj[`${modelChannelObj.variableId}_channelname`] = subinputChannelSettingsObj.channelName;
						variableObj[`${modelChannelObj.variableId}_color`] = subinputChannelSettingsObj.color;
						variableObj[`${modelChannelObj.variableId}_fadergroup`] = subinputChannelSettingsObj.faderGroup;
					}
	
					this.setVariableValues(variableObj);
				}
	
				if (model.variables.includes('input_gain_level')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.input_gain_levels.length; i++) {
						let inputGainLevelObj = this.DATA.input_gain_levels[i];
						let modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputGainLevelObj.id);
	
						variableObj[`${modelChannelObj.variableId}_mic_gain`] = inputGainLevelObj.mic_gain_label;
						variableObj[`${modelChannelObj.variableId}_line_gain`] = inputGainLevelObj.line_gain_label;
						variableObj[`${modelChannelObj.variableId}_level`] = inputGainLevelObj.level_label;
						variableObj[`${modelChannelObj.variableId}_maxvolume_enabled`] = (inputGainLevelObj.max_vol_enabled == true ? 'On' : 'Off');
						variableObj[`${modelChannelObj.variableId}_maxvolume`] = inputGainLevelObj.max_vol_label;
						variableObj[`${modelChannelObj.variableId}_mute`] = (inputGainLevelObj.mute == true ? 'On' : 'Off');
					}
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('output_channel_settings')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.output_channel_settings.length; i++) {
						let outputChannelSettingsObj = this.DATA.output_channel_settings[i];
						let modelChannelObj = model.output_channels.find((CHANNEL) => CHANNEL.id == outputChannelSettingsObj.id);
	
						let unityObj = this.output_channel_settings_unity.find((UNITY) => { UNITY.id == outputChannelSettingsObj.unity});
						let unityLabel = ''
						if (unityObj) {
							unityLabel = unityObj.label;
						}
						variableObj[`${modelChannelObj.variableId}_unity`] = unityLabel;
						variableObj[`${modelChannelObj.variableId}_channelname`] = outputChannelSettingsObj.channelName;
						variableObj[`${modelChannelObj.variableId}_color`] = outputChannelSettingsObj.color;
						variableObj[`${modelChannelObj.variableId}_link`] = outputChannelSettingsObj.link;
						let sourceObj = this.output_channel_settings_sources.find((SOURCE) => { SOURCE.id == outputChannelSettingsObj.source});
						let sourceLabel = ''
						if (sourceObj) {
							sourceLabel = sourceObj.label;
						}
						variableObj[`${modelChannelObj.variableId}_source`] = sourceLabel;
						let fadergroupObj = this.output_channel_settings_fadergroups.find((FADERGROUP) => { FADERGROUP.id == outputChannelSettingsObj.faderGroup});
						let fadergroupLabel = '';
						if (fadergroupObj) {
							faderGroupLabel = fadergroupObj.label;
						}
						variableObj[`${modelChannelObj.variableId}_fadergroup`] = fadergroupLabel;
					}
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('output_level')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.output_levels.length; i++) {
						let outputLevelObj = this.DATA.output_levels[i];
						let modelChannelObj = model.output_channels.find((CHANNEL) => CHANNEL.id == outputLevelObj.id);
	
						variableObj[`${modelChannelObj.variableId}_level`] = outputLevelObj.level_label;
						variableObj[`${modelChannelObj.variableId}_maxvolume_enabled`] = (outputLevelObj.max_vol_enabled == true ? 'On' : 'Off');
						variableObj[`${modelChannelObj.variableId}_maxvolume`] = outputLevelObj.max_vol_label;
						variableObj[`${modelChannelObj.variableId}_minvolume_enabled`] = (outputLevelObj.min_vol_enabled == true ? 'On' : 'Off');
						variableObj[`${modelChannelObj.variableId}_minvolume`] = outputLevelObj.min_vol_label;
					}
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('output_mute')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.output_mutes.length; i++) {
						let outputMuteObj = this.DATA.output_mutes[i];
						let modelChannelObj = model.output_channels.find((CHANNEL) => CHANNEL.id == outputMuteObj.id);
	
						variableObj[`${modelChannelObj.variableId}_mute`] = (outputMuteObj.mute == true ? 'On' : 'Off');
					}
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('preset_number')) {
					let variableObj = {};
					variableObj[`preset_number`] = this.DATA.preset_number;
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('partial_preset_number')) {
					let variableObj = {};
					variableObj[`partial_preset_number`] = this.DATA.partial_preset_number;
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('meter_level')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.meter_levels.length; i++) {
						let meterLevelObj = this.DATA.meter_levels[i];
						variableObj[`meterlevel_${meterLevelObj.monitorPoint}`] = meterLevelObj.level;
					}
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('open_channel_notice')) {
					let variableObj = {};

					if (this.config.model == 'atdm-1012') {
						for (let i = 0; i < this.DATA.open_channels.length; i++) {
							let openChannelObj = this.DATA.open_channels[i];
							let modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == openChannelObj.id);
							variableObj[`${modelChannelObj.variableId}_smartmix${openChannelObj.smartMixGroup}_open`] = (openChannelObj.status == true ? 'Open' : 'Closed');
						}
					}
					else if (this.config.model == 'atdm-0604a') {
						for (let i = 0; i < this.DATA.open_channels.length; i++) {
							let openChannelObj = this.DATA.open_channels[i];
							let modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == openChannelObj.id);
							variableObj[`${modelChannelObj.variableId}_open`] = (openChannelObj.status == true ? 'Open' : 'Closed');
						}
					}

					if (model.variables.includes('gopl')) {
						for (let i = 0; i < this.DATA.operator_page.length; i++) {
							let operatorPage = this.DATA.operator_page[i];
							for (let j = 1; j <=8; j++) {
								variableObj[`gopl_${i+1}_${j}`] = parseInt(operatorPage[`fader_${j}_level`]);
							}
						}
					}

					if (model.variables.includes('gopm')) {
						for (let i = 0; i < this.DATA.operator_page.length; i++) {
							let operatorPage = this.DATA.operator_page[i];
							for (let j = 1; j <=8; j++) {
								variableObj[`gopm_${i+1}_${j}`] = parseInt(operatorPage[`fader_${j}_mute`]);
							}
						}
					}
		
					this.setVariableValues(variableObj);
				}
			}
		}
		catch(error) {
			this.log('error', `Error checking variables: ${error.toString()}`)
			if (typeof error === 'object') {
				if (error.message) {
				  console.log('\nMessage: ' + error.message)
				}
				if (error.stack) {
				  console.log('\nStacktrace:')
				  console.log('====================')
				  console.log(error.stack);
				}
			  } else {
				console.log(error);
			  }
		}
	}
}