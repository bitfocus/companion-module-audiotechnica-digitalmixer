import type { LogLevel } from '@companion-module/base'
import type { Model } from './models.js'
import type { InputGainLevel, ModuleState } from './state.js'
import { fader_table, input_gain_table_line, input_gain_table_mic } from './constants.js'

export interface ResponseHost {
	state: ModuleState
	model: Model | undefined
	log: (level: LogLevel, message: string) => void
	requestUiUpdate: () => void
}

/**
 * Split a frame on spaces, treating a double quoted run as one token. Channel and preset names are
 * quoted and may contain spaces.
 */
function tokenise(response: string): string[] {
	const tokens: string[] = ['']
	let inQuotes = false

	for (const piece of response.match(/\\?./g) ?? []) {
		if (piece === '"') {
			inQuotes = !inQuotes
		} else if (!inQuotes && piece === ' ') {
			tokens.push('')
		} else {
			tokens[tokens.length - 1] += piece.replace(/\\(.)/, '$1')
		}
	}

	return tokens
}

/**
 * Parse one response or notification frame from the mixer and fold it into the module state.
 */
export function processResponse(self: ResponseHost, response: string): void {
	const args = tokenise(response)

	// A status change notification is prefixed with 'MD' (spec 2.2.6), so everything after it sits one
	// token further along than it does in an Answer.
	const offset = args.length >= 1 && args[0].trim().toUpperCase() === 'MD' ? 1 : 0

	const category = args.length >= offset + 1 ? args[offset].trim().toLowerCase() : 'XXX'
	const params = (args.length >= offset + 5 ? args[offset + 4] : '').split(',')

	const model = self.model

	let inputChannel: string
	let outputChannel: string

	let found: boolean

	switch (category) {
		case 'g_input_channel_settings': {
			inputChannel = params[0].toString()

			let input_source = ''
			if (params[1]) {
				input_source = params[1].toString()
			}

			let input_phantom_power = false
			if (params[2]) {
				input_phantom_power = params[2].toString() == '1' ? true : false
			}

			let input_phase = 'Normal'
			if (params[3]) {
				input_phase = params[3].toString() == '1' ? 'Invert' : 'Normal'
			}

			let input_lowcut = false
			if (params[4]) {
				input_lowcut = params[4].toString() == '1' ? true : false
			}

			let input_aec = false
			if (params[5]) {
				input_aec = params[5].toString() == '1' ? true : false
			}

			let input_smartmix = false
			if (params[6]) {
				input_smartmix = params[6].toString() == '1' ? true : false
			}

			let input_link = ''
			if (params[7]) {
				input_link = params[7].toString() == '1' ? 'Link' : 'Unlink'
			}

			let input_channelname = ''
			if (params[19]) {
				input_channelname = params[19].toString()
			}

			let input_color = ''
			if (params[20]) {
				input_color = params[20].toString()
			}

			let input_virtualmicorientation = ''
			if (params[21]) {
				input_virtualmicorientation = params[21].toString()
			}

			let input_virtualmictilt = ''
			if (params[22]) {
				input_virtualmictilt = params[22].toString()
			}

			let input_virtualmicpattern = ''
			if (params[23]) {
				input_virtualmicpattern = params[23].toString()
			}

			let input_fadergroup = ''
			if (params[25]) {
				input_fadergroup = params[25].toString()
			}

			let input_smartmixgroup = ''
			if (params[26]) {
				input_smartmixgroup = params[26].toString()
			}

			let input_mono = false
			if (params[27]) {
				input_mono = params[27].toString() == '1' ? true : false
			}

			const inputChannelSettingsObj = {
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
				mono: input_mono,
			}

			found = false

			for (let i = 0; i < self.state.input_channel_settings.length; i++) {
				if (self.state.input_channel_settings[i].id == inputChannel) {
					//update in place
					self.state.input_channel_settings[i] = inputChannelSettingsObj
					found = true
					break
				}
			}

			if (!found) {
				//add to array
				self.state.input_channel_settings.push(inputChannelSettingsObj)
			}

			break
		}
		case 'g_subinput_channel_settings': {
			const subinputChannel = params[0].toString()

			let subinput_source = ''
			if (params[1]) {
				subinput_source = params[1].toString()
			}

			const subinputgainlevel_inputgaintablemicObj = input_gain_table_mic.find((ROW) => ROW.id == params[2].toString())
			let subinputgainlevel_mic_gain = ''
			let subinputgainlevel_mic_gain_label = ''

			if (subinputgainlevel_inputgaintablemicObj !== undefined) {
				subinputgainlevel_mic_gain = subinputgainlevel_inputgaintablemicObj.id.toString()
				subinputgainlevel_mic_gain_label = subinputgainlevel_inputgaintablemicObj.label
			}

			let subinput_lowcut = false
			if (params[3]) {
				subinput_lowcut = params[3].toString() == '1' ? true : false
			}

			let subinput_link = ''
			if (params[4]) {
				subinput_link = params[4].toString() == '1' ? 'Link' : 'Unlink'
			}

			let subinput_channelname = ''
			if (params[5]) {
				subinput_channelname = params[5].toString()
			}

			let subinput_color = ''
			if (params[6]) {
				subinput_color = params[6].toString()
			}

			let subinput_fadergroup = ''
			if (params[7]) {
				subinput_fadergroup = params[7].toString()
			}

			const subinputChannelSettingsObj = {
				id: subinputChannel,
				source: subinput_source,
				input_gain: subinputgainlevel_mic_gain,
				input_gain_label: subinputgainlevel_mic_gain_label,
				lowCut: subinput_lowcut,
				link: subinput_link,
				channelName: subinput_channelname,
				color: subinput_color,
				faderGroup: subinput_fadergroup,
			}

			found = false

			for (let i = 0; i < self.state.sub_input_channel_settings.length; i++) {
				if (self.state.sub_input_channel_settings[i].id == subinputChannel) {
					//update in place
					self.state.sub_input_channel_settings[i] = subinputChannelSettingsObj
					found = true
					break
				}
			}

			if (!found) {
				//add to array
				self.state.sub_input_channel_settings.push(subinputChannelSettingsObj)
			}

			break
		}
		case 'g_input_gain_level': {
			inputChannel = params[0].toString()
			let inputgainlevel_mic_gain = ''
			let inputgainlevel_mic_gain_label = ''

			if (params[1]) {
				const inputgainlevel_inputgaintablemicObj = input_gain_table_mic.find((ROW) => ROW.id == params[1].toString())
				inputgainlevel_mic_gain = params[1]

				if (inputgainlevel_inputgaintablemicObj !== undefined) {
					inputgainlevel_mic_gain_label = inputgainlevel_inputgaintablemicObj.label
				}
			}

			let inputgainlevel_line_gain = ''
			let inputgainlevel_line_gain_label = ''

			if (params[2]) {
				const inputgainlevel_inputgaintablelineObj = input_gain_table_line.find((ROW) => ROW.id == params[2].toString())
				inputgainlevel_line_gain = params[2]

				if (inputgainlevel_inputgaintablelineObj !== undefined) {
					inputgainlevel_line_gain_label = inputgainlevel_inputgaintablelineObj.label
				}
			}

			let inputgainlevel_level = ''
			let inputgainlevel_level_label = ''

			if (params[3]) {
				const inputgainlevel_levelfadertableObj = fader_table.find((ROW) => ROW.id == params[3].toString())
				inputgainlevel_level = params[3]

				if (inputgainlevel_levelfadertableObj !== undefined) {
					inputgainlevel_level_label = inputgainlevel_levelfadertableObj.label
				}
			}

			let inputgainlevel_max_vol_enabled = false

			if (params[4]) {
				inputgainlevel_max_vol_enabled = params[4].toString() == '1' ? true : false
			}

			let inputgainlevel_max_vol = ''
			let inputgainlevel_max_vol_label = ''

			if (params[5]) {
				const inputgainlevel_maxvolfadertableObj = fader_table.find((ROW) => ROW.id == params[5].toString())
				inputgainlevel_max_vol = params[5]

				if (inputgainlevel_maxvolfadertableObj !== undefined) {
					inputgainlevel_max_vol_label = inputgainlevel_maxvolfadertableObj.label
				}
			}

			let inputgainlevel_mute = false

			if (params[6]) {
				inputgainlevel_mute = params[6].toString() == '1' ? true : false
			}

			const inputGainLevelObj: InputGainLevel = {
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
				virtual_mic_gain: 0,
			}

			if (model?.id == 'atdm-1012') {
				inputGainLevelObj.min_vol_enabled = params[7].toString() == '1' ? true : false

				let inputgainlevel_min_vol = '0'
				let inputgainlevel_min_vol_label = '-∞'

				if (params[8]) {
					const inputgainlevel_minvolfadertableObj = fader_table.find((ROW) => ROW.id == params[8].toString())
					inputgainlevel_min_vol = params[8]

					if (inputgainlevel_minvolfadertableObj !== undefined) {
						inputgainlevel_min_vol_label = inputgainlevel_minvolfadertableObj.label
					}
				}

				inputGainLevelObj.min_vol = inputgainlevel_min_vol
				inputGainLevelObj.min_vol_label = inputgainlevel_min_vol_label
			}

			found = false

			for (let i = 0; i < self.state.input_gain_levels.length; i++) {
				if (self.state.input_gain_levels[i].id == inputChannel) {
					//update in place
					self.state.input_gain_levels[i] = inputGainLevelObj
					found = true
					break
				}
			}

			if (!found) {
				//add to array
				self.state.input_gain_levels.push(inputGainLevelObj)
			}
			break
		}
		case 'input_gain_level_meter_notice':
		case 'input_gain_level_notice': {
			inputChannel = params[0].toString()

			const notice_inputGainLevelObj = {
				id: inputChannel,
				mic_gain: params[1],
				mic_gain_label: input_gain_table_mic.find((ROW) => ROW.id == params[1].toString())?.label ?? '',
				line_gain: params[2],
				line_gain_label: input_gain_table_line.find((ROW) => ROW.id == params[2].toString())?.label ?? '',
				level: params[3],
				level_label: fader_table.find((ROW) => ROW.id == params[3].toString())?.label ?? '',
				mute: params[4].toString() == '1' ? true : false,
			}

			found = false

			for (let i = 0; i < self.state.input_gain_levels.length; i++) {
				if (self.state.input_gain_levels[i].id == inputChannel) {
					//update in place
					self.state.input_gain_levels[i].mic_gain = notice_inputGainLevelObj.mic_gain
					self.state.input_gain_levels[i].mic_gain_label = notice_inputGainLevelObj.mic_gain_label
					self.state.input_gain_levels[i].line_gain = notice_inputGainLevelObj.line_gain
					self.state.input_gain_levels[i].line_gain_label = notice_inputGainLevelObj.line_gain_label
					self.state.input_gain_levels[i].level = notice_inputGainLevelObj.level
					self.state.input_gain_levels[i].level_label = notice_inputGainLevelObj.level_label
					self.state.input_gain_levels[i].mute = notice_inputGainLevelObj.mute
					found = true
					break
				}
			}

			if (!found) {
				//add to array
				self.state.input_gain_levels.push(notice_inputGainLevelObj)
			}
			break
		}
		case 'g_output_channel_settings': {
			outputChannel = params[0].toString()
			const outputChannelSettingsObj = {
				id: outputChannel,
				unity: params[1].toString(),
				channelName: params[2].toString(),
				color: params[3] || '',
				link: params[4] == '1' ? 'Link' : 'Unlink',
				source: params[5] || '',
				faderGroup: params[6] || '',
			}

			found = false

			for (let i = 0; i < self.state.output_channel_settings.length; i++) {
				if (self.state.output_channel_settings[i].id == outputChannel) {
					//update in place
					self.state.output_channel_settings[i] = outputChannelSettingsObj
					found = true
					break
				}
			}

			if (!found) {
				//add to array
				self.state.output_channel_settings.push(outputChannelSettingsObj)
			}
			break
		}
		case 'g_output_level': {
			outputChannel = params[0].toString()

			let outputlevel_level = ''
			let outputlevel_level_label = ''

			if (params[1]) {
				const outputlevel_levelfadertableObj = fader_table.find((ROW) => ROW.id == params[1].toString())
				outputlevel_level = params[1]

				if (outputlevel_levelfadertableObj !== undefined) {
					outputlevel_level_label = outputlevel_levelfadertableObj.label
				}
			}

			let max_vol_enabled = false
			if (params[2]) {
				max_vol_enabled = params[2].toString() == '1' ? true : false
			}

			let outputlevel_maxvol = ''
			let outputlevel_maxvol_label = ''

			if (params[3]) {
				const outputlevel_maxvolfadertableObj = fader_table.find((ROW) => ROW.id == params[3].toString())
				outputlevel_maxvol = params[3]

				if (outputlevel_maxvolfadertableObj !== undefined) {
					outputlevel_maxvol_label = outputlevel_maxvolfadertableObj.label
				}
			}

			let min_vol_enabled = false
			if (params[4]) {
				min_vol_enabled = params[4].toString() == '1' ? true : false
			}

			let outputlevel_minvol = ''
			let outputlevel_minvol_label = ''

			if (params[5]) {
				const outputlevel_minvolfadertableObj = fader_table.find((ROW) => ROW.id == params[5].toString())
				outputlevel_minvol = params[5]

				if (outputlevel_minvolfadertableObj !== undefined) {
					outputlevel_minvol_label = outputlevel_minvolfadertableObj.label
				}
			}

			const outputLevelObj = {
				id: outputChannel,
				level: outputlevel_level,
				level_label: outputlevel_level_label,
				max_vol_enabled: max_vol_enabled,
				max_vol: outputlevel_maxvol,
				max_vol_label: outputlevel_maxvol_label,
				min_vol_enabled: min_vol_enabled,
				min_vol: outputlevel_minvol,
				min_vol_label: outputlevel_minvol_label,
			}

			found = false

			for (let i = 0; i < self.state.output_levels.length; i++) {
				if (self.state.output_levels[i].id == outputChannel) {
					//update in place
					self.state.output_levels[i] = outputLevelObj
					found = true
					break
				}
			}

			if (!found) {
				//add to array
				self.state.output_levels.push(outputLevelObj)
			}
			break
		}
		case 'output_level_notice': {
			outputChannel = params[0].toString()

			let notice_outputLevel = ''
			let notice_outputLevelLabel = ''

			if (params[1] !== undefined) {
				const notice_outputLevelFaderObj = fader_table.find((ROW) => ROW.id == params[1].toString())
				notice_outputLevel = params[1]

				if (notice_outputLevelFaderObj !== undefined) {
					notice_outputLevelLabel = notice_outputLevelFaderObj.label
				}
			}

			found = false

			for (let i = 0; i < self.state.output_levels.length; i++) {
				if (self.state.output_levels[i].id == outputChannel) {
					//update in place, the notice only carries the level
					self.state.output_levels[i].level = notice_outputLevel
					self.state.output_levels[i].level_label = notice_outputLevelLabel
					found = true
					break
				}
			}

			if (!found) {
				//add to array
				self.state.output_levels.push({
					id: outputChannel,
					level: notice_outputLevel,
					level_label: notice_outputLevelLabel,
				})
			}
			break
		}
		case 'output_mute_notice':
		case 'g_output_mute': {
			outputChannel = params[0].toString()
			const outputMuteObj = {
				id: outputChannel,
				mute: params[1].toString() == '1' ? true : false,
			}

			found = false

			for (let i = 0; i < self.state.output_mutes.length; i++) {
				if (self.state.output_mutes[i].id == outputChannel) {
					//update in place
					self.state.output_mutes[i] = outputMuteObj
					found = true
					break
				}
			}

			if (!found) {
				//add to array
				self.state.output_mutes.push(outputMuteObj)
			}
			break
		}
		case 'g_preset_number':
			self.state.preset_number = params[0].toString()
			break
		case 'recall_preset_notice':
			self.state.preset_number = params[0].toString()
			break
		case 'g_partial_preset_number':
			self.state.partial_preset_number = params[0].toString()
			break
		case 'recall_partial_preset_notice':
			self.state.partial_preset_number = params[0].toString()
			break
		case 'g_level_meter': {
			const monitorPoint = params[0].toString()
			const meterLevelObj = {
				monitorPoint: monitorPoint,
				level: params[1].toString(),
			}

			found = false

			for (let i = 0; i < self.state.meter_levels.length; i++) {
				if (self.state.meter_levels[i].monitorPoint == monitorPoint) {
					//update in place
					self.state.meter_levels[i] = meterLevelObj
					found = true
					break
				}
			}

			if (!found) {
				//add to array
				self.state.meter_levels.push(meterLevelObj)
			}
			break
		}
		case 'level_meter_notice':
			// Every monitor point is reported at once, in the order given by LEVEL_METER_POINTS.
			for (let i = 0; i < params.length; i++) {
				const notice_monitorPoint = i.toString()
				const notice_meterLevel = params[i].toString()

				const existingMeter = self.state.meter_levels.find((METER) => METER.monitorPoint == notice_monitorPoint)

				if (existingMeter) {
					existingMeter.level = notice_meterLevel
				} else {
					self.state.meter_levels.push({ monitorPoint: notice_monitorPoint, level: notice_meterLevel })
				}
			}

			break
		case 'open_channel_notice':
			if (model?.id == 'atdm-1012') {
				inputChannel = params[0].toString()

				const openChannelObj = {
					id: inputChannel,
					smartmixGroup: params[1].toString(),
					status: params[2].toString() == '1' ? true : false,
				}

				found = false

				for (let i = 0; i < self.state.open_channels.length; i++) {
					if (self.state.open_channels[i].id == inputChannel) {
						if (self.state.open_channels[i].smartmixGroup == openChannelObj.smartmixGroup) {
							//update in place
							self.state.open_channels[i] = openChannelObj
							found = true
							break
						}
					}
				}

				if (!found) {
					//add to array
					self.state.open_channels.push(openChannelObj)
				}
			} else if (self.model?.id == 'atdm-0604a') {
				self.state.open_channels = [] //reset the array

				self.state.open_channels.push({ id: '0', status: params[0].toString() == '1' ? true : false }) //input 1
				self.state.open_channels.push({ id: '1', status: params[1].toString() == '1' ? true : false }) //input 2
				self.state.open_channels.push({ id: '2', status: params[2].toString() == '1' ? true : false }) //input 3
				self.state.open_channels.push({ id: '3', status: params[3].toString() == '1' ? true : false }) //input 4
				self.state.open_channels.push({ id: '4', status: params[4].toString() == '1' ? true : false }) //input 5
				self.state.open_channels.push({ id: '5', status: params[5].toString() == '1' ? true : false }) //input 6
			}

			break

		case 'gopl':
			self.state.operator_page[parseInt(params[0].toString()) - 1][`fader_${params[1].toString()}_level`] = parseInt(
				params[2].toString(),
			)
			break

		case 'gopm':
			self.state.operator_page[parseInt(params[0].toString()) - 1][`fader_${params[1].toString()}_mute`] =
				params[2].toString() == '1' ? true : false
			break

		case 'g_firmware_version':
			self.state.firmware_version = params[0].toString()
			break

		case 'g_deviceid':
			self.state.device_id = params[0].toString()
			break

		case 'g_name_bank':
			// Bank names arrive as a divided message, one bank per frame, so each is handled on its own.
			if (params[0] !== undefined) {
				const bankNumber = params[0].toString()
				const bankName = params[1] !== undefined ? params[1].toString() : ''

				const existingBank = self.state.preset_names.find((BANK) => BANK.id == bankNumber)

				if (existingBank) {
					existingBank.name = bankName
				} else {
					self.state.preset_names.push({ id: bankNumber, name: bankName })
				}
			}
			break

		case 'aec_calibration_notice':
			self.state.aec_calibration_result = params[0].toString()
			break

		case 'arraymic_mute_notice':
		case 'g_arraymic_mute':
			// The ATDM-1012 reports which virtual mic changed, the ATDM-0604 has only one.
			self.state.arraymic_mute = params[0].toString() == '1' ? true : false

			if (params[1] !== undefined) {
				const virtualMic = params[1].toString()
				const existingArrayMic = self.state.arraymic_mutes.find((MIC) => MIC.id == virtualMic)

				if (existingArrayMic) {
					existingArrayMic.mute = self.state.arraymic_mute
				} else {
					self.state.arraymic_mutes.push({ id: virtualMic, mute: self.state.arraymic_mute })
				}
			}
			break

		case 'operator_channel_notice': {
			// ATDM-1012: fader, level, mute, page. ATDM-0604: fader, level, mute on its single page.
			const noticeFader = parseInt(params[0].toString())
			const noticePage = params[3] !== undefined ? parseInt(params[3].toString()) : 1

			if (self.state.operator_page[noticePage - 1] && noticeFader >= 1) {
				if (params[1] !== undefined && params[1] !== '') {
					self.state.operator_page[noticePage - 1][`fader_${noticeFader}_level`] = parseInt(params[1].toString())
				}

				if (params[2] !== undefined && params[2] !== '') {
					self.state.operator_page[noticePage - 1][`fader_${noticeFader}_mute`] =
						params[2].toString() == '1' ? true : false
				}
			}
			break
		}

		case 'cancut_notice':
			// One value per input channel: on when both Priority and Can Cut are enabled.
			self.state.cancut = []

			for (let i = 0; i < params.length; i++) {
				self.state.cancut.push({
					id: i.toString(),
					status: params[i].toString() == '1' ? true : false,
				})
			}
			break

		case 'rec_status_notice':
			self.state.rec_status = params[0].toString()
			break

		case 'fbs_notice':
			// Sent when howling is detected. Only the channel and whether FBS is engaged are useful
			// as feedback; the per-band filter values are not surfaced.
			if (params[0] !== undefined) {
				const fbsChannel = params[0].toString()
				const fbsObj = {
					id: fbsChannel,
					processing_type: params[1] !== undefined ? params[1].toString() : '',
					enabled: params[2] !== undefined && params[2].toString() == '1',
				}

				const existingFbs = self.state.fbs.findIndex((CHANNEL) => CHANNEL.id == fbsChannel)

				if (existingFbs > -1) {
					self.state.fbs[existingFbs] = fbsObj
				} else {
					self.state.fbs.push(fbsObj)
				}
			}
			break

		default:
			self.log('debug', 'Unhandled response from device: ' + response)
			break
	}

	self.requestUiUpdate()
}
