import { describe, expect, test } from 'vitest'
import { makeInstance } from './helpers.js'

// Every expectation is the parameter layout given in the protocol specification for that command.
describe('system and preset actions', () => {
	test('identify takes no parameters', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('identify')
		expect(h.sent).toContainEqual(['identify', 'S', ''])
	})

	test('preset save uses REGIP on the ATDM-1012 and save_preset elsewhere', () => {
		const a = makeInstance('atdm-1012')
		a.fireAction('save_preset', { preset: 8 })
		expect(a.sent).toContainEqual(['REGIP', 'S', '8'])

		const b = makeInstance('atdm-0604a')
		b.fireAction('save_preset', { preset: 6 })
		expect(b.sent).toContainEqual(['save_preset', 'S', '6'])
	})

	test('boot up preset accepts none', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('bootup_preset', { preset: 0 })
		expect(h.sent).toContainEqual(['s_bootup_preset', 'S', '0'])
	})

	// Preset recall, the LED dimmer and the error display are s_front_panel. They were sent to
	// s_front_panel_limit, which is the unrelated per channel restriction below, so the mixer rejected
	// them and the front panel never changed.
	test('front panel settings send three flags to s_front_panel', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('front_panel', { recall_preset: true, led_dimmer: true, error_notice: false })
		expect(h.sent).toContainEqual(['s_front_panel', 'S', '1,1,0'])
	})

	test('the front panel channel restriction sends function, target, channel and enable', () => {
		const h = makeInstance('atdm-1012')

		// the worked example from specification 4.146
		h.fireAction('front_panel_limit', { function: '1', target: '1', output: '9', enable: true })
		expect(h.sent).toContainEqual(['s_front_panel_limit', 'S', '1,1,9,1'])

		h.fireAction('front_panel_limit', { function: '0', target: '0', input: '11', enable: false })
		expect(h.sent).toContainEqual(['s_front_panel_limit', 'S', '0,0,11,0'])
	})

	test('the front panel channel restriction does not offer sub inputs', () => {
		const options = makeInstance('atdm-1012').actions['front_panel_limit'].options
		const ids = options.find((o: any) => o.id === 'input').choices.map((c: any) => c.id)

		expect(ids).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'])
	})

	test('operator mute carries the page on the ATDM-1012 only', () => {
		const a = makeInstance('atdm-1012')
		a.fireAction('operator_mute', { page: 8, fader: 8, mute: true })
		expect(a.sent).toContainEqual(['s_operator_mute', 'S', '8,1,8'])

		const b = makeInstance('atdm-0604a')
		b.fireAction('operator_mute', { fader: 1, mute: true })
		expect(b.sent).toContainEqual(['s_operator_mute', 'S', '1,1'])
	})

	test('the operator page selector only exists where there is more than one page', () => {
		expect(makeInstance('atdm-1012').actions['operator_mute'].options.map((o: any) => o.id)).toEqual([
			'page',
			'fader',
			'mute',
		])
		expect(makeInstance('atdm-0604a').actions['operator_mute'].options.map((o: any) => o.id)).toEqual(['fader', 'mute'])
	})

	test('smart mix mode and open mic count', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('smartmix_mode', { group: 4, mode: '2' })
		expect(h.sent).toContainEqual(['SSMM', 'S', '4,2'])

		h.fireAction('open_mic_limit', { group: 4, nom: 10 })
		expect(h.sent).toContainEqual(['NOOM', 'S', '4,10'])
	})

	test('usb out sends both bus selections and a level', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('usb_out', { usb1: '12', usb2: '12', level: '411' })
		expect(h.sent).toContainEqual(['s_usb_out', 'S', '12,12,411'])
	})

	test('the ducker sends all four channel pairs, keeping the ones not being changed', () => {
		const h = makeInstance('atdm-1012')
		h.instance.state.ducker = [
			{ id: '0', enabled: false, trigger: '1' },
			{ id: '1', enabled: true, trigger: '2' },
			{ id: '2', enabled: false, trigger: '3' },
			{ id: '3', enabled: true, trigger: '4' },
		]

		h.fireAction('ducker', { channel: '0', enable: true, trigger: '4' })

		expect(h.sent).toContainEqual(['s_ducker_general', 'S', '1,4,1,2,0,3,1,4'])
	})

	test('the oscillator sends one assign flag per output channel', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('oscillator', { enable: true, source: '1', frequency: '2', level: '121', assign: ['0', '9'] })

		const call = h.sent.find((c) => c[0] === 's_oscillator')
		expect(call?.[2].split(',')).toHaveLength(14)
		expect(call?.[2]).toBe('1,1,2,121,1,0,0,0,0,0,0,0,0,1')
	})

	test('feedback suppressor uses the FBS command with eight distinct bands', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('fbs', { channel: '21', processing_type: '3', enable: true, band1: '1', band8: '1' })

		const call = h.sent.find((c) => c[0] === 's_fbs')
		expect(call?.[2].split(',')).toHaveLength(11)
		expect(call?.[2]).toBe('21,3,1,1,0,0,0,0,0,0,1')
	})

	test('AEC calibration sends the command for the chosen step', () => {
		const h = makeInstance('atdm-0604a')
		h.fireAction('aec_calibration', { action: 'start' })
		expect(h.sent).toContainEqual(['aec_calibration_start', 'S', ''])

		h.fireAction('aec_calibration', { action: 'stop' })
		expect(h.sent).toContainEqual(['aec_calibration_stop', 'S', ''])
	})

	test('output EQ recall sends channel, action and library number', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('output_12eq_func', { output: '9', processing_type: '3', preset: 1 })
		expect(h.sent).toContainEqual(['s_output_12eq_func', 'S', '9,3,1'])
	})

	test('smart mix channel settings send all seven fields', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('smart_mix_channel', {
			input: '9',
			group: 4,
			weight: 60,
			priority: true,
			cancut: true,
			attenuation: 60,
			threshold: 20,
		})
		expect(h.sent).toContainEqual(['s_smart_mix', 'S', '9,4,60,1,1,60,20'])
	})

	// The mixer takes raw steps, not decibels. Its own interface shows the decibel figure, so the
	// dropdowns label each step with it - picking 0.0 dB has to send 30, not 0.
	test('smart mix weight, attenuation and threshold are labelled in decibels', () => {
		const options = makeInstance('atdm-1012').actions['smart_mix_channel'].options
		const choicesFor = (id: string) => options.find((o: any) => o.id === id).choices

		expect(choicesFor('weight')).toHaveLength(61)
		expect(choicesFor('weight')[0]).toEqual({ id: 0, label: '-15.0 dB' })
		expect(choicesFor('weight')[30]).toEqual({ id: 30, label: '0.0 dB' })
		expect(choicesFor('weight')[60]).toEqual({ id: 60, label: '+15.0 dB' })

		expect(choicesFor('attenuation')).toHaveLength(61)
		expect(choicesFor('attenuation')[0]).toEqual({ id: 0, label: '-60 dB' })
		expect(choicesFor('attenuation')[20]).toEqual({ id: 20, label: '-40 dB' })
		expect(choicesFor('attenuation')[60]).toEqual({ id: 60, label: '0 dB' })

		expect(choicesFor('threshold')).toHaveLength(21)
		expect(choicesFor('threshold')[0]).toEqual({ id: 0, label: '-10 dB' })
		expect(choicesFor('threshold')[10]).toEqual({ id: 10, label: '0 dB' })
		expect(choicesFor('threshold')[20]).toEqual({ id: 20, label: '+10 dB' })
	})

	test('input mute uses the dedicated command on the ATDM-1012', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('input_mute', { input: '3', mute: true })
		expect(h.sent).toContainEqual(['SICM', 'S', '3,1'])
		expect(h.instance.state.input_gain_levels).toContainEqual({ id: '3', mute: true })
	})

	test('every model builds its definitions without throwing', () => {
		for (const model of ['atdm-0604', 'atdm-0604a', 'atdm-1012']) {
			const h = makeInstance(model)
			expect(Object.values(h.actions).filter(Boolean).length).toBeGreaterThan(0)
			expect(Object.values(h.feedbacks).filter(Boolean).length).toBeGreaterThan(0)
		}
	})
})

// A set command is only confirmed by an ACK; the mixer reports the new value on the next poll, so
// actions apply the change locally to keep the button honest.
describe('mute actions update local state immediately', () => {
	test('output mute is reflected before the mixer is polled again', () => {
		const h = makeInstance('atdm-1012')
		expect(h.feedbacks['output_mute'].callback({ options: { output: '0' } })).toBe(false)

		h.fireAction('output_mute', { output: '0', mute: true })

		expect(h.instance.state.output_mutes).toContainEqual({ id: '0', mute: true })
		expect(h.feedbacks['output_mute'].callback({ options: { output: '0' } })).toBe(true)
	})

	test('output unmute clears the state in place rather than adding a second entry', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('output_mute', { output: '0', mute: true })
		h.fireAction('output_mute', { output: '0', mute: false })

		expect(h.instance.state.output_mutes).toEqual([{ id: '0', mute: false }])
	})

	test('operator fader mute is reflected immediately', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('sopm', { page: 1, fader: 3, mute: true })

		expect(h.instance.state.operator_page[0]['fader_3_mute']).toBe(true)
		expect(h.feedbacks['gopm'].callback({ options: { page: 1, fader: 3 } })).toBe(true)
	})

	test('the command still goes to the mixer', () => {
		const h = makeInstance('atdm-1012')
		h.fireAction('output_mute', { output: '0', mute: true })
		expect(h.sent).toContainEqual(['s_output_mute', 'S', '0,1'])
	})
})
