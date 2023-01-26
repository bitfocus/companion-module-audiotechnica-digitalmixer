const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks() {
		let feedbacks = {}

		let model = this.MODELS.find((model) => model.id == this.config.model);

		if (model) { //push model specific feedbacks
			if (model.feedbacks.includes('arraymic_mute')) {
				feedbacks['arraymic_mute'] = {
					type: 'boolean',
					name: 'Array Mic is Muted',
					description: 'Show feedback for Array Mic Muted state',
					options: [
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						if (this.DATA.arraymic_mute == true) {
							return true
						}
						return false
					},
				}
			}

			if (model.feedbacks.includes('gopm')) {
				feedbacks['gopm'] = {
					type: 'boolean',
					name: 'Operator Fader is Muted',
					description: 'Show feedback for Operator Fader Mute state',
					options: [
						{
							type: 'dropdown',
							label: 'Operator Page',
							id: 'page',
							default: 1,
							choices: [
								{ id: 0, label: 'Page 1'},
								{ id: 1, label: 'Page 2'},
								{ id: 2, label: 'Page 3'},
								{ id: 3, label: 'Page 4'},
								{ id: 4, label: 'Page 5'},
								{ id: 5, label: 'Page 6'},
								{ id: 6, label: 'Page 7'},
								{ id: 7, label: 'Page 8'}
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
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						if (this.DATA.operator_page[opt.page][`fader_${opt.fader}_mute`] == true) {
							return true
						}
						return false
					},
				}
			}

			if (model.feedbacks.includes('phantompower')) {
				feedbacks['phantom_power'] = {
					type: 'boolean',
					name: 'Phantom Power is On',
					description: 'Show feedback for Phantom Power State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputChannelSettingsObj = this.DATA.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputChannelSettingsObj) {
							if (inputChannelSettingsObj.phantomPower == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('lowcut')) {
				feedbacks['phantom_power'] = {
					type: 'boolean',
					name: 'Low Cut is On',
					description: 'Show feedback for Low Cut State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputChannelSettingsObj = this.DATA.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputChannelSettingsObj) {
							if (inputChannelSettingsObj.lowCut == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('aec')) {
				feedbacks['aec'] = {
					type: 'boolean',
					name: 'AEC is On',
					description: 'Show feedback for AEC State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputChannelSettingsObj = this.DATA.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputChannelSettingsObj) {
							if (inputChannelSettingsObj.aec == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('smartmix')) {
				feedbacks['smartmix'] = {
					type: 'boolean',
					name: 'Smart Mix is On',
					description: 'Show feedback for Smart Mix State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputChannelSettingsObj = this.DATA.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputChannelSettingsObj) {
							if (inputChannelSettingsObj.smartMix == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('input_maxvolume_enabled')) {
				feedbacks['input_maxvolume_enabled'] = {
					type: 'boolean',
					name: 'Input Max Volume Enabled is On',
					description: 'Show feedback for Input Max Volume Enabled State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputGainLevelObj = this.DATA.input_gain_levels.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputGainLevelObj) {
							if (inputGainLevelObj.max_vol_enabled == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('input_mute')) {
				feedbacks['input_mute'] = {
					type: 'boolean',
					name: 'Input Mute is On',
					description: 'Show feedback for Input Mute State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputGainLevelObj = this.DATA.input_gain_levels.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputGainLevelObj) {
							if (inputGainLevelObj.mute == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('output_maxvolume_enabled')) {
				feedbacks['output_maxvolume_enabled'] = {
					type: 'boolean',
					name: 'Output Max Volume Enabled is On',
					description: 'Show feedback for Output Max Volume Enabled State',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let outputLevelObj = this.DATA.output_levels.find((CHANNEL) => CHANNEL.id == opt.output);

						if (outputLevelObj) {
							if (outputLevelObj.max_vol_enabled == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('output_minvolume_enabled')) {
				feedbacks['output_minvolume_enabled'] = {
					type: 'boolean',
					name: 'Output Min Volume Enabled is On',
					description: 'Show feedback for Output Min Volume Enabled State',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let outputLevelObj = this.DATA.output_levels.find((CHANNEL) => CHANNEL.id == opt.output);

						if (outputLevelObj) {
							if (outputLevelObj.min_vol_enabled == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('output_mute')) {
				feedbacks['output_mute'] = {
					type: 'boolean',
					name: 'Output Mute is On',
					description: 'Show feedback for Output Mute State',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let outputMuteObj = this.DATA.output_mutes.find((CHANNEL) => CHANNEL.id == opt.output);

						if (outputMuteObj) {
							if (outputMuteObj.mute == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}
		}

		this.setFeedbackDefinitions(feedbacks)
	}
}