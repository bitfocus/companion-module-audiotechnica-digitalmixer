const { Regex } = require('@companion-module/base')

module.exports = {
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will connect to an Audio-Technica Digital Mixer, such as the ATDM-0604, ATDM-0604a, or ATDM-1012',
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
				type: 'dropdown',
				label: 'Model',
				id: 'model',
				default: 'atdm-0604a',
				choices: this.MODELS,
				width: 12
			},
			{
				type: 'number',
				id: 'poll_interval',
				label: 'Polling Interval (ms), set to 0 to disable polling',
				min: 50,
				max: 30000,
				default: 1000,
				width: 3,
			}
		]
	}
}