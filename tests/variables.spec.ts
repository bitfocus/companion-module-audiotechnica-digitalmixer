import { describe, expect, test } from 'vitest'
import { makeInstance } from './helpers.js'
import { processResponse } from '../src/process-response.js'

describe('variables', () => {
	test('operator fader levels and mutes are published', () => {
		const h = makeInstance('atdm-1012')
		h.instance.state.operator_page[0]['fader_1_level'] = 50
		h.instance.state.operator_page[0]['fader_2_level'] = 82
		h.instance.state.operator_page[0]['fader_1_mute'] = true

		h.checkVariables()

		expect(h.variableValues['gopl_1_1']).toBe(50)
		expect(h.variableValues['gopl_1_2']).toBe(82)
		expect(h.variableValues['gopm_1_1']).toBe('On')
		expect(h.variableValues['gopm_1_2']).toBe('Off')
	})

	test('device info, preset names and recorder status are published', () => {
		const h = makeInstance('atdm-1012')
		processResponse(h.instance, 'g_firmware_version 0000 41 NC 01.02.03 ')
		processResponse(h.instance, 'g_deviceid 0000 41 NC 41 ')
		processResponse(h.instance, 'g_name_bank 0000 41 CS 1,"Board Meeting" ')
		processResponse(h.instance, 'MD rec_status_notice 0000 00 NC 1 ')

		h.checkVariables()

		expect(h.variableValues['firmware_version']).toBe('01.02.03')
		expect(h.variableValues['device_id']).toBe('41')
		expect(h.variableValues['preset_name_1']).toBe('Board Meeting')
		expect(h.variableValues['rec_status']).toBe('Recording')
	})

	test('meter level variables are named per monitor point', () => {
		const h = makeInstance('atdm-1012')
		const levels = Array.from({ length: 42 }, () => 30)
		processResponse(h.instance, 'MD level_meter_notice 0000 00 NC ' + levels.join(',') + ' ')

		h.checkVariables()

		expect(h.variableValues['meterlevel_0']).toBe('30')
		expect(h.variableValues['meterlevel_41']).toBe('30')
	})

	test('the output fader group label is populated', () => {
		const h = makeInstance('atdm-1012')
		processResponse(h.instance, 'g_output_channel_settings 0000 41 NC 0,0,"Main",000000,0,0,1 ')

		h.checkVariables()

		// used to be blank: the label was assigned to a differently-cased name
		expect(h.variableValues['output01_fadergroup']).toBe('Group A')
	})
})
