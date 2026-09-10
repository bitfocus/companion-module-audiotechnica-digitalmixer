import { Regex, type SomeCompanionConfigField } from '@companion-module/base'
import { MODELS, type ModelId } from './models.js'

export type ModuleConfig = {
	host: string
	port: number
	model: ModelId

	polling: boolean
	poll_interval: number
	pipeline_depth: number

	notices: boolean
	multicast_address: string
	multicast_port: number
	multicast_interface: string
	level_meters: boolean
	level_meter_interval: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value:
				'This module will connect to an Audio-Technica Digital Mixer, such as the ATDM-0604, ATDM-0604a, or ATDM-1012',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'IP Address / Hostname',
			width: 6,
			default: '192.168.0.1',
			regex: Regex.IP.slice(0, Regex.IP.length - 1) + '|' + Regex.HOSTNAME.slice(1, Regex.HOSTNAME.length),
		},
		{
			type: 'number',
			id: 'port',
			label: 'Port',
			min: 1,
			max: 65535,
			default: 17300,
			width: 3,
		},
		{
			type: 'dropdown',
			label: 'Model',
			id: 'model',
			default: 'atdm-0604a',
			choices: MODELS.map((model) => ({ id: model.id, label: model.label })),
			width: 12,
		},
		{
			type: 'number',
			id: 'pipeline_depth',
			label: 'Commands In Flight',
			tooltip:
				'How many commands may be outstanding at once. The mixer processes commands asynchronously, so ' +
				'sending several without waiting makes polling far quicker. Lower this to 1 if the mixer reports Busy errors.',
			min: 1,
			max: 32,
			default: 8,
			width: 3,
		},
		{
			type: 'checkbox',
			id: 'polling',
			label: 'Enable Polling',
			default: true,
			width: 3,
			disableAutoExpression: true,
		},
		{
			type: 'number',
			id: 'poll_interval',
			label: 'Polling Interval (ms)',
			min: 500,
			max: 30000,
			default: 1000,
			width: 3,
			isVisibleExpression: '$(options:polling)',
		},
		{
			type: 'static-text',
			id: 'poll_info',
			width: 6,
			label: '',
			value:
				'Polling keeps variables and feedbacks in sync with the mixer. The ATDM-1012 requests around 200 values ' +
				'per poll, so short intervals generate a lot of traffic. A poll is skipped if the previous one has not ' +
				'finished, and button actions are always sent ahead of polling traffic. Disable polling if you only send ' +
				'commands and do not use feedbacks.',
			isVisibleExpression: '$(options:polling)',
		},
		{
			type: 'static-text',
			id: 'notice_header',
			width: 12,
			label: 'Notifications',
			value:
				'The mixer can push changes made at its front panel, in Web Remote or by another controller over UDP ' +
				'multicast, which keeps feedbacks current between polls. This requires "IP Control Settings > ' +
				'Notification" to be turned On in the mixer\'s network settings - it is Off by default. Level meters ' +
				'additionally require "Audio Level Notification".',
		},
		{
			type: 'checkbox',
			id: 'notices',
			label: 'Listen for Notifications',
			default: false,
			width: 3,
			disableAutoExpression: true,
		},
		{
			type: 'textinput',
			id: 'multicast_address',
			label: 'Multicast Address',
			default: '225.0.0.100',
			width: 3,
			regex: Regex.IP,
			isVisibleExpression: '$(options:notices)',
		},
		{
			type: 'number',
			id: 'multicast_port',
			label: 'Multicast Port',
			min: 1,
			max: 65535,
			default: 17000,
			width: 3,
			isVisibleExpression: '$(options:notices)',
		},
		{
			type: 'textinput',
			id: 'multicast_interface',
			label: 'Network Interface (optional)',
			tooltip:
				'IP address of the network interface to receive notifications on. Leave blank to let the operating ' +
				'system choose, which is usually only wrong on a machine with several networks.',
			default: '',
			width: 3,
			isVisibleExpression: '$(options:notices)',
		},
		{
			type: 'checkbox',
			id: 'level_meters',
			label: 'Receive Level Meters',
			tooltip: 'Level meters are sent very frequently. Only enable this if you use the meter variables.',
			default: false,
			width: 3,
			disableAutoExpression: true,
			isVisibleExpression: '$(options:notices)',
		},
		{
			type: 'number',
			id: 'level_meter_interval',
			label: 'Level Meter Interval (ms)',
			min: 100,
			max: 10000,
			default: 500,
			width: 3,
			isVisibleExpression: '$(options:notices) && $(options:level_meters)',
		},
	]
}
