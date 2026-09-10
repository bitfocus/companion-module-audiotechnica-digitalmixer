import type { CompanionVariableDefinitions, CompanionVariableValues } from '@companion-module/base'
import type ModuleInstance from './main.js'
import {
	AEC_CALIBRATION_RESULTS,
	LEVEL_METER_POINTS,
	RECORDER_STATUS,
	output_channel_settings_fadergroups,
	output_channel_settings_sources,
	output_channel_settings_unity,
} from './constants.js'

/**
 * The set of variables depends on the selected model - an ATDM-1012 defines around 650 - so they cannot
 * be enumerated in a static schema.
 */
export type VariablesSchema = CompanionVariableValues

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const variables: { variableId: string; name: string }[] = []

	variables.push({ variableId: 'model', name: 'Model' })

	const model = self.model

	if (model) {
		//push model specific variables
		if (model.variables.includes('arraymic_mute')) {
			variables.push({ variableId: 'arraymic_mute', name: 'Array Mic Mute Status' })
		}

		if (model.variables.includes('gopl')) {
			for (let i = 1; i <= 8; i++) {
				for (let j = 1; j <= 8; j++) {
					variables.push({ variableId: `gopl_${i}_${j}`, name: `Operator Fader Page ${i} Fader ${j} Level` })
				}
			}
		}

		if (model.variables.includes('gopm')) {
			for (let i = 1; i <= 8; i++) {
				for (let j = 1; j <= 8; j++) {
					variables.push({ variableId: `gopm_${i}_${j}`, name: `Operator Fader Page ${i} Fader ${j} Mute Status` })
				}
			}
		}

		if (model.variables.includes('input_channel_settings')) {
			for (let i = 0; i < model.input_channels_request.length; i++) {
				variables.push({
					variableId: `${model.input_channels[i].variableId}_source`,
					name: `${model.input_channels[i].label} Source`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_phantompower`,
					name: `${model.input_channels[i].label} Phantom Power`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_phase`,
					name: `${model.input_channels[i].label} Phase`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_lowcut`,
					name: `${model.input_channels[i].label} Low Cut`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_aec`,
					name: `${model.input_channels[i].label} AEC`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_smartmix`,
					name: `${model.input_channels[i].label} Smart Mix`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_link`,
					name: `${model.input_channels[i].label} Link`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_channelname`,
					name: `${model.input_channels[i].label} Channel Name`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_color`,
					name: `${model.input_channels[i].label} Color`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_virtualmic_orientation`,
					name: `${model.input_channels[i].label} Virtual Mic Orientation`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_virtualmic_tilt`,
					name: `${model.input_channels[i].label} Virtual Mic Tilt`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_virtualmic_pattern`,
					name: `${model.input_channels[i].label} Virtual Mic Pattern`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_fadergroup`,
					name: `${model.input_channels[i].label} Fader Group`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_smartmixgroup`,
					name: `${model.input_channels[i].label} Smart Mix Group`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_mono`,
					name: `${model.input_channels[i].label} Mono`,
				})
			}
		}

		if (model.variables.includes('sub_input_channel_settings')) {
			for (let i = 0; i < (model.sub_input_channels ?? []).length; i++) {
				variables.push({
					variableId: `${(model.sub_input_channels ?? [])[i].variableId}_source`,
					name: `${(model.sub_input_channels ?? [])[i].label} Source`,
				})
				variables.push({
					variableId: `${(model.sub_input_channels ?? [])[i].variableId}_inputgain`,
					name: `${(model.sub_input_channels ?? [])[i].label} Input Gain`,
				})
				variables.push({
					variableId: `${(model.sub_input_channels ?? [])[i].variableId}_lowcut`,
					name: `${(model.sub_input_channels ?? [])[i].label} Low Cut`,
				})
				variables.push({
					variableId: `${(model.sub_input_channels ?? [])[i].variableId}_link`,
					name: `${(model.sub_input_channels ?? [])[i].label} Link`,
				})
				variables.push({
					variableId: `${(model.sub_input_channels ?? [])[i].variableId}_channelname`,
					name: `${(model.sub_input_channels ?? [])[i].label} Channel Name`,
				})
				variables.push({
					variableId: `${(model.sub_input_channels ?? [])[i].variableId}_color`,
					name: `${(model.sub_input_channels ?? [])[i].label} Color`,
				})
				variables.push({
					variableId: `${(model.sub_input_channels ?? [])[i].variableId}_fadergroup`,
					name: `${(model.sub_input_channels ?? [])[i].label} Fader Group`,
				})
			}
		}

		if (model.variables.includes('input_gain_level')) {
			for (let i = 0; i < model.input_channels_request.length; i++) {
				variables.push({
					variableId: `${model.input_channels[i].variableId}_mic_gain`,
					name: `${model.input_channels[i].label} Mic Gain`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_line_gain`,
					name: `${model.input_channels[i].label} Line Gain`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_level`,
					name: `${model.input_channels[i].label} Level`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_maxvolume_enabled`,
					name: `${model.input_channels[i].label} Max Volume Enabled`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_maxvolume`,
					name: `${model.input_channels[i].label} Max Volume Level`,
				})
				variables.push({
					variableId: `${model.input_channels[i].variableId}_mute`,
					name: `${model.input_channels[i].label} Mute`,
				})
			}
		}

		if (model.variables.includes('output_channel_settings')) {
			for (let i = 0; i < model.output_channels.length; i++) {
				variables.push({
					variableId: `${model.output_channels[i].variableId}_unity`,
					name: `${model.output_channels[i].label} Unity`,
				})
				variables.push({
					variableId: `${model.output_channels[i].variableId}_channelname`,
					name: `${model.output_channels[i].label} Channel Name`,
				})
				variables.push({
					variableId: `${model.output_channels[i].variableId}_color`,
					name: `${model.output_channels[i].label} Color`,
				})
				variables.push({
					variableId: `${model.output_channels[i].variableId}_link`,
					name: `${model.output_channels[i].label} Link`,
				})
				variables.push({
					variableId: `${model.output_channels[i].variableId}_source`,
					name: `${model.output_channels[i].label} Source`,
				})
				variables.push({
					variableId: `${model.output_channels[i].variableId}_fadergroup`,
					name: `${model.output_channels[i].label} Fader Group`,
				})
			}
		}

		if (model.variables.includes('output_level')) {
			for (let i = 0; i < model.output_channels.length; i++) {
				variables.push({
					variableId: `${model.output_channels[i].variableId}_level`,
					name: `${model.output_channels[i].label} Level`,
				})
				variables.push({
					variableId: `${model.output_channels[i].variableId}_maxvolume_enabled`,
					name: `${model.output_channels[i].label} Max Volume Enabled`,
				})
				variables.push({
					variableId: `${model.output_channels[i].variableId}_maxvolume`,
					name: `${model.output_channels[i].label} Max Volume`,
				})
				variables.push({
					variableId: `${model.output_channels[i].variableId}_minvolume_enabled`,
					name: `${model.output_channels[i].label} Min Volume Enabled`,
				})
				variables.push({
					variableId: `${model.output_channels[i].variableId}_minvolume`,
					name: `${model.output_channels[i].label} Min Volume`,
				})
			}
		}

		if (model.variables.includes('output_mute')) {
			for (let i = 0; i < model.output_channels.length; i++) {
				variables.push({
					variableId: `${model.output_channels[i].variableId}_mute`,
					name: `${model.output_channels[i].label} Mute`,
				})
			}
		}

		if (model.variables.includes('preset_number')) {
			variables.push({ variableId: `preset_number`, name: `Current Preset Number` })
		}

		if (model.variables.includes('partial_preset_number')) {
			variables.push({ variableId: `partial_preset_number`, name: `Current Partial Preset Number` })
		}

		if (model.variables.includes('device_info')) {
			variables.push({ variableId: `firmware_version`, name: `Firmware Version` })
			variables.push({ variableId: `device_id`, name: `Device ID` })
		}

		if (model.variables.includes('preset_names')) {
			for (let i = 0; i < model.preset_choices.length; i++) {
				variables.push({
					variableId: `preset_name_${model.preset_choices[i].id}`,
					name: `${model.preset_choices[i].label} Name`,
				})
			}
		}

		if (model.variables.includes('rec_status')) {
			variables.push({ variableId: `rec_status`, name: `Recorder Status` })
		}

		if (model.variables.includes('aec_calibration')) {
			variables.push({ variableId: `aec_calibration_result`, name: `AEC Calibration Result` })
		}

		if (model.variables.includes('level_meter')) {
			const meterPoints = LEVEL_METER_POINTS[model.id] || []

			for (let i = 0; i < meterPoints.length; i++) {
				variables.push({ variableId: `meterlevel_${meterPoints[i].id}`, name: `Meter Level: ${meterPoints[i].label}` })
			}
		}

		if (model.variables.includes('open_channel_notice')) {
			if (model.id == 'atdm-1012') {
				for (let i = 0; i < model.input_channels_request.length; i++) {
					for (let j = 1; j <= 4; j++) {
						variables.push({
							variableId: `${model.input_channels[i].variableId}_smartmix${j}_open`,
							name: `${model.input_channels[i].label} Smart Mix ${j} Open`,
						})
					}
				}
			} else if (model.id == 'atdm-0604a') {
				for (let i = 0; i < 6; i++) {
					variables.push({
						variableId: `${model.input_channels[i].variableId}_open`,
						name: `${model.input_channels[i].label} Open`,
					})
				}
			}
		}
	}

	const definitions: CompanionVariableDefinitions<VariablesSchema> = {}

	for (const variable of variables) {
		definitions[variable.variableId] = { name: variable.name }
	}

	self.setVariableDefinitions(definitions)

	self.setVariableValues({
		model: model?.label ?? '',
	})
}

export function checkVariables(self: ModuleInstance): void {
	try {
		const model = self.model

		if (model) {
			if (model.variables.includes('input_channel_settings')) {
				const variableObj: CompanionVariableValues = {}
				for (let i = 0; i < self.state.input_channel_settings.length; i++) {
					const inputChannelSettingsObj = self.state.input_channel_settings[i]
					const modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputChannelSettingsObj.id)

					if (!modelChannelObj) continue

					variableObj[`${modelChannelObj.variableId}_source`] =
						(model.input_channel_sources ?? []).find((SOURCE) => SOURCE.id == inputChannelSettingsObj.source)?.label ??
						''
					variableObj[`${modelChannelObj.variableId}_phantompower`] =
						inputChannelSettingsObj.phantomPower == true ? 'On' : 'Off'
					variableObj[`${modelChannelObj.variableId}_phase`] = inputChannelSettingsObj.phase
					variableObj[`${modelChannelObj.variableId}_lowcut`] = inputChannelSettingsObj.lowCut == true ? 'On' : 'Off'
					variableObj[`${modelChannelObj.variableId}_aec`] = inputChannelSettingsObj.aec == true ? 'On' : 'Off'
					variableObj[`${modelChannelObj.variableId}_smartmix`] =
						inputChannelSettingsObj.smartMix == true ? 'On' : 'Off'
					variableObj[`${modelChannelObj.variableId}_link`] = inputChannelSettingsObj.link
					variableObj[`${modelChannelObj.variableId}_channelname`] = inputChannelSettingsObj.channelName

					variableObj[`${modelChannelObj.variableId}_color`] = ''

					if (inputChannelSettingsObj.color) {
						const modelColorObj = model.colors.find((COLOR) => COLOR.id == inputChannelSettingsObj.color)
						if (modelColorObj) {
							variableObj[`${modelChannelObj.variableId}_color`] = modelColorObj.label
						} else {
							if (inputChannelSettingsObj.color) {
								variableObj[`${modelChannelObj.variableId}_color`] = inputChannelSettingsObj.color
							}
						}
					}

					variableObj[`${modelChannelObj.variableId}_virtualmic_orientation`] =
						inputChannelSettingsObj.virtualMicOrientation
					variableObj[`${modelChannelObj.variableId}_virtualmic_tilt`] = inputChannelSettingsObj.virtualMicTilt
					variableObj[`${modelChannelObj.variableId}_virtualmic_pattern`] = inputChannelSettingsObj.virtualMicPattern
					variableObj[`${modelChannelObj.variableId}_fadergroup`] = inputChannelSettingsObj.faderGroup
					variableObj[`${modelChannelObj.variableId}_smartmixgroup`] = inputChannelSettingsObj.smartMixGroup
					variableObj[`${modelChannelObj.variableId}_mono`] = inputChannelSettingsObj.mono
				}

				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('sub_input_channel_settings')) {
				const variableObj: CompanionVariableValues = {}
				for (let i = 0; i < self.state.sub_input_channel_settings.length; i++) {
					const subinputChannelSettingsObj = self.state.sub_input_channel_settings[i]
					const modelChannelObj = (model.sub_input_channels ?? []).find(
						(CHANNEL) => CHANNEL.id == subinputChannelSettingsObj.id,
					)

					if (!modelChannelObj) continue

					variableObj[`${modelChannelObj.variableId}_source`] =
						(model.sub_input_channel_sources ?? []).find((SOURCE) => SOURCE.id == subinputChannelSettingsObj.source)
							?.label ?? ''
					variableObj[`${modelChannelObj.variableId}_inputgain`] = subinputChannelSettingsObj.input_gain_label
					variableObj[`${modelChannelObj.variableId}_lowcut`] = subinputChannelSettingsObj.lowCut == true ? 'On' : 'Off'
					variableObj[`${modelChannelObj.variableId}_link`] = subinputChannelSettingsObj.link
					variableObj[`${modelChannelObj.variableId}_channelname`] = subinputChannelSettingsObj.channelName
					variableObj[`${modelChannelObj.variableId}_color`] = subinputChannelSettingsObj.color
					variableObj[`${modelChannelObj.variableId}_fadergroup`] = subinputChannelSettingsObj.faderGroup
				}

				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('input_gain_level')) {
				const variableObj: CompanionVariableValues = {}
				for (let i = 0; i < self.state.input_gain_levels.length; i++) {
					const inputGainLevelObj = self.state.input_gain_levels[i]
					const modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputGainLevelObj.id)

					if (!modelChannelObj) continue

					variableObj[`${modelChannelObj.variableId}_mic_gain`] = inputGainLevelObj.mic_gain_label
					variableObj[`${modelChannelObj.variableId}_line_gain`] = inputGainLevelObj.line_gain_label
					variableObj[`${modelChannelObj.variableId}_level`] = inputGainLevelObj.level_label
					variableObj[`${modelChannelObj.variableId}_maxvolume_enabled`] =
						inputGainLevelObj.max_vol_enabled == true ? 'On' : 'Off'
					variableObj[`${modelChannelObj.variableId}_maxvolume`] = inputGainLevelObj.max_vol_label
					variableObj[`${modelChannelObj.variableId}_mute`] = inputGainLevelObj.mute == true ? 'On' : 'Off'
				}
				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('output_channel_settings')) {
				const variableObj: CompanionVariableValues = {}
				for (let i = 0; i < self.state.output_channel_settings.length; i++) {
					const outputChannelSettingsObj = self.state.output_channel_settings[i]
					const modelChannelObj = model.output_channels.find((CHANNEL) => CHANNEL.id == outputChannelSettingsObj.id)

					if (!modelChannelObj) continue

					const unityObj = output_channel_settings_unity.find((UNITY) => UNITY.id == outputChannelSettingsObj.unity)
					let unityLabel = ''
					if (unityObj) {
						unityLabel = unityObj.label
					}
					variableObj[`${modelChannelObj.variableId}_unity`] = unityLabel
					variableObj[`${modelChannelObj.variableId}_channelname`] = outputChannelSettingsObj.channelName
					variableObj[`${modelChannelObj.variableId}_color`] = outputChannelSettingsObj.color
					variableObj[`${modelChannelObj.variableId}_link`] = outputChannelSettingsObj.link
					const sourceObj = output_channel_settings_sources.find(
						(SOURCE) => SOURCE.id == outputChannelSettingsObj.source,
					)
					let sourceLabel = ''
					if (sourceObj) {
						sourceLabel = sourceObj.label
					}
					variableObj[`${modelChannelObj.variableId}_source`] = sourceLabel
					const fadergroupObj = output_channel_settings_fadergroups.find(
						(FADERGROUP) => FADERGROUP.id == outputChannelSettingsObj.faderGroup,
					)
					let fadergroupLabel = ''
					if (fadergroupObj) {
						fadergroupLabel = fadergroupObj.label
					}
					variableObj[`${modelChannelObj.variableId}_fadergroup`] = fadergroupLabel
				}
				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('output_level')) {
				const variableObj: CompanionVariableValues = {}
				for (let i = 0; i < self.state.output_levels.length; i++) {
					const outputLevelObj = self.state.output_levels[i]
					const modelChannelObj = model.output_channels.find((CHANNEL) => CHANNEL.id == outputLevelObj.id)

					if (!modelChannelObj) continue

					variableObj[`${modelChannelObj.variableId}_level`] = outputLevelObj.level_label
					variableObj[`${modelChannelObj.variableId}_maxvolume_enabled`] =
						outputLevelObj.max_vol_enabled == true ? 'On' : 'Off'
					variableObj[`${modelChannelObj.variableId}_maxvolume`] = outputLevelObj.max_vol_label
					variableObj[`${modelChannelObj.variableId}_minvolume_enabled`] =
						outputLevelObj.min_vol_enabled == true ? 'On' : 'Off'
					variableObj[`${modelChannelObj.variableId}_minvolume`] = outputLevelObj.min_vol_label
				}
				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('output_mute')) {
				const variableObj: CompanionVariableValues = {}
				for (let i = 0; i < self.state.output_mutes.length; i++) {
					const outputMuteObj = self.state.output_mutes[i]
					const modelChannelObj = model.output_channels.find((CHANNEL) => CHANNEL.id == outputMuteObj.id)

					if (!modelChannelObj) continue

					variableObj[`${modelChannelObj.variableId}_mute`] = outputMuteObj.mute == true ? 'On' : 'Off'
				}
				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('preset_number')) {
				const variableObj: CompanionVariableValues = {}
				variableObj[`preset_number`] = self.state.preset_number
				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('partial_preset_number')) {
				const variableObj: CompanionVariableValues = {}
				variableObj[`partial_preset_number`] = self.state.partial_preset_number
				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('device_info')) {
				self.setVariableValues({
					firmware_version: self.state.firmware_version,
					device_id: self.state.device_id,
				})
			}

			if (model.variables.includes('preset_names')) {
				const variableObj: CompanionVariableValues = {}
				for (let i = 0; i < self.state.preset_names.length; i++) {
					variableObj[`preset_name_${self.state.preset_names[i].id}`] = self.state.preset_names[i].name
				}
				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('rec_status')) {
				const recorderStatusObj = RECORDER_STATUS.find((STATUS) => STATUS.id == self.state.rec_status)
				self.setVariableValues({ rec_status: recorderStatusObj ? recorderStatusObj.label : '' })
			}

			if (model.variables.includes('aec_calibration')) {
				const aecResultObj = AEC_CALIBRATION_RESULTS.find((RESULT) => RESULT.id == self.state.aec_calibration_result)
				self.setVariableValues({ aec_calibration_result: aecResultObj ? aecResultObj.label : '' })
			}

			if (model.variables.includes('level_meter')) {
				const variableObj: CompanionVariableValues = {}
				for (let i = 0; i < self.state.meter_levels.length; i++) {
					const meterLevelObj = self.state.meter_levels[i]
					variableObj[`meterlevel_${meterLevelObj.monitorPoint}`] = meterLevelObj.level
				}
				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('open_channel_notice')) {
				const variableObj: CompanionVariableValues = {}

				if (self.model?.id == 'atdm-1012') {
					for (let i = 0; i < self.state.open_channels.length; i++) {
						const openChannelObj = self.state.open_channels[i]
						const modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == openChannelObj.id)

						if (!modelChannelObj) continue
						variableObj[`${modelChannelObj.variableId}_smartmix${openChannelObj.smartmixGroup}_open`] =
							openChannelObj.status == true ? 'Open' : 'Closed'
					}
				} else if (self.model?.id == 'atdm-0604a') {
					for (let i = 0; i < self.state.open_channels.length; i++) {
						const openChannelObj = self.state.open_channels[i]
						const modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == openChannelObj.id)

						if (!modelChannelObj) continue
						variableObj[`${modelChannelObj.variableId}_open`] = openChannelObj.status == true ? 'Open' : 'Closed'
					}
				}

				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('gopl')) {
				const variableObj: CompanionVariableValues = {}

				for (let i = 0; i < self.state.operator_page.length; i++) {
					const operatorPage = self.state.operator_page[i]
					for (let j = 1; j <= 8; j++) {
						variableObj[`gopl_${i + 1}_${j}`] = operatorPage[`fader_${j}_level`]
					}
				}

				self.setVariableValues(variableObj)
			}

			if (model.variables.includes('gopm')) {
				const variableObj: CompanionVariableValues = {}

				for (let i = 0; i < self.state.operator_page.length; i++) {
					const operatorPage = self.state.operator_page[i]
					for (let j = 1; j <= 8; j++) {
						variableObj[`gopm_${i + 1}_${j}`] = operatorPage[`fader_${j}_mute`] == true ? 'On' : 'Off'
					}
				}

				self.setVariableValues(variableObj)
			}
		}
	} catch (error) {
		self.log('error', `Error checking variables: ${String(error)}`)
		if (error instanceof Error && error.stack) {
			self.log('debug', error.stack)
		}
	}
}
