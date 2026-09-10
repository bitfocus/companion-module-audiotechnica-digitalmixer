import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TestAtdmInstance } from './test-helpers';

// Every expectation below is the parameter layout given in the protocol specification for that command.
describe('system and preset actions', () => {
    let instance, spy;

    const forModel = (model) => {
        instance = new TestAtdmInstance();
        instance.init({ model });
        spy = vi.spyOn(instance, 'sendCommand');
        return instance;
    };

    const fire = (name, overrides = {}) => {
        const options = {};
        for (const option of instance.actionDefinitions[name].options) {
            options[option.id] = option.default;
        }
        instance.actionDefinitions[name].callback({ options: { ...options, ...overrides } });
    };

    test('identify takes no parameters', () => {
        forModel('atdm-1012');
        fire('identify');
        expect(spy).toHaveBeenCalledWith('identify', 'S', '');
    });

    test('preset save uses REGIP on the ATDM-1012 and save_preset elsewhere', () => {
        forModel('atdm-1012');
        fire('save_preset', { preset: 8 });
        expect(spy).toHaveBeenCalledWith('REGIP', 'S', '8');

        forModel('atdm-0604a');
        fire('save_preset', { preset: 6 });
        expect(spy).toHaveBeenCalledWith('save_preset', 'S', '6');
    });

    test('boot up preset accepts none', () => {
        forModel('atdm-1012');
        fire('bootup_preset', { preset: 0 });
        expect(spy).toHaveBeenCalledWith('s_bootup_preset', 'S', '0');
    });

    test('front panel restrictions send three flags', () => {
        forModel('atdm-1012');
        fire('front_panel', { recall_preset: true, led_dimmer: true, error_notice: false });
        expect(spy).toHaveBeenCalledWith('s_front_panel_limit', 'S', '1,1,0');
    });

    test('operator mute carries the page on the ATDM-1012 only', () => {
        forModel('atdm-1012');
        fire('operator_mute', { page: 8, fader: 8, mute: true });
        expect(spy).toHaveBeenCalledWith('s_operator_mute', 'S', '8,1,8');

        forModel('atdm-0604a');
        fire('operator_mute', { fader: 1, mute: true });
        expect(spy).toHaveBeenCalledWith('s_operator_mute', 'S', '1,1');
    });

    test('smart mix mode and open mic count', () => {
        forModel('atdm-1012');
        fire('smartmix_mode', { group: 4, mode: '2' });
        expect(spy).toHaveBeenCalledWith('SSMM', 'S', '4,2');

        fire('open_mic_limit', { group: 4, nom: 10 });
        expect(spy).toHaveBeenCalledWith('NOOM', 'S', '4,10');
    });

    test('usb out sends both bus selections and a level', () => {
        forModel('atdm-1012');
        fire('usb_out', { usb1: '12', usb2: '12', level: '411' });
        expect(spy).toHaveBeenCalledWith('s_usb_out', 'S', '12,12,411');
    });

    test('the ducker sends all four channel pairs, keeping the ones not being changed', () => {
        forModel('atdm-1012');
        instance.DATA.ducker = [
            { id: '0', enabled: false, trigger: '1' },
            { id: '1', enabled: true, trigger: '2' },
            { id: '2', enabled: false, trigger: '3' },
            { id: '3', enabled: true, trigger: '4' },
        ];

        fire('ducker', { channel: '0', enable: true, trigger: '4' });

        expect(spy).toHaveBeenCalledWith('s_ducker_general', 'S', '1,4,1,2,0,3,1,4');
    });

    test('the oscillator sends one assign flag per output channel', () => {
        forModel('atdm-1012');
        fire('oscillator', { enable: true, source: '1', frequency: '2', level: '121', assign: ['0', '9'] });

        const call = spy.mock.calls.find((c) => c[0] === 's_oscillator');
        expect(call[2].split(',')).toHaveLength(14); // enable, source, frequency, level + 10 outputs
        expect(call[2]).toBe('1,1,2,121,1,0,0,0,0,0,0,0,0,1');
    });

    test('feedback suppressor uses the FBS command with eight distinct bands', () => {
        forModel('atdm-1012');
        fire('fbs', { channel: '21', processing_type: '3', enable: true, band1: '1', band8: '1' });

        const call = spy.mock.calls.find((c) => c[0] === 's_fbs');
        expect(call[2].split(',')).toHaveLength(11);
        expect(call[2]).toBe('21,3,1,1,0,0,0,0,0,0,1');
    });

    test('AEC calibration sends the command for the chosen step', () => {
        forModel('atdm-0604a');
        fire('aec_calibration', { action: 'start' });
        expect(spy).toHaveBeenCalledWith('aec_calibration_start', 'S', '');

        fire('aec_calibration', { action: 'stop' });
        expect(spy).toHaveBeenCalledWith('aec_calibration_stop', 'S', '');
    });

    test('output EQ recall sends channel, action and library number', () => {
        forModel('atdm-1012');
        fire('output_12eq_func', { output: '9', processing_type: '3', preset: 1 });
        expect(spy).toHaveBeenCalledWith('s_output_12eq_func', 'S', '9,3,1');
    });

    test('smart mix channel settings send all seven fields', () => {
        forModel('atdm-1012');
        fire('smart_mix_channel', {
            input: '9', group: 4, weight: 60, priority: true, cancut: true, attenuation: 60, threshold: 20,
        });
        expect(spy).toHaveBeenCalledWith('s_smart_mix', 'S', '9,4,60,1,1,60,20');
    });

    test('input mute uses the dedicated command on the ATDM-1012', () => {
        forModel('atdm-1012');
        fire('input_mute', { input: '3', mute: true });
        expect(spy).toHaveBeenCalledWith('SICM', 'S', '3,1');
        expect(instance.DATA.input_gain_levels).toContainEqual({ id: '3', mute: true });
    });
});
