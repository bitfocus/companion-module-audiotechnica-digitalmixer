import type { Model } from './models.js'

export interface InputChannelSettings {
	id: string
	source: string
	phantomPower: boolean
	phase: string
	lowCut: boolean
	aec: boolean
	smartMix: boolean
	link: string
	channelName: string
	color: string
	virtualMicOrientation: string
	virtualMicTilt: string
	virtualMicPattern: string
	faderGroup: string
	smartMixGroup: string
	mono: boolean
}

export interface SubInputChannelSettings {
	id: string
	source: string
	input_gain: string
	input_gain_label: string
	lowCut: boolean
	link: string
	channelName: string
	color: string
	faderGroup: string
}

export interface InputGainLevel {
	id: string
	mic_gain?: string
	mic_gain_label?: string
	line_gain?: string
	line_gain_label?: string
	level?: string
	level_label?: string
	mute?: boolean
	max_vol_enabled?: boolean
	max_vol?: string
	max_vol_label?: string
	min_vol_enabled?: boolean
	min_vol?: string
	min_vol_label?: string
	virtual_mic_gain?: number
}

export interface OutputChannelSettings {
	id: string
	unity: string
	channelName: string
	color: string
	link: string
	source: string
	faderGroup: string
}

export interface OutputLevel {
	id: string
	level?: string
	level_label?: string
	max_vol_enabled?: boolean
	max_vol?: string
	max_vol_label?: string
	min_vol_enabled?: boolean
	min_vol?: string
	min_vol_label?: string
}

export interface OutputMute {
	id: string
	mute: boolean
}

export interface MeterLevel {
	monitorPoint: string
	level: string
}

export interface OpenChannel {
	id: string
	smartmixGroup?: string
	status: boolean
}

export interface CanCutChannel {
	id: string
	status: boolean
}

export interface ArrayMicMute {
	id: string
	mute: boolean
}

export interface FbsChannel {
	id: string
	processing_type: string
	enabled: boolean
}

export interface DuckerChannel {
	id: string
	enabled: boolean
	trigger: string
}

export interface PresetName {
	id: string
	name: string
}

/** One operator page, keyed `fader_<n>_level` and `fader_<n>_mute`. */
export type OperatorPage = Record<string, number | boolean>

export interface ModuleState {
	operator_page: OperatorPage[]
	input_channel_settings: InputChannelSettings[]
	sub_input_channel_settings: SubInputChannelSettings[]
	input_gain_levels: InputGainLevel[]
	output_channel_settings: OutputChannelSettings[]
	output_levels: OutputLevel[]
	output_mutes: OutputMute[]
	meter_levels: MeterLevel[]
	open_channels: OpenChannel[]

	// Populated from UDP notifications rather than polling - there is no get command for these.
	cancut: CanCutChannel[]
	arraymic_mutes: ArrayMicMute[]
	fbs: FbsChannel[]
	ducker: DuckerChannel[]
	preset_names: PresetName[]

	arraymic_mute: boolean
	rec_status: string
	preset_number: string
	partial_preset_number: string
	firmware_version: string
	device_id: string
	aec_calibration_result: string
}

export function createState(_model: Model | undefined): ModuleState {
	const operator_page: OperatorPage[] = []

	for (let i = 1; i <= 8; i++) {
		const page: OperatorPage = {}

		for (let j = 1; j <= 8; j++) {
			page[`fader_${j}_level`] = 0
			page[`fader_${j}_mute`] = false
		}

		operator_page.push(page)
	}

	return {
		operator_page,
		input_channel_settings: [],
		sub_input_channel_settings: [],
		input_gain_levels: [],
		output_channel_settings: [],
		output_levels: [],
		output_mutes: [],
		meter_levels: [],
		open_channels: [],
		cancut: [],
		arraymic_mutes: [],
		fbs: [],
		ducker: [],
		preset_names: [],
		arraymic_mute: false,
		rec_status: '0',
		preset_number: '',
		partial_preset_number: '',
		firmware_version: '',
		device_id: '',
		aec_calibration_result: '',
	}
}
