import type { CompanionActionDefinitions, SomeCompanionActionInputField } from '@companion-module/base'
import type ModuleInstance from './main.js'
import {
	DUCKER_CHANNELS,
	DUCKER_TRIGGERS,
	EQ_FUNCTIONS,
	OPERATOR_FADERS,
	OSCILLATOR_FREQUENCIES,
	OSCILLATOR_SOURCES,
	SMARTMIX_GROUPS,
	SMARTMIX_MODES,
	fader_table,
	input_gain_table_line,
	input_gain_table_mic,
} from './constants.js'

export type ActionsSchema = {
	aec_calibration: {
		options: {
			action: string | number
		}
	}
	arraymic_mute: {
		options: {
			mute: string | number
			mic: string | number
		}
	}
	bootup_preset: {
		options: {
			preset: string | number
		}
	}
	call_partial_preset: {
		options: {
			partial: number
		}
	}
	call_preset: {
		options: {
			preset: string | number
		}
	}
	ducker: {
		options: {
			channel: string | number
			enable: boolean
			trigger: string | number
		}
	}
	fbs: {
		options: {
			channel: string | number
			processing_type: string | number
			enable: boolean
			band1: string | number
			band2: string | number
			band3: string | number
			band4: string | number
			band5: string | number
			band6: string | number
			band7: string | number
			band8: string | number
		}
	}
	front_panel: {
		options: {
			recall_preset: boolean
			led_dimmer: boolean
			error_notice: boolean
		}
	}
	identify: {
		options: Record<string, never>
	}
	input_gain_level: {
		options: {
			input: string | number
			gain_mic: string | number
			gain_line: string | number
			level: string | number
			max_volume_enable: boolean
			max_volume: string | number
			mute: boolean
			virtual_mic_gain: string | number
			min_volume_enable: boolean
			min_volume_level: string | number
		}
	}
	input_gain_level_decrease: {
		options: {
			input: string | number
			steps: number
		}
	}
	input_gain_level_increase: {
		options: {
			input: string | number
			steps: number
		}
	}
	input_level_decrease: {
		options: {
			input: string | number
			steps: number
		}
	}
	input_level_increase: {
		options: {
			input: string | number
			steps: number
		}
	}
	input_line_level_decrease: {
		options: {
			input: string | number
			steps: number
		}
	}
	input_line_level_increase: {
		options: {
			input: string | number
			steps: number
		}
	}
	input_max_vol_decrease: {
		options: {
			input: string | number
			steps: number
		}
	}
	input_max_vol_increase: {
		options: {
			input: string | number
			steps: number
		}
	}
	input_min_vol_decrease: {
		options: {
			input: string | number
			steps: number
		}
	}
	input_min_vol_increase: {
		options: {
			input: string | number
			steps: number
		}
	}
	input_mute: {
		options: {
			input: string | number
			mute: boolean
		}
	}
	open_mic_limit: {
		options: {
			group: string | number
			nom: number
		}
	}
	operator_mute: {
		options: {
			fader: string | number
			mute: boolean
			page: string | number
		}
	}
	oscillator: {
		options: {
			enable: boolean
			source: string | number
			frequency: string | number
			level: string | number
			assign: (string | number)[]
		}
	}
	output_12eq_func: {
		options: {
			output: string | number
			processing_type: string | number
			preset: number
		}
	}
	output_level: {
		options: {
			output: string | number
			level: string | number
			max_volume_enable: boolean
			max_volume: string | number
			min_volume_enable: boolean
			min_volume_level: string | number
		}
	}
	output_level_decrease: {
		options: {
			output: string | number
			steps: number
		}
	}
	output_level_increase: {
		options: {
			output: string | number
			steps: number
		}
	}
	output_max_vol_decrease: {
		options: {
			output: string | number
			steps: number
		}
	}
	output_max_vol_increase: {
		options: {
			output: string | number
			steps: number
		}
	}
	output_min_vol_decrease: {
		options: {
			output: string | number
			steps: number
		}
	}
	output_min_vol_increase: {
		options: {
			output: string | number
			steps: number
		}
	}
	output_mute: {
		options: {
			output: string | number
			mute: boolean
		}
	}
	save_preset: {
		options: {
			preset: string | number
		}
	}
	smart_mix_channel: {
		options: {
			input: string | number
			group: string | number
			weight: number
			priority: boolean
			cancut: boolean
			attenuation: number
			threshold: number
		}
	}
	smartmix_mode: {
		options: {
			group: string | number
			mode: string | number
		}
	}
	sopl: {
		options: {
			page: string | number
			fader: string | number
			level: number
		}
	}
	sopl_decrease: {
		options: {
			page: string | number
			fader: string | number
			steps: number
		}
	}
	sopl_increase: {
		options: {
			page: string | number
			fader: string | number
			steps: number
		}
	}
	sopm: {
		options: {
			page: string | number
			fader: string | number
			mute: boolean
		}
	}
	usb_out: {
		options: {
			usb1: string | number
			usb2: string | number
			level: string | number
		}
	}
}

export function UpdateActions(self: ModuleInstance): void {
	// Every action is declared so the schema is satisfied; the ones this model does not support
	// stay undefined, which Companion treats as absent.
	const actions: CompanionActionDefinitions<ActionsSchema> = {
		aec_calibration: undefined,
		arraymic_mute: undefined,
		bootup_preset: undefined,
		call_partial_preset: undefined,
		call_preset: undefined,
		ducker: undefined,
		fbs: undefined,
		front_panel: undefined,
		identify: undefined,
		input_gain_level: undefined,
		input_gain_level_decrease: undefined,
		input_gain_level_increase: undefined,
		input_level_decrease: undefined,
		input_level_increase: undefined,
		input_line_level_decrease: undefined,
		input_line_level_increase: undefined,
		input_max_vol_decrease: undefined,
		input_max_vol_increase: undefined,
		input_min_vol_decrease: undefined,
		input_min_vol_increase: undefined,
		input_mute: undefined,
		open_mic_limit: undefined,
		operator_mute: undefined,
		oscillator: undefined,
		output_12eq_func: undefined,
		output_level: undefined,
		output_level_decrease: undefined,
		output_level_increase: undefined,
		output_max_vol_decrease: undefined,
		output_max_vol_increase: undefined,
		output_min_vol_decrease: undefined,
		output_min_vol_increase: undefined,
		output_mute: undefined,
		save_preset: undefined,
		smart_mix_channel: undefined,
		smartmix_mode: undefined,
		sopl: undefined,
		sopl_decrease: undefined,
		sopl_increase: undefined,
		sopm: undefined,
		usb_out: undefined,
	}

	const model = self.model

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
						choices: model.input_channels,
					},
					{
						type: 'dropdown',
						label: 'Gain - Mic',
						id: 'gain_mic',
						default: input_gain_table_mic[0].id,
						choices: input_gain_table_mic,
					},
					{
						type: 'dropdown',
						label: 'Gain - Line',
						id: 'gain_line',
						default: input_gain_table_line[0].id,
						choices: input_gain_table_line,
					},
					{
						type: 'dropdown',
						label: 'Level',
						id: 'level',
						default: fader_table[0].id,
						choices: fader_table,
					},
					{
						type: 'checkbox',
						label: 'Max Volume Enable',
						id: 'max_volume_enable',
						default: false,
					},
					{
						type: 'dropdown',
						label: 'Max Volume',
						id: 'max_volume',
						default: fader_table[0].id,
						choices: fader_table,
					},
					{
						type: 'checkbox',
						label: 'Mute',
						id: 'mute',
						default: false,
					},
					{
						type: 'dropdown',
						label: 'Virtual Mic Gain',
						id: 'virtual_mic_gain',
						default: input_gain_table_line[0].id,
						choices: input_gain_table_line,
					},
				],
				callback: async (event) => {
					let params = ''

					params +=
						event.options.input +
						',' +
						event.options.gain_mic +
						',' +
						event.options.gain_line +
						',' +
						event.options.level +
						',' +
						(event.options.max_volume_enable ? '1' : '0') +
						',' +
						event.options.max_volume +
						',' +
						(event.options.mute ? '1' : '0') +
						',' +
						event.options.virtual_mic_gain

					if (model.id == 'atdm-1012') {
						params += ',' + (event.options.min_volume_enable ? '1' : '0') + ',' + event.options.min_volume_level
					}
					self.sendCommand('s_input_gain_level', 'S', params)
				},
			}

			if (model.id == 'atdm-1012') {
				actions['input_gain_level'].options.push({
					type: 'checkbox',
					label: 'Min Volume Enable',
					id: 'min_volume_enable',
					default: false,
				})

				actions['input_gain_level'].options.push({
					type: 'dropdown',
					label: 'Min Volume Level',
					id: 'min_volume_level',
					default: fader_table[0].id,
					choices: fader_table,
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
						choices: model.input_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildInputGainParams(self, event.options.input, 'mic_gain', 'increase', event.options.steps)
					self.sendCommand('s_input_gain_level', 'S', params)
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
						choices: model.input_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildInputGainParams(self, event.options.input, 'mic_gain', 'decrease', event.options.steps)
					self.sendCommand('s_input_gain_level', 'S', params)
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
						choices: model.input_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildInputGainParams(self, event.options.input, 'line_gain', 'increase', event.options.steps)
					self.sendCommand('s_input_gain_level', 'S', params)
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
						choices: model.input_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildInputGainParams(self, event.options.input, 'line_gain', 'decrease', event.options.steps)
					self.sendCommand('s_input_gain_level', 'S', params)
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
						choices: model.input_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildInputGainParams(self, event.options.input, 'level', 'increase', event.options.steps)
					if (model.id == 'atdm-1012') {
						const parts = params.split(',')
						self.sendCommand('SICL', 'S', `${event.options.input},${parts[3]}`)
					} else {
						self.sendCommand('s_input_gain_level', 'S', params)
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
						choices: model.input_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildInputGainParams(self, event.options.input, 'level', 'decrease', event.options.steps)
					if (model.id == 'atdm-1012') {
						const parts = params.split(',')
						self.sendCommand('SICL', 'S', `${event.options.input},${parts[3]}`)
					} else {
						self.sendCommand('s_input_gain_level', 'S', params)
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
						choices: model.input_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildInputGainParams(self, event.options.input, 'max_vol', 'increase', event.options.steps)
					self.sendCommand('s_input_gain_level', 'S', params)
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
						choices: model.input_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildInputGainParams(self, event.options.input, 'max_vol', 'decrease', event.options.steps)
					self.sendCommand('s_input_gain_level', 'S', params)
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
						choices: model.input_channels,
					},
					{
						type: 'checkbox',
						label: 'Mute/Unmute',
						id: 'mute',
						default: false,
					},
				],
				callback: async (event) => {
					if (model.id == 'atdm-1012') {
						// The ATDM-1012 has a dedicated mute command; s_input_gain_level would resend
						// the channel's gain and level alongside it.
						self.sendCommand('SICM', 'S', event.options.input + ',' + (event.options.mute ? '1' : '0'))
					} else {
						const params = buildInputGainParams(self, event.options.input, 'mute', event.options.mute)
						self.sendCommand('s_input_gain_level', 'S', params)
					}

					self.setInputMuteState(event.options.input, event.options.mute == true)
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
							choices: model.input_channels,
						},
						{
							type: 'number',
							id: 'steps',
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10,
						},
					],
					callback: async (event) => {
						const params = buildInputGainParams(self, event.options.input, 'min_vol', 'increase', event.options.steps)
						self.sendCommand('s_input_gain_level', 'S', params)
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
							choices: model.input_channels,
						},
						{
							type: 'number',
							id: 'steps',
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10,
						},
					],
					callback: async (event) => {
						const params = buildInputGainParams(self, event.options.input, 'min_vol', 'decrease', event.options.steps)
						self.sendCommand('s_input_gain_level', 'S', params)
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
						choices: model.output_channels,
					},
					{
						type: 'dropdown',
						label: 'Level',
						id: 'level',
						default: fader_table[0].id,
						choices: fader_table,
					},
					{
						type: 'checkbox',
						label: 'Max Volume Enable',
						id: 'max_volume_enable',
						default: false,
					},
					{
						type: 'dropdown',
						label: 'Max Volume',
						id: 'max_volume',
						default: fader_table[0].id,
						choices: fader_table,
					},
				],
				callback: async (event) => {
					let params = ''

					params +=
						event.options.output +
						',' +
						event.options.level +
						',' +
						(event.options.max_volume_enable ? '1' : '0') +
						',' +
						event.options.max_volume

					if (model.id == 'atdm-1012') {
						params += ',' + (event.options.min_volume_enable ? '1' : '0') + ',' + event.options.min_volume_level
					}

					self.sendCommand('s_output_level', 'S', params)
				},
			}

			if (model.id == 'atdm-1012') {
				actions['output_level'].options.push({
					type: 'checkbox',
					label: 'Min Volume Enable',
					id: 'min_volume_enable',
					default: false,
				})

				actions['output_level'].options.push({
					type: 'dropdown',
					label: 'Min Volume Level',
					id: 'min_volume_level',
					default: fader_table[0].id,
					choices: fader_table,
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
						choices: model.output_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildOutputLevelParams(self, event.options.output, 'level', 'increase', event.options.steps)
					self.sendCommand('s_output_level', 'S', params)
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
						choices: model.output_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildOutputLevelParams(self, event.options.output, 'level', 'decrease', event.options.steps)
					self.sendCommand('s_output_level', 'S', params)
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
						choices: model.output_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildOutputLevelParams(self, event.options.output, 'max_vol', 'increase', event.options.steps)
					self.sendCommand('s_output_level', 'S', params)
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
						choices: model.output_channels,
					},
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildOutputLevelParams(self, event.options.output, 'max_vol', 'decrease', event.options.steps)
					self.sendCommand('s_output_level', 'S', params)
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
							choices: model.output_channels,
						},
						{
							type: 'number',
							id: 'steps',
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10,
						},
					],
					callback: async (event) => {
						const params = buildOutputLevelParams(
							self,
							event.options.output,
							'min_vol',
							'increase',
							event.options.steps,
						)
						self.sendCommand('s_output_level', 'S', params)
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
							choices: model.output_channels,
						},
						{
							type: 'number',
							id: 'steps',
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10,
						},
					],
					callback: async (event) => {
						const params = buildOutputLevelParams(
							self,
							event.options.output,
							'min_vol',
							'decrease',
							event.options.steps,
						)
						self.sendCommand('s_output_level', 'S', params)
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
						choices: model.output_channels,
					},
					{
						type: 'checkbox',
						label: 'Mute/Unmute',
						id: 'mute',
						default: false,
					},
				],
				callback: async (event) => {
					let params = ''

					params += event.options.output + ',' + (event.options.mute ? '1' : '0')

					self.sendCommand('s_output_mute', 'S', params)
					self.setOutputMuteState(event.options.output, event.options.mute == true)
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
						choices: model.fbs_channels,
					},
					{
						type: 'dropdown',
						label: 'Processing Type',
						id: 'processing_type',
						disableAutoExpression: true,
						default: model.fbs_processing[0].id,
						choices: model.fbs_processing,
					},
					{
						type: 'checkbox',
						label: 'Enable',
						id: 'enable',
						default: false,
					},
					{
						type: 'dropdown',
						label: 'Band 1',
						id: 'band1',
						default: model.fbs_bands[0].id,
						choices: model.fbs_bands,
					},
					{
						type: 'dropdown',
						label: 'Band 2',
						id: 'band2',
						default: model.fbs_bands[0].id,
						choices: model.fbs_bands,
					},
					{
						type: 'dropdown',
						label: 'Band 3',
						id: 'band3',
						default: model.fbs_bands[0].id,
						choices: model.fbs_bands,
					},
					{
						type: 'dropdown',
						label: 'Band 4',
						id: 'band4',
						default: model.fbs_bands[0].id,
						choices: model.fbs_bands,
					},
					{
						type: 'dropdown',
						label: 'Band 5',
						id: 'band5',
						default: model.fbs_bands[0].id,
						choices: model.fbs_bands,
					},
					{
						type: 'dropdown',
						label: 'Band 6',
						id: 'band6',
						default: model.fbs_bands[0].id,
						choices: model.fbs_bands,
					},
					{
						type: 'dropdown',
						label: 'Band 7',
						id: 'band7',
						default: model.fbs_bands[0].id,
						choices: model.fbs_bands,
					},
					{
						type: 'dropdown',
						label: 'Band 8',
						id: 'band8',
						default: model.fbs_bands[0].id,
						choices: model.fbs_bands,
					},
				],
				callback: async (event) => {
					let params = ''

					params +=
						event.options.channel +
						',' +
						event.options.processing_type +
						',' +
						(event.options.enable ? '1' : '0') +
						',' +
						event.options.band1 +
						',' +
						event.options.band2 +
						',' +
						event.options.band3 +
						',' +
						event.options.band4 +
						',' +
						event.options.band5 +
						',' +
						event.options.band6 +
						',' +
						event.options.band7 +
						',' +
						event.options.band8

					self.sendCommand('s_fbs', 'S', params)
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
							{ id: '0', label: 'Unmute' },
							{ id: '1', label: 'Mute' },
						],
					},
					{
						type: 'dropdown',
						label: 'Mic',
						id: 'mic',
						default: '0',
						choices: [
							{ id: '0', label: 'Virtual Mic 1' },
							{ id: '1', label: 'Virtual Mic 2' },
						],
					},
				],
				callback: async (event) => {
					let params = ''

					params += event.options.mute + ',' + event.options.mic

					self.sendCommand('s_arraymic_mute', 'S', params)
					self.setArrayMicMuteState(event.options.mute == '1')
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
							{ id: 1, label: 'Page 1' },
							{ id: 2, label: 'Page 2' },
							{ id: 3, label: 'Page 3' },
							{ id: 4, label: 'Page 4' },
							{ id: 5, label: 'Page 5' },
							{ id: 6, label: 'Page 6' },
							{ id: 7, label: 'Page 7' },
							{ id: 8, label: 'Page 8' },
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
					{
						type: 'number',
						label: 'Level',
						id: 'level',
						default: 50,
						min: 0,
						max: 100,
					},
				],
				callback: async (event) => {
					self.state.operator_page[Number(event.options.page) - 1][`fader_${event.options.fader}_level`] =
						event.options.level

					const params = event.options.page + ',' + event.options.fader + ',' + event.options.level

					self.sendCommand('SOPL', 'S', params)
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
							{ id: 1, label: 'Page 1' },
							{ id: 2, label: 'Page 2' },
							{ id: 3, label: 'Page 3' },
							{ id: 4, label: 'Page 4' },
							{ id: 5, label: 'Page 5' },
							{ id: 6, label: 'Page 6' },
							{ id: 7, label: 'Page 7' },
							{ id: 8, label: 'Page 8' },
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
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildOperatorLevelParams(
						self,
						Number(event.options.page),
						Number(event.options.fader),
						'increase',
						event.options.steps,
					)
					self.sendCommand('SOPL', 'S', params)
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
							{ id: 1, label: 'Page 1' },
							{ id: 2, label: 'Page 2' },
							{ id: 3, label: 'Page 3' },
							{ id: 4, label: 'Page 4' },
							{ id: 5, label: 'Page 5' },
							{ id: 6, label: 'Page 6' },
							{ id: 7, label: 'Page 7' },
							{ id: 8, label: 'Page 8' },
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
					{
						type: 'number',
						id: 'steps',
						label: 'Steps',
						default: 1,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					const params = buildOperatorLevelParams(
						self,
						Number(event.options.page),
						Number(event.options.fader),
						'decrease',
						event.options.steps,
					)
					self.sendCommand('SOPL', 'S', params)
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
							{ id: 1, label: 'Page 1' },
							{ id: 2, label: 'Page 2' },
							{ id: 3, label: 'Page 3' },
							{ id: 4, label: 'Page 4' },
							{ id: 5, label: 'Page 5' },
							{ id: 6, label: 'Page 6' },
							{ id: 7, label: 'Page 7' },
							{ id: 8, label: 'Page 8' },
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
					{
						type: 'checkbox',
						label: 'Mute/Unmute',
						id: 'mute',
						default: false,
					},
				],
				callback: async (event) => {
					let params = ''

					params += event.options.page + ',' + event.options.fader + ',' + (event.options.mute ? '1' : '0')

					self.sendCommand('SOPM', 'S', params)
					self.setOperatorFaderMuteState(event.options.page, event.options.fader, event.options.mute == true)
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
						choices: model.preset_choices,
					},
				],
				callback: async (event) => {
					let params = ''

					params += event.options.preset

					if (model.id == 'atdm-1012') {
						self.sendCommand('CALLP', 'S', params)
					} else {
						self.sendCommand('call_preset', 'S', params)
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
						max: 40,
					},
				],
				callback: async (event) => {
					let params = ''

					params += event.options.partial

					self.sendCommand('call_partial_preset', 'S', params)
				},
			}
		}

		if (model.actions.includes('identify')) {
			actions['identify'] = {
				name: 'Identify (Blink Front Panel LEDs)',
				options: [],
				callback: async () => {
					self.sendCommand('identify', 'S', '')
				},
			}
		}

		if (model.actions.includes('save_preset')) {
			actions['save_preset'] = {
				name: 'Save Current Settings to Preset',
				options: [
					{
						type: 'dropdown',
						label: 'Preset/Bank Number',
						id: 'preset',
						default: model.preset_choices[0].id,
						choices: model.preset_choices,
					},
				],
				callback: async (event) => {
					// The ATDM-1012 names this one differently to the ATDM-0604.
					self.sendCommand(model.id == 'atdm-1012' ? 'REGIP' : 'save_preset', 'S', `${event.options.preset}`)
				},
			}
		}

		if (model.actions.includes('bootup_preset')) {
			actions['bootup_preset'] = {
				name: 'Set Boot Up Preset',
				options: [
					{
						type: 'dropdown',
						label: 'Preset/Bank Number',
						id: 'preset',
						default: 0,
						choices: [{ id: 0, label: 'None' }, ...model.preset_choices],
					},
				],
				callback: async (event) => {
					self.sendCommand('s_bootup_preset', 'S', `${event.options.preset}`)
				},
			}
		}

		if (model.actions.includes('front_panel')) {
			actions['front_panel'] = {
				name: 'Set Front Panel Restrictions',
				options: [
					{
						type: 'checkbox',
						label: 'Allow Preset Recall',
						id: 'recall_preset',
						default: true,
					},
					{
						type: 'checkbox',
						label: 'LED Dimmer',
						id: 'led_dimmer',
						default: false,
					},
					{
						type: 'checkbox',
						label: 'Show Errors',
						id: 'error_notice',
						default: true,
					},
				],
				callback: async (event) => {
					const params =
						(event.options.recall_preset ? '1' : '0') +
						',' +
						(event.options.led_dimmer ? '1' : '0') +
						',' +
						(event.options.error_notice ? '1' : '0')

					self.sendCommand('s_front_panel_limit', 'S', params)
				},
			}
		}

		if (model.actions.includes('operator_mute')) {
			actions['operator_mute'] = {
				name: 'Mute Web Remote Operator Fader',
				// Definitions are built per model, so the page selector is simply left out where there is
				// only one page. isVisible cannot be used for this: it is serialised and must not read
				// anything from the enclosing scope.
				options: (model.id == 'atdm-1012'
					? ([
							{
								type: 'dropdown',
								label: 'Operator Page',
								id: 'page',
								default: 1,
								choices: model.operator_pages ?? [],
							},
						] as SomeCompanionActionInputField<'page' | 'fader' | 'mute'>[])
					: []
				).concat([
					{
						type: 'dropdown',
						label: 'Operator Fader',
						id: 'fader',
						default: 1,
						choices: OPERATOR_FADERS,
					},
					{
						type: 'checkbox',
						label: 'Mute/Unmute',
						id: 'mute',
						default: false,
					},
				]),
				callback: async (event) => {
					// The ATDM-1012 has eight operator pages and names the page last; the ATDM-0604 has one.
					let params = event.options.fader + ',' + (event.options.mute ? '1' : '0')

					if (model.id == 'atdm-1012') {
						params += ',' + event.options.page
					}

					self.sendCommand('s_operator_mute', 'S', params)
				},
			}
		}

		if (model.actions.includes('smartmix_mode')) {
			actions['smartmix_mode'] = {
				name: 'Set Smart Mix Mode',
				options: [
					{
						type: 'dropdown',
						label: 'Smart Mix Group',
						id: 'group',
						default: 1,
						choices: SMARTMIX_GROUPS,
					},
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: '0',
						choices: SMARTMIX_MODES,
					},
				],
				callback: async (event) => {
					self.sendCommand('SSMM', 'S', event.options.group + ',' + event.options.mode)
				},
			}
		}

		if (model.actions.includes('open_mic_limit')) {
			actions['open_mic_limit'] = {
				name: 'Set Number of Open Mics',
				options: [
					{
						type: 'dropdown',
						label: 'Smart Mix Group',
						id: 'group',
						default: 1,
						choices: SMARTMIX_GROUPS,
					},
					{
						type: 'number',
						label: 'Number of Open Mics',
						id: 'nom',
						default: 6,
						min: 1,
						max: 10,
					},
				],
				callback: async (event) => {
					self.sendCommand('NOOM', 'S', event.options.group + ',' + event.options.nom)
				},
			}
		}

		if (model.actions.includes('usb_out')) {
			actions['usb_out'] = {
				name: 'Set USB Output',
				options: [
					{
						type: 'dropdown',
						label: 'USB 1 Source',
						id: 'usb1',
						default: '0',
						choices: model.usb_out_sources ?? [],
					},
					{
						type: 'dropdown',
						label: 'USB 2 Source',
						id: 'usb2',
						default: '0',
						choices: model.usb_out_sources ?? [],
					},
					{
						type: 'dropdown',
						label: 'Send Level',
						id: 'level',
						default: '411',
						choices: fader_table.filter((ROW) => Number(ROW.id) <= 411),
					},
				],
				callback: async (event) => {
					self.sendCommand('s_usb_out', 'S', event.options.usb1 + ',' + event.options.usb2 + ',' + event.options.level)
				},
			}
		}

		if (model.actions.includes('ducker')) {
			actions['ducker'] = {
				name: 'Set Ducker',
				options: [
					{
						type: 'dropdown',
						label: 'Channel',
						id: 'channel',
						default: '0',
						choices: DUCKER_CHANNELS,
					},
					{
						type: 'checkbox',
						label: 'Enable',
						id: 'enable',
						default: false,
					},
					{
						type: 'dropdown',
						label: 'Trigger Bus',
						id: 'trigger',
						default: '1',
						choices: DUCKER_TRIGGERS,
					},
				],
				callback: async (event) => {
					// All four channel pairs are sent together, so keep the ones we are not changing.
					const existing = self.state.ducker || []
					const params = []

					for (let i = 0; i < DUCKER_CHANNELS.length; i++) {
						const channel = DUCKER_CHANNELS[i].id
						const current = existing.find((CHANNEL) => CHANNEL.id == channel) || { enabled: false, trigger: '1' }

						if (channel == event.options.channel) {
							params.push(event.options.enable ? '1' : '0', `${event.options.trigger}`)
						} else {
							params.push(current.enabled ? '1' : '0', `${current.trigger}`)
						}
					}

					self.sendCommand('s_ducker_general', 'S', params.join(','))
				},
			}
		}

		if (model.actions.includes('oscillator')) {
			actions['oscillator'] = {
				name: 'Set Oscillator (Test Tone)',
				options: [
					{
						type: 'checkbox',
						label: 'Enable',
						id: 'enable',
						default: false,
					},
					{
						type: 'dropdown',
						label: 'Source',
						id: 'source',
						default: '0',
						choices: OSCILLATOR_SOURCES,
					},
					{
						type: 'dropdown',
						label: 'Frequency',
						id: 'frequency',
						default: '1',
						choices: OSCILLATOR_FREQUENCIES,
					},
					{
						type: 'dropdown',
						label: 'Level',
						id: 'level',
						default: '0',
						choices: fader_table.filter((ROW) => Number(ROW.id) <= 121),
					},
					{
						type: 'multidropdown',
						label: 'Assign To Outputs',
						id: 'assign',
						default: [],
						choices: model.output_channels,
					},
				],
				callback: async (event) => {
					const assigned = event.options.assign || []

					const params = [
						event.options.enable ? '1' : '0',
						event.options.source,
						event.options.frequency,
						event.options.level,
					]

					for (let i = 0; i < model.output_channels.length; i++) {
						params.push(assigned.includes(model.output_channels[i].id) ? '1' : '0')
					}

					self.sendCommand('s_oscillator', 'S', params.join(','))
				},
			}
		}

		if (model.actions.includes('aec_calibration')) {
			actions['aec_calibration'] = {
				name: 'AEC Calibration',
				options: [
					{
						type: 'dropdown',
						label: 'Action',
						id: 'action',
						default: 'test',
						choices: [
							{ id: 'test', label: 'Run Test' },
							{ id: 'start', label: 'Start Measurement' },
							{ id: 'stop', label: 'Stop Measurement' },
						],
					},
				],
				callback: async (event) => {
					// The result arrives later as an aec_calibration_notice.
					self.sendCommand(`aec_calibration_${event.options.action}`, 'S', '')
				},
			}
		}

		if (model.actions.includes('output_12eq_func')) {
			actions['output_12eq_func'] = {
				name: 'Recall or Reset Output EQ',
				options: [
					{
						type: 'dropdown',
						label: 'Output Channel',
						id: 'output',
						default: model.output_channels[0].id,
						choices: model.output_channels,
					},
					{
						type: 'dropdown',
						label: 'Action',
						id: 'processing_type',
						disableAutoExpression: true,
						default: '1',
						choices: EQ_FUNCTIONS,
					},
					{
						type: 'number',
						label: 'EQ Library Number',
						id: 'preset',
						default: 1,
						min: 1,
						max: 20,
						isVisibleExpression: "$(options:processing_type) == '1' || $(options:processing_type) == '2'",
					},
				],
				callback: async (event) => {
					// The library number is only read for recall and save.
					self.sendCommand(
						's_output_12eq_func',
						'S',
						event.options.output + ',' + event.options.processing_type + ',' + event.options.preset,
					)
				},
			}
		}

		if (model.actions.includes('smart_mix_channel')) {
			actions['smart_mix_channel'] = {
				name: 'Set Smart Mix Channel Settings',
				options: [
					{
						type: 'dropdown',
						label: 'Input Channel',
						id: 'input',
						default: model.input_channels[0].id,
						choices: model.input_channels.filter((CHANNEL) => Number(CHANNEL.id) <= 9),
					},
					{
						type: 'dropdown',
						label: 'Smart Mix Group',
						id: 'group',
						default: 1,
						choices: SMARTMIX_GROUPS,
					},
					{
						type: 'number',
						label: 'Gain Share Weight (-15.0 to +15.0 dB)',
						id: 'weight',
						default: 30,
						min: 0,
						max: 60,
					},
					{
						type: 'checkbox',
						label: 'Priority',
						id: 'priority',
						default: false,
					},
					{
						type: 'checkbox',
						label: 'Can Cut',
						id: 'cancut',
						default: false,
					},
					{
						type: 'number',
						label: 'Closed Mic Attenuation (-60 to 0 dB)',
						id: 'attenuation',
						default: 60,
						min: 0,
						max: 60,
					},
					{
						type: 'number',
						label: 'Threshold (-10 to +10 dB)',
						id: 'threshold',
						default: 10,
						min: 0,
						max: 20,
					},
				],
				callback: async (event) => {
					const params = [
						event.options.input,
						event.options.group,
						event.options.weight,
						event.options.priority ? '1' : '0',
						event.options.cancut ? '1' : '0',
						event.options.attenuation,
						event.options.threshold,
					]

					self.sendCommand('s_smart_mix', 'S', params.join(','))
				},
			}
		}
	}

	self.setActionDefinitions(actions)
}

export function buildInputGainParams(
	self: ModuleInstance,
	input: string | number,
	choice: string,
	direction: string | boolean,
	steps = 0,
): string {
	const model = self.model

	let params = ''

	if (!model) {
		return params
	}

	const dataObj = self.state.input_gain_levels.find((CHANNEL) => CHANNEL.id == input)

	if (dataObj) {
		let index: number

		switch (choice) {
			case 'mic_gain':
				index = input_gain_table_mic.findIndex((GAIN) => GAIN.id == dataObj.mic_gain)

				if (direction == 'increase') {
					if (index <= input_gain_table_mic.length - steps - 1) {
						index = index + steps
					}
				} else {
					if (index - steps >= 0) {
						index = index - steps
					}
				}

				dataObj.mic_gain = String(input_gain_table_mic[index].id)

				break
			case 'line_gain':
				index = input_gain_table_line.findIndex((GAIN) => GAIN.id == dataObj.line_gain)

				if (direction == 'increase') {
					if (index <= input_gain_table_line.length - steps - 1) {
						index = index + steps
					}
				} else {
					if (index - steps >= 0) {
						index = index - steps
					}
				}

				dataObj.line_gain = String(input_gain_table_line[index].id)

				break
			case 'level':
				index = fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.level)

				if (direction == 'increase') {
					if (index <= fader_table.length - steps - 1) {
						index = index + steps
					}
				} else {
					if (index - steps >= 0) {
						index = index - steps
					}
				}

				dataObj.level = String(fader_table[index].id)

				break
			case 'max_vol':
				index = fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.max_vol)

				if (direction == 'increase') {
					if (index <= fader_table.length - steps - 1) {
						index = index + steps
					}
				} else {
					if (index - steps >= 0) {
						index = index - steps
					}
				}

				dataObj.max_vol_enabled = true
				dataObj.max_vol = String(fader_table[index].id)

				break
			case 'mute':
				dataObj.mute = direction === true || direction === '1'
				break
			case 'min_vol':
				index = fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.min_vol)

				if (direction == 'increase') {
					if (index <= fader_table.length - steps - 1) {
						index = index + steps
					}
				} else {
					if (index - steps >= 0) {
						index = index - steps
					}
				}

				dataObj.min_vol_enabled = true
				dataObj.min_vol = String(fader_table[index].id)

				break
		}

		params +=
			input +
			',' +
			dataObj.mic_gain +
			',' +
			dataObj.line_gain +
			',' +
			dataObj.level +
			',' +
			(dataObj.max_vol_enabled ? '1' : '0') +
			',' +
			dataObj.max_vol +
			',' +
			(dataObj.mute ? '1' : '0') +
			',' +
			dataObj.virtual_mic_gain

		if (model.id == 'atdm-1012') {
			params += ',' + (dataObj.min_vol_enabled ? '1' : '0') + ',' + dataObj.min_vol
		}
	}

	return params
}

export function buildOutputLevelParams(
	self: ModuleInstance,
	output: string | number,
	choice: string,
	direction: string | boolean,
	steps = 0,
): string {
	const model = self.model

	let params = ''

	if (!model) {
		return params
	}

	const dataObj = self.state.output_levels.find((CHANNEL) => CHANNEL.id == output)

	if (dataObj) {
		let index: number

		switch (choice) {
			case 'level':
				index = fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.level)

				if (direction == 'increase') {
					if (index <= fader_table.length - steps - 1) {
						index = index + steps
					}
				} else {
					if (index - steps >= 0) {
						index = index - steps
					}
				}

				dataObj.level = String(fader_table[index].id)

				break
			case 'max_vol':
				index = fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.max_vol)

				if (direction == 'increase') {
					if (index <= fader_table.length - steps - 1) {
						index = index + steps
					}
				} else {
					if (index - steps >= 0) {
						index = index - steps
					}
				}

				dataObj.max_vol = String(fader_table[index].id)

				break
			case 'min_vol':
				index = fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.min_vol)

				if (direction == 'increase') {
					if (index <= fader_table.length - steps - 1) {
						index = index + steps
					}
				} else {
					if (index - steps >= 0) {
						index = index - steps
					}
				}

				dataObj.min_vol = String(fader_table[index].id)

				break
		}

		params += output + ',' + dataObj.level + ',' + (dataObj.max_vol_enabled ? '1' : '0') + ',' + dataObj.max_vol

		if (model.id == 'atdm-1012') {
			params += ',' + (dataObj.min_vol_enabled ? '1' : '0') + ',' + dataObj.min_vol
		}
	}

	return params
}

export function buildOperatorLevelParams(
	self: ModuleInstance,
	page: number,
	fader: number,
	direction: string,
	steps = 0,
): string {
	if (direction != 'increase') {
		steps = -steps
	}

	const newLevel = Number(self.state.operator_page[page - 1][`fader_${fader}_level`]) + steps
	self.state.operator_page[page - 1][`fader_${fader}_level`] = newLevel

	const params = page + ',' + fader + ',' + newLevel

	return params
}
