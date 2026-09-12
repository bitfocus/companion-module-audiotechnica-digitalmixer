import { beforeEach, describe, expect, test } from 'vitest'
import { processResponse, type ResponseHost } from '../src/process-response.js'
import { NoticeListener } from '../src/notices.js'
import { createState } from '../src/state.js'
import { getModel } from '../src/models.js'

function makeHost(model = 'atdm-1012'): ResponseHost & { logs: { level: string; message: string }[] } {
	const logs: { level: string; message: string }[] = []
	return {
		state: createState(getModel(model)),
		model: getModel(model),
		log: (level, message) => logs.push({ level, message }),
		requestUiUpdate: () => {},
		logs,
	}
}

// Wire formats below are the worked examples from the protocol specifications: notifications are
// prefixed with 'MD' as a separate token, so the command sits one field later than in an Answer.
describe('notification parsing', () => {
	let host: ReturnType<typeof makeHost>
	beforeEach(() => {
		host = makeHost()
	})

	test('the MD prefix is not mistaken for the command', () => {
		processResponse(host, 'MD output_mute_notice 0000 00 NC 9,1 ')
		expect(host.state.output_mutes).toContainEqual({ id: '9', mute: true })
	})

	test('an Answer with no MD prefix still parses', () => {
		processResponse(host, 'g_output_mute 0000 41 NC 9,1 ')
		expect(host.state.output_mutes).toContainEqual({ id: '9', mute: true })
	})

	test('output level notification updates the level in place', () => {
		processResponse(host, 'g_output_level 0000 41 NC 9,111,0,511,0,0 ')
		processResponse(host, 'MD output_level_notice 0000 00 NC 9,511 ')

		const output = host.state.output_levels.find((o) => o.id === '9')
		expect(output?.level).toBe('511')
		expect(output?.level_label).toBe('10.0')
		expect(host.state.output_levels.filter((o) => o.id === '9')).toHaveLength(1)
	})

	test('input gain level notification is accepted under both names the spec uses', () => {
		processResponse(host, 'MD input_gain_level_notice 0000 00 NC 0,40,40,511,1 ')
		expect(host.state.input_gain_levels.find((i) => i.id === '0')?.mute).toBe(true)

		processResponse(host, 'MD input_gain_level_meter_notice 0000 00 NC 0,40,40,511,0 ')
		expect(host.state.input_gain_levels.find((i) => i.id === '0')?.mute).toBe(false)
	})

	test('operator page notification targets the page it names', () => {
		processResponse(host, 'MD operator_channel_notice 0000 00 NC 8,100,1,8 ')

		expect(host.state.operator_page[7]['fader_8_level']).toBe(100)
		expect(host.state.operator_page[7]['fader_8_mute']).toBe(true)
		expect(host.state.operator_page[0]['fader_8_mute']).toBe(false)
	})

	test('an operator page notification without a page lands on page 1', () => {
		processResponse(host, 'MD operator_channel_notice 0000 00 NC 3,50,1 ')

		expect(host.state.operator_page[0]['fader_3_level']).toBe(50)
		expect(host.state.operator_page[0]['fader_3_mute']).toBe(true)
	})

	test('open channel notification records the smart mix group', () => {
		processResponse(host, 'MD open_channel_notice 0000 00 NC 9,4,1 ')
		expect(host.state.open_channels).toContainEqual({ id: '9', smartmixGroup: '4', status: true })
	})

	test('array mic mute notification records the virtual mic', () => {
		processResponse(host, 'MD arraymic_mute_notice 0000 00 NC 1,1 ')

		expect(host.state.arraymic_mute).toBe(true)
		expect(host.state.arraymic_mutes).toContainEqual({ id: '1', mute: true })
	})

	test('recording status notification is recorded', () => {
		processResponse(host, 'MD rec_status_notice 0000 00 NC 1 ')
		expect(host.state.rec_status).toBe('1')
	})

	test('preset and partial preset notifications update the current numbers', () => {
		processResponse(host, 'MD recall_preset_notice 0000 00 NC 3 ')
		processResponse(host, 'MD recall_partial_preset_notice 0000 00 NC 12 ')

		expect(host.state.preset_number).toBe('3')
		expect(host.state.partial_preset_number).toBe('12')
	})

	test('can cut notification records every input', () => {
		processResponse(host, 'MD cancut_notice 0000 00 NC 0,1,0,0,0,0,0,0,0,0 ')

		expect(host.state.cancut).toHaveLength(10)
		expect(host.state.cancut[1]).toEqual({ id: '1', status: true })
	})

	test('AEC calibration result notification is recorded', () => {
		processResponse(host, 'MD aec_calibration_notice 0000 00 NC 3 ')
		expect(host.state.aec_calibration_result).toBe('3')
	})

	test('level meter notification fills every monitor point in order', () => {
		const levels = Array.from({ length: 42 }, (_, i) => i)
		processResponse(host, 'MD level_meter_notice 0000 00 NC ' + levels.join(',') + ' ')

		expect(host.state.meter_levels).toHaveLength(42)
		expect(host.state.meter_levels[0]).toEqual({ monitorPoint: '0', level: '0' })
		expect(host.state.meter_levels[41]).toEqual({ monitorPoint: '41', level: '41' })
	})

	test('fbs notification records the channel state', () => {
		processResponse(host, 'MD fbs_notice 0000 00 NC 0,0,1,0,0,0,0 ')
		expect(host.state.fbs).toContainEqual({ id: '0', processing_type: '0', enabled: true })
	})

	test('device info and preset bank names parse, including the divided message', () => {
		processResponse(host, 'g_firmware_version 0000 41 NC 01.02.03 ')
		processResponse(host, 'g_deviceid 0000 41 NC 41 ')
		processResponse(host, 'g_name_bank 0000 41 CS 1,"Board Meeting" ')
		processResponse(host, 'g_name_bank 0000 41 CE 2,"Worship" ')

		expect(host.state.firmware_version).toBe('01.02.03')
		expect(host.state.device_id).toBe('41')
		expect(host.state.preset_names).toContainEqual({ id: '1', name: 'Board Meeting' })
		expect(host.state.preset_names).toContainEqual({ id: '2', name: 'Worship' })
	})
})

describe('notification datagram handling', () => {
	function makeListener(host: ResponseHost) {
		const logs: { level: string; message: string }[] = []
		const listener = new NoticeListener({
			address: '225.0.0.100',
			port: 17000,
			interface: '',
			host: '',
			processFrame: (frame) => processResponse(host, frame),
			log: (level, message) => logs.push({ level, message }),
		})
		return { listener, logs }
	}

	test('several notifications in one datagram are all applied', () => {
		const host = makeHost()
		const { listener } = makeListener(host)

		listener.handleDatagram('MD output_mute_notice 0000 00 NC 0,1 \rMD output_mute_notice 0000 00 NC 1,1 \r')

		expect(host.state.output_mutes).toContainEqual({ id: '0', mute: true })
		expect(host.state.output_mutes).toContainEqual({ id: '1', mute: true })
	})

	test('a notification that fails to parse is logged and does not stop the rest', () => {
		const host = makeHost()
		const { listener, logs } = makeListener(host)

		listener.handleDatagram('MD input_gain_level_notice 0000 00 NC 0 \rMD output_mute_notice 0000 00 NC 2,1 \r')

		expect(logs.some((l) => l.level === 'error')).toBe(true)
		expect(host.state.output_mutes).toContainEqual({ id: '2', mute: true })
	})
})
