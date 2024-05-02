const constants = require('./constants')

module.exports = {
	initActions() {
		let actions = {}

		let model = this.MODELS.find((model) => model.id == this.config.model);

		if (model) {
			if (model.actions.includes('input_gain_level')) {
				actions['input_gain_level'] = {
					name: 'Set Input Gain Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'dropdown',
							label: 'Gain - Mic',
							id: 'gain_mic',
							default: constants.input_gain_table_mic[0].id,
							choices: constants.input_gain_table_mic
						},
						{
							type: 'dropdown',
							label: 'Gain - Line',
							id: 'gain_line',
							default: constants.input_gain_table_line[0].id,
							choices: constants.input_gain_table_line
						},
						{
							type: 'dropdown',
							label: 'Level',
							id: 'level',
							default: constants.fader_table[0].id,
							choices: constants.fader_table
						},
						{
							type: 'checkbox',
							label: 'Max Volume Enable',
							id: 'max_volume_enable',
							default: false
						},
						{
							type: 'dropdown',
							label: 'Max Volume',
							id: 'max_volume',
							default: constants.fader_table[0].id,
							choices: constants.fader_table
						},
						{
							type: 'checkbox',
							label: 'Mute',
							id: 'mute',
							default: false
						},
						{
							type: 'dropdown',
							label: 'Virtual Mic Gain',
							id: 'virtual_mic_gain',
							default: constants.input_gain_table_line[0].id,
							choices: constants.input_gain_table_line
						},
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.input + ','
								+ event.options.gain_mic + ','
								+ event.options.gain_line + ','
								+ event.options.level + ','
								+ (event.options.max_volume_enable ? '1' : '0') + ','
								+ event.options.max_volume + ','
								+ (event.options.mute ? '1' : '0') + ','
								+ event.options.virtual_mic_gain
	
						if (model.id == 'atdm-1012') {
							params += ',' 
								+ (event.options.min_volume_enable ? '1' : '0') + ','
								+ event.options.min_volume_level;
						}
						this.sendCommand('s_input_gain_level', 'S', params)
					},
				}

				if (model.id == 'atdm-1012') {
					actions['input_gain_level'].options.push({
						type: 'checkbox',
						label: 'Min Volume Enable',
						id: 'min_volume_enable',
						default: false
					})

					actions['input_gain_level'].options.push({
						type: 'dropdown',
						label: 'Min Volume Level',
						id: 'min_volume_level',
						default: constants.fader_table[0].id,
						choices: constants.fader_table
					})
				}

				actions['input_gain_level_increase'] = {
					name: 'Increase Input Mic Gain Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildInputGainParams(event.options.input, 'mic_gain', 'increase', event.options.steps);
						this.sendCommand('s_input_gain_level', 'S', params)
					},
				}

				actions['input_gain_level_decrease'] = {
					name: 'Decrease Input Mic Gain Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildInputGainParams(event.options.input, 'mic_gain', 'decrease', event.options.steps);
						this.sendCommand('s_input_gain_level', 'S', params)
					},
				}

				actions['input_line_level_increase'] = {
					name: 'Increase Input Line Gain Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildInputGainParams(event.options.input, 'line_gain', 'increase', event.options.steps);
						this.sendCommand('s_input_gain_level', 'S', params)
					},
				}

				actions['input_line_level_decrease'] = {
					name: 'Decrease Input Line Gain Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildInputGainParams(event.options.input, 'line_gain', 'decrease', event.options.steps);
						this.sendCommand('s_input_gain_level', 'S', params)
					},
				}

				actions['input_level_increase'] = {
					name: 'Increase Input Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildInputGainParams(event.options.input, 'level', 'increase', event.options.steps);
						if (model.id == 'atdm-1012') {
							params = params.split(',');
							this.sendCommand('sicl', 'S', event.options.input + ',' + params[3]);
						}
						else {
							this.sendCommand('s_input_gain_level', 'S', params)
						}
					},
				}

				actions['input_level_decrease'] = {
					name: 'Decrease Input Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildInputGainParams(event.options.input, 'level', 'decrease', event.options.steps);
						if (model.id == 'atdm-1012') {
							params = params.split(',');
							this.sendCommand('sicl', 'S', event.options.input + ',' + params[3]);
						}
						else {
							this.sendCommand('s_input_gain_level', 'S', params)
						}
					},
				}

				actions['input_max_vol_increase'] = {
					name: 'Increase Input Max Volume Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildInputGainParams(event.options.input, 'max_vol', 'increase', event.options.steps);
						this.sendCommand('s_input_gain_level', 'S', params)
					},
				}

				actions['input_max_vol_decrease'] = {
					name: 'Decrease Input Max Volume Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildInputGainParams(event.options.input, 'max_vol', 'decrease', event.options.steps);
						this.sendCommand('s_input_gain_level', 'S', params)
					},
				}

				actions['input_mute'] = {
					name: 'Mute Input Channel',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'checkbox',
							label: 'Mute/Unmute',
							id: 'mute',
							default: false
						}
					],
					callback: async (event) => {
						let params = this.buildInputGainParams(event.options.input, 'mute', event.options.mute);
						this.sendCommand('s_input_gain_level', 'S', params)
					},
				}

				if (model.id == 'atdm-1012') {
					actions['input_min_vol_increase'] = {
						name: 'Increase Input Min Volume Level',
						options: [
							{
								type: 'dropdown',
								label: 'Input Channel',
								id: 'input',
								default: model.input_channels[0].id,
								choices: model.input_channels
							},
							{
								type: 'number',
								id: 'steps',							
								label: 'Steps',
								default: 1,
								min: 1,
								max: 10
							}
						],
						callback: async (event) => {
							let params = this.buildInputGainParams(event.options.input, 'min_vol', 'increase', event.options.steps);
							this.sendCommand('s_input_gain_level', 'S', params)
						},
					}

					actions['input_min_vol_decrease'] = {
						name: 'Decrease Input Min Volume Level',
						options: [
							{
								type: 'dropdown',
								label: 'Input Channel',
								id: 'input',
								default: model.input_channels[0].id,
								choices: model.input_channels
							},
							{
								type: 'number',
								id: 'steps',							
								label: 'Steps',
								default: 1,
								min: 1,
								max: 10
							}
						],
						callback: async (event) => {
							let params = this.buildInputGainParams(event.options.input, 'min_vol', 'decrease', event.options.steps);
							this.sendCommand('s_input_gain_level', 'S', params)
						},
					}
				}
			}

			if (model.actions.includes('output_level')) {
				actions['output_level'] = {
					name: 'Set Output Level',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'dropdown',
							label: 'Level',
							id: 'level',
							default: constants.fader_table[0].id,
							choices: constants.fader_table
						},
						{
							type: 'checkbox',
							label: 'Max Volume Enable',
							id: 'max_volume_enable',
							default: false
						},
						{
							type: 'dropdown',
							label: 'Max Volume',
							id: 'max_volume',
							default: constants.fader_table[0].id,
							choices: constants.fader_table
						},
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.output + ','
								+ event.options.level + ','
								+ (event.options.max_volume_enable ? '1' : '0') + ','
								+ event.options.max_volume

						if (model.id == 'atdm-1012') {
							params += ',' 
								+ (event.options.min_volume_enable ? '1' : '0') + ','
								+ event.options.min_volume_level;
						}
	
						this.sendCommand('s_output_level', 'S', params)
					},
				}

				if (model.id == 'atdm-1012') {
					actions['output_level'].options.push({
						type: 'checkbox',
						label: 'Min Volume Enable',
						id: 'min_volume_enable',
						default: false
					})

					actions['output_level'].options.push({
						type: 'dropdown',
						label: 'Min Volume Level',
						id: 'min_volume_level',
						default: constants.fader_table[0].id,
						choices: constants.fader_table
					})
				}

				actions['output_level_increase'] = {
					name: 'Increase Output Level',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildOutputLevelParams(event.options.output, 'level', 'increase', event.options.steps);
						this.sendCommand('s_output_level', 'S', params)
					},
				}

				actions['output_level_decrease'] = {
					name: 'Decrease Output Level',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildOutputLevelParams(event.options.output, 'level', 'decrease', event.options.steps);
						this.sendCommand('s_output_level', 'S', params)
					},
				}

				actions['output_max_vol_increase'] = {
					name: 'Increase Output Max Volume Level',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildOutputLevelParams(event.options.output, 'max_vol', 'increase', event.options.steps);
						this.sendCommand('s_output_level', 'S', params)
					},
				}

				actions['output_max_vol_decrease'] = {
					name: 'Decrease Output Max Volume Level',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildOutputLevelParams(event.options.output, 'max_vol', 'decrease', event.options.steps);
						this.sendCommand('s_output_level', 'S', params)
					},
				}

				if (model.id == 'atdm-1012') {
					actions['output_min_vol_increase'] = {
						name: 'Increase Output Min Volume Level',
						options: [
							{
								type: 'dropdown',
								label: 'Output Channel',
								id: 'output',
								default: model.output_channels[0].id,
								choices: model.output_channels
							},
							{
								type: 'number',
								id: 'steps',							
								label: 'Steps',
								default: 1,
								min: 1,
								max: 10
							}
						],
						callback: async (event) => {
							let params = this.buildOutputLevelParams(event.options.output, 'min_vol', 'increase', event.options.steps);
							this.sendCommand('s_output_level', 'S', params)
						},
					}
	
					actions['output_min_vol_decrease'] = {
						name: 'Decrease Output Min Volume Level',
						options: [
							{
								type: 'dropdown',
								label: 'Output Channel',
								id: 'output',
								default: model.output_channels[0].id,
								choices: model.output_channels
							},
							{
								type: 'number',
								id: 'steps',							
								label: 'Steps',
								default: 1,
								min: 1,
								max: 10
							}
						],
						callback: async (event) => {
							let params = this.buildOutputLevelParams(event.options.output, 'min_vol', 'decrease', event.options.steps);
							this.sendCommand('s_output_level', 'S', params)
						},
					}
				}
			}

			if (model.actions.includes('output_mute')) {
				actions['output_mute'] = {
					name: 'Set Output Mute',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'checkbox',
							label: 'Mute/Unmute',
							id: 'mute',
							default: false
						}
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.output + ','
								+ (event.options.mute ? '1' : '0')
	
						this.sendCommand('s_output_mute', 'S', params)
					},
				}
			}

			if (model.actions.includes('fbs')) {
				actions['fbs'] = {
					name: 'Set FBS',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							id: 'channel',
							default: model.fbs_channels[0].id,
							choices: model.fbs_channels
						},
						{
							type: 'dropdown',
							label: 'Processing Type',
							id: 'processing_type',
							default: model.fbs_processing[0].id,
							choices: model.fbs_processing
						},
						{
							type: 'checkbox',
							label: 'Enable',
							id: 'enable',
							default: false
						},
						{
							type: 'dropdown',
							label: 'Band 1',
							id: 'band1',
							default: model.fbs_bands[0].id,
							choices: model.fbs_bands
						},
						{
							type: 'dropdown',
							label: 'Band 2',
							id: 'band2',
							default: model.fbs_bands[0].id,
							choices: model.fbs_bands
						},
						{
							type: 'dropdown',
							label: 'Band 3',
							id: 'band3',
							default: model.fbs_bands[0].id,
							choices: model.fbs_bands
						},
						{
							type: 'dropdown',
							label: 'Band 4',
							id: 'band4',
							default: model.fbs_bands[0].id,
							choices: model.fbs_bands
						},
						{
							type: 'dropdown',
							label: 'Band 5',
							id: 'band5',
							default: model.fbs_bands[0].id,
							choices: model.fbs_bands
						},
						{
							type: 'dropdown',
							label: 'Band 6',
							id: 'band6',
							default: model.fbs_bands[0].id,
							choices: model.fbs_bands
						},
						{
							type: 'dropdown',
							label: 'Band 7',
							id: 'band1',
							default: model.fbs_bands[0].id,
							choices: model.fbs_bands
						},
						{
							type: 'dropdown',
							label: 'Band 8',
							id: 'band1',
							default: model.fbs_bands[0].id,
							choices: model.fbs_bands
						},
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.channel + ','
								+ event.options.processing_type + ','
								+ (event.options.enable ? '1' : '0') + ','
								+ event.options.band1 + ','
								+ event.options.band2 + ','
								+ event.options.band3 + ','
								+ event.options.band4 + ','
								+ event.options.band5 + ','
								+ event.options.band6 + ','
								+ event.options.band7 + ','
								+ event.options.band8
	
						this.sendCommand('s_output_mute', 'S', params)
					},
				}
			}

			if (model.actions.includes('arraymic_mute')) {
				actions['arraymic_mute'] = {
					name: 'Mute/Unmute Array Mic',
					options: [
						{
							type: 'dropdown',
							label: 'Mute Setting',
							id: 'mute',
							default: '1',
							choices: [
								{ id: '0', label: 'Unmute'},
								{ id: '1', label: 'Mute'}
							]
						},
						{
							type: 'dropdown',
							label: 'Mic',
							id: 'mic',
							default: '0',
							choices: [
								{ id: '0', label: 'Virtual Mic 1'},
								{ id: '1', label: 'Virtual Mic 2'}
							]
						},
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.mute + ',' + event.options.mic
	
						this.sendCommand('s_arraymic_mute', 'S', params)
					},
				}
			}

			if (model.actions.includes('sopl')) {
				actions['sopl'] = {
					name: 'Change Operator Fader Level',
					options: [
						{
							type: 'dropdown',
							label: 'Operator Page',
							id: 'page',
							default: 1,
							choices: [
								{ id: 1, label: 'Page 1'},
								{ id: 2, label: 'Page 2'},
								{ id: 3, label: 'Page 3'},
								{ id: 4, label: 'Page 4'},
								{ id: 5, label: 'Page 5'},
								{ id: 6, label: 'Page 6'},
								{ id: 7, label: 'Page 7'},
								{ id: 8, label: 'Page 8'}
							]
						},
						{
							type: 'dropdown',
							label: 'Operator Fader',
							id: 'fader',
							default: 1,
							choices: [
								{ id: 1, label: 'Fader 1'},
								{ id: 2, label: 'Fader 2'},
								{ id: 3, label: 'Fader 3'},
								{ id: 4, label: 'Fader 4'},
								{ id: 5, label: 'Fader 5'},
								{ id: 6, label: 'Fader 6'},
								{ id: 7, label: 'Fader 7'},
								{ id: 8, label: 'Fader 8'}
							]
						},
						{
							type: 'number',
							label: 'Level',
							id: 'level',
							default: 50,
							min: 0,
							max: 100
						}
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.page + ','
								+ event.options.fader + ','
								+ event.options.level
	
						this.sendCommand('SOPL', 'S', params)
					},
				}

				actions['sopl_increase'] = {
					name: 'Increase Operator Fader Level',
					options: [
						{
							type: 'dropdown',
							label: 'Operator Page',
							id: 'page',
							default: 1,
							choices: [
								{ id: 1, label: 'Page 1'},
								{ id: 2, label: 'Page 2'},
								{ id: 3, label: 'Page 3'},
								{ id: 4, label: 'Page 4'},
								{ id: 5, label: 'Page 5'},
								{ id: 6, label: 'Page 6'},
								{ id: 7, label: 'Page 7'},
								{ id: 8, label: 'Page 8'}
							]
						},
						{
							type: 'dropdown',
							label: 'Operator Fader',
							id: 'fader',
							default: 1,
							choices: [
								{ id: 1, label: 'Fader 1'},
								{ id: 2, label: 'Fader 2'},
								{ id: 3, label: 'Fader 3'},
								{ id: 4, label: 'Fader 4'},
								{ id: 5, label: 'Fader 5'},
								{ id: 6, label: 'Fader 6'},
								{ id: 7, label: 'Fader 7'},
								{ id: 8, label: 'Fader 8'}
							]
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildOperatorLevelParams(event.options.page, event.options.fader, 'increase', event.options.steps);
						this.sendCommand('SOPL', 'S', params);
					},
				}

				actions['sopl_decrease'] = {
					name: 'Decrease Operator Fader Level',
					options: [
						{
							type: 'dropdown',
							label: 'Operator Page',
							id: 'page',
							default: 1,
							choices: [
								{ id: 1, label: 'Page 1'},
								{ id: 2, label: 'Page 2'},
								{ id: 3, label: 'Page 3'},
								{ id: 4, label: 'Page 4'},
								{ id: 5, label: 'Page 5'},
								{ id: 6, label: 'Page 6'},
								{ id: 7, label: 'Page 7'},
								{ id: 8, label: 'Page 8'}
							]
						},
						{
							type: 'dropdown',
							label: 'Operator Fader',
							id: 'fader',
							default: 1,
							choices: [
								{ id: 1, label: 'Fader 1'},
								{ id: 2, label: 'Fader 2'},
								{ id: 3, label: 'Fader 3'},
								{ id: 4, label: 'Fader 4'},
								{ id: 5, label: 'Fader 5'},
								{ id: 6, label: 'Fader 6'},
								{ id: 7, label: 'Fader 7'},
								{ id: 8, label: 'Fader 8'}
							]
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						let params = this.buildOperatorLevelParams(event.options.page, event.options.fader, 'decrease', event.options.steps);
						this.sendCommand('SOPL', 'S', params);
					},
				}
			}

			if (model.actions.includes('sopm')) {
				actions['sopm'] = {
					name: 'Mute Operator Fader',
					options: [
						{
							type: 'dropdown',
							label: 'Operator Page',
							id: 'page',
							default: 1,
							choices: [
								{ id: 1, label: 'Page 1'},
								{ id: 2, label: 'Page 2'},
								{ id: 3, label: 'Page 3'},
								{ id: 4, label: 'Page 4'},
								{ id: 5, label: 'Page 5'},
								{ id: 6, label: 'Page 6'},
								{ id: 7, label: 'Page 7'},
								{ id: 8, label: 'Page 8'}
							]
						},
						{
							type: 'dropdown',
							label: 'Operator Fader',
							id: 'fader',
							default: 1,
							choices: [
								{ id: 1, label: 'Fader 1'},
								{ id: 2, label: 'Fader 2'},
								{ id: 3, label: 'Fader 3'},
								{ id: 4, label: 'Fader 4'},
								{ id: 5, label: 'Fader 5'},
								{ id: 6, label: 'Fader 6'},
								{ id: 7, label: 'Fader 7'},
								{ id: 8, label: 'Fader 8'}
							]
						},
						{
							type: 'checkbox',
							label: 'Mute/Unmute',
							id: 'mute',
							default: false
						}
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.page + ','
								+ event.options.fader + ','
								+ (event.options.mute ? '1' : '0')
	
						this.sendCommand('SOPM', 'S', params)
					},
				}
			}

			if (model.actions.includes('call_preset')) {
				actions['call_preset'] = {
					name: 'Call Preset',
					options: [
						{
							type: 'dropdown',
							label: 'Preset/Bank Number',
							id: 'preset',
							default: 1,
							choices: model.preset_choices
						},
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.preset;

						if (model.id == 'atdm-1012') {
							this.sendCommand('CALLP', 'S', params)
						}
						else {
							this.sendCommand('call_preset', 'S', params)
						}
					},
				}
			}

			if (model.actions.includes('call_partial_preset')) {
				actions['call_partial_preset'] = {
					name: 'Call Partial Preset',
					options: [
						{
							type: 'number',
							label: 'Partial Preset Number (1-40)',
							id: 'partial',
							default: 1,
							min: 1,
							max: 40
						},
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.partial;
	
						this.sendCommand('call_partial_preset', 'S', params)
					},
				}
			}
			
		}
			
		this.setActionDefinitions(actions)
	},

	buildInputGainParams(input, choice, direction, steps=0) {
		let model = this.MODELS.find((model) => model.id == this.config.model);

		let params = '';

		let dataObj = this.DATA.input_gain_levels.find((CHANNEL) => CHANNEL.id == input);

		if (dataObj) {
			let index = 0;

			switch (choice) {
				case 'mic_gain':
					index = constants.input_gain_table_mic.findIndex((GAIN) => GAIN.id == dataObj.mic_gain);

					if (direction == 'increase') {
						if (index <= (constants.input_gain_table_mic.length - steps - 1)) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}

					dataObj.mic_gain = constants.input_gain_table_mic[index].id;

					break;
				case 'line_gain':
					index = constants.input_gain_table_line.findIndex((GAIN) => GAIN.id == dataObj.line_gain);

					if (direction == 'increase') {
						if (index <= constants.input_gain_table_line.length - steps - 1) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}

					dataObj.line_gain = constants.input_gain_table_line[index].id;

					break;
				case 'level':
					index = constants.fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.level);

					if (direction == 'increase') {
						if (index <= (constants.fader_table.length - steps - 1)) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}
					
					dataObj.level = constants.fader_table[index].id;

					break;
				case 'max_vol':
					index = constants.fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.max_vol);

					if (direction == 'increase') {
						if (index <= (constants.fader_table.length - steps - 1)) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}

					dataObj.max_vol_enable = true;
					dataObj.max_vol = constants.fader_table[index].id;

					break;
				case 'mute':
					dataObj.mute = direction;
					break;
				case 'min_vol':
					index = constants.fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.min_vol);
					
					if (direction == 'increase') {
						if (index <= (constants.fader_table.length - steps - 1)) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}
					
					dataObj.min_vol_enable = true;
					dataObj.min_vol = constants.fader_table[index].id;

					break;
			}

			params += input + ','
					+ dataObj.mic_gain + ','
					+ dataObj.line_gain + ','
					+ dataObj.level + ','
					+ (dataObj.max_vol_enable ? '1' : '0') + ','
					+ dataObj.max_vol + ','
					+ (dataObj.mute ? '1' : '0') + ','
					+ dataObj.virtual_mic_gain

			if (model.id == 'atdm-1012') {
				params += ',' 
					+ (dataObj.min_vol_enable ? '1' : '0') + ','
					+ dataObj.min_vol;
			}
		}

		return params;
	},

	buildOutputLevelParams(output, choice, direction, steps=0) {
		let model = this.MODELS.find((model) => model.id == this.config.model);

		let params = '';

		let dataObj = this.DATA.output_levels.find((CHANNEL) => CHANNEL.id == output);

		if (dataObj) {
			let index = 0;

			switch (choice) {
				case 'level':
					index = constants.fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.level);

					if (direction == 'increase') {
						if (index <= (constants.fader_table.length - steps - 1)) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}
					
					dataObj.level = constants.fader_table[index].id;

					break;
				case 'max_vol':
					index = constants.fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.max_vol);

					if (direction == 'increase') {
						if (index <= (constants.fader_table.length - steps - 1)) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}

					dataObj.max_vol = constants.fader_table[index].id;

					break;
				case 'min_vol':
					index = constants.fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.min_vol);
					
					if (direction == 'increase') {
						if (index <= (constants.fader_table.length - steps - 1)) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}
					
					dataObj.min_vol = constants.fader_table[index].id;

					break;
			}

			params += output + ','
				+ dataObj.level + ','
				+ (dataObj.max_vol_enable ? '1' : '0') + ','
				+ dataObj.max_vol

			if (model.id == 'atdm-1012') {
				params += ',' 
					+ (dataObj.min_vol_enable ? '1' : '0') + ','
					+ dataObj.min_vol;
			}
		}

		return params;
	},

	buildOperatorLevelParams(page, fader, direction, steps=0) {
		if(direction != 'increase') {
			steps = -steps;
		}

		let newLevel = this.DATA.operator_page[page - 1][`fader_${fader}_level`] += newLevel;

		let params = page + ','
				+ fader + ','
				+ newLevel;

		return params;
	}
}