import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { RECORDER_STATUS } from './constants.js'

export type FeedbacksSchema = {
	arraymic_mute: {
		type: 'boolean'
		options: Record<string, never>
	}
	aec: {
		type: 'boolean'
		options: {
			input: string | number
		}
	}
	gopm: {
		type: 'boolean'
		options: {
			page: string | number
			fader: string | number
		}
	}
	input_maxvolume_enabled: {
		type: 'boolean'
		options: {
			input: string | number
		}
	}
	input_mute: {
		type: 'boolean'
		options: {
			input: string | number
		}
	}
	lowcut: {
		type: 'boolean'
		options: {
			input: string | number
		}
	}
	output_maxvolume_enabled: {
		type: 'boolean'
		options: {
			output: string | number
		}
	}
	output_minvolume_enabled: {
		type: 'boolean'
		options: {
			output: string | number
		}
	}
	output_mute: {
		type: 'boolean'
		options: {
			output: string | number
		}
	}
	phantompower: {
		type: 'boolean'
		options: {
			input: string | number
		}
	}
	rec_status: {
		type: 'boolean'
		options: {
			status: string | number
		}
	}
	smartmix: {
		type: 'boolean'
		options: {
			input: string | number
		}
	}
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	const feedbacks: CompanionFeedbackDefinitions<FeedbacksSchema> = {
		arraymic_mute: undefined,
		aec: undefined,
		gopm: undefined,
		input_maxvolume_enabled: undefined,
		input_mute: undefined,
		lowcut: undefined,
		output_maxvolume_enabled: undefined,
		output_minvolume_enabled: undefined,
		output_mute: undefined,
		phantompower: undefined,
		rec_status: undefined,
		smartmix: undefined,
	}

	const model = self.model

	if (model) {
		//push model specific feedbacks
		if (model.feedbacks.includes('arraymic_mute')) {
			feedbacks['arraymic_mute'] = {
				type: 'boolean',
				name: 'Array Mic is Muted',
				description: 'Show feedback for Array Mic Muted state',
				options: [],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: () => {
					if (self.state.arraymic_mute == true) {
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
							{ id: 0, label: 'Page 1' },
							{ id: 1, label: 'Page 2' },
							{ id: 2, label: 'Page 3' },
							{ id: 3, label: 'Page 4' },
							{ id: 4, label: 'Page 5' },
							{ id: 5, label: 'Page 6' },
							{ id: 6, label: 'Page 7' },
							{ id: 7, label: 'Page 8' },
						],
					},
					{
						type: 'dropdown',
						label: 'Operator Fader',
						id: 'fader',
						default: 1,
						choices: [
							{ id: 1, label: 'Fader 1' },
							{ id: 2, label: 'Fader 2' },
							{ id: 3, label: 'Fader 3' },
							{ id: 4, label: 'Fader 4' },
							{ id: 5, label: 'Fader 5' },
							{ id: 6, label: 'Fader 6' },
							{ id: 7, label: 'Fader 7' },
							{ id: 8, label: 'Fader 8' },
						],
					},
				],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					return self.state.operator_page[Number(event.options.page) - 1][`fader_${event.options.fader}_mute`] === true
				},
			}
		}

		if (model.feedbacks.includes('phantompower')) {
			feedbacks['phantompower'] = {
				type: 'boolean',
				name: 'Phantom Power is On',
				description: 'Show feedback for Phantom Power State',
				options: [
					{
						type: 'dropdown',
						label: 'Input Channel',
						id: 'input',
						default: model.input_channels[0].id,
						choices: model.input_channels,
					},
				],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					const opt = event.options
					const inputChannelSettingsObj = self.state.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input)

					if (inputChannelSettingsObj) {
						if (inputChannelSettingsObj.phantomPower == true) {
							return true
						}
					}

					return false
				},
			}
		}

		if (model.feedbacks.includes('lowcut')) {
			feedbacks['lowcut'] = {
				type: 'boolean',
				name: 'Low Cut is On',
				description: 'Show feedback for Low Cut State',
				options: [
					{
						type: 'dropdown',
						label: 'Input Channel',
						id: 'input',
						default: model.input_channels[0].id,
						choices: model.input_channels,
					},
				],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					const opt = event.options
					const inputChannelSettingsObj = self.state.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input)

					if (inputChannelSettingsObj) {
						if (inputChannelSettingsObj.lowCut == true) {
							return true
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
						choices: model.input_channels,
					},
				],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					const opt = event.options
					const inputChannelSettingsObj = self.state.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input)

					if (inputChannelSettingsObj) {
						if (inputChannelSettingsObj.aec == true) {
							return true
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
						choices: model.input_channels,
					},
				],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					const opt = event.options
					const inputChannelSettingsObj = self.state.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input)

					if (inputChannelSettingsObj) {
						if (inputChannelSettingsObj.smartMix == true) {
							return true
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
						choices: model.input_channels,
					},
				],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					const opt = event.options
					const inputGainLevelObj = self.state.input_gain_levels.find((CHANNEL) => CHANNEL.id == opt.input)

					if (inputGainLevelObj) {
						if (inputGainLevelObj.max_vol_enabled == true) {
							return true
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
						choices: model.input_channels,
					},
				],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					const opt = event.options
					const inputGainLevelObj = self.state.input_gain_levels.find((CHANNEL) => CHANNEL.id == opt.input)

					if (inputGainLevelObj) {
						if (inputGainLevelObj.mute == true) {
							return true
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
						choices: model.output_channels,
					},
				],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					const opt = event.options
					const outputLevelObj = self.state.output_levels.find((CHANNEL) => CHANNEL.id == opt.output)

					if (outputLevelObj) {
						if (outputLevelObj.max_vol_enabled == true) {
							return true
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
						choices: model.output_channels,
					},
				],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					const opt = event.options
					const outputLevelObj = self.state.output_levels.find((CHANNEL) => CHANNEL.id == opt.output)

					if (outputLevelObj) {
						if (outputLevelObj.min_vol_enabled == true) {
							return true
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
						choices: model.output_channels,
					},
				],
				defaultStyle: {
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					const opt = event.options
					const outputMuteObj = self.state.output_mutes.find((CHANNEL) => CHANNEL.id == opt.output)

					if (outputMuteObj) {
						if (outputMuteObj.mute == true) {
							return true
						}
					}

					return false
				},
			}
		}

		if (model.feedbacks.includes('rec_status')) {
			feedbacks['rec_status'] = {
				type: 'boolean',
				name: 'Recorder Status',
				description: 'Show feedback for the state of the recorder',
				options: [
					{
						type: 'dropdown',
						label: 'Status',
						id: 'status',
						default: '1',
						choices: RECORDER_STATUS,
					},
				],
				defaultStyle: {
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(255, 0, 0),
				},
				callback: (event) => {
					return self.state.rec_status == event.options.status
				},
			}
		}
	}

	self.setFeedbackDefinitions(feedbacks)
}

/** Every feedback this module can define; checkFeedbacks needs them named explicitly. */
export const FEEDBACK_IDS = [
	'aec',
	'arraymic_mute',
	'gopm',
	'input_maxvolume_enabled',
	'input_mute',
	'lowcut',
	'output_maxvolume_enabled',
	'output_minvolume_enabled',
	'output_mute',
	'phantompower',
	'rec_status',
	'smartmix',
] as const
