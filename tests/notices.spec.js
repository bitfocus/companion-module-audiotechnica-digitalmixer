import { beforeEach, describe, expect, test } from 'vitest';
import { TestAtdmInstance } from './test-helpers';

const notices = require('../src/notices');

// Wire formats below are the worked examples from the protocol specifications: notices are prefixed with
// 'MD' as a separate token, so the command sits one field later than it does in an Answer.
describe('notice parsing', () => {
    let instance;

    beforeEach(() => {
        instance = new TestAtdmInstance();
        instance.init({ model: 'atdm-1012' });
        Object.assign(instance, { ...notices });
        instance.CONTROL_END = '\r';
    });

    test('the MD prefix is not mistaken for the command', () => {
        instance.processResponse('MD output_mute_notice 0000 00 NC 9,1 ');

        expect(instance.DATA.output_mutes).toContainEqual({ id: '9', mute: true });
    });

    test('an Answer with no MD prefix still parses', () => {
        instance.processResponse('g_output_mute 0000 41 NC 9,1 ');

        expect(instance.DATA.output_mutes).toContainEqual({ id: '9', mute: true });
    });

    test('output level notice updates the level in place', () => {
        instance.processResponse('g_output_level 0000 41 NC 9,111,0,511,0,0 ');
        instance.processResponse('MD output_level_notice 0000 00 NC 9,511 ');

        const output = instance.DATA.output_levels.find((o) => o.id === '9');
        expect(output.level).toBe('511');
        expect(output.level_label).toBe('10.0');
        expect(instance.DATA.output_levels.filter((o) => o.id === '9')).toHaveLength(1);
    });

    test('input gain level notice is accepted under both names the spec uses', () => {
        instance.processResponse('MD input_gain_level_notice 0000 00 NC 0,40,40,511,1 ');
        expect(instance.DATA.input_gain_levels.find((i) => i.id === '0').mute).toBe(true);

        instance.processResponse('MD input_gain_level_meter_notice 0000 00 NC 0,40,40,511,0 ');
        expect(instance.DATA.input_gain_levels.find((i) => i.id === '0').mute).toBe(false);
    });

    test('operator page notice targets the page it names', () => {
        instance.processResponse('MD operator_channel_notice 0000 00 NC 8,100,1,8 ');

        expect(instance.DATA.operator_page[7]['fader_8_level']).toBe(100);
        expect(instance.DATA.operator_page[7]['fader_8_mute']).toBe(true);
        expect(instance.DATA.operator_page[0]['fader_8_mute']).toBe(false); // page 1 untouched
    });

    test('an operator page notice without a page lands on page 1', () => {
        instance.processResponse('MD operator_channel_notice 0000 00 NC 3,50,1 ');

        expect(instance.DATA.operator_page[0]['fader_3_level']).toBe(50);
        expect(instance.DATA.operator_page[0]['fader_3_mute']).toBe(true);
    });

    test('open channel notice records the smart mix group', () => {
        instance.processResponse('MD open_channel_notice 0000 00 NC 9,4,1 ');

        expect(instance.DATA.open_channels).toContainEqual({ id: '9', smartmixGroup: '4', status: true });
    });

    test('array mic mute notice records the virtual mic', () => {
        instance.processResponse('MD arraymic_mute_notice 0000 00 NC 1,1 ');

        expect(instance.DATA.arraymic_mute).toBe(true);
        expect(instance.DATA.arraymic_mutes).toContainEqual({ id: '1', mute: true });
    });

    test('recording status notice is recorded', () => {
        instance.processResponse('MD rec_status_notice 0000 00 NC 1 ');

        expect(instance.DATA.rec_status).toBe('1');
    });

    test('preset and partial preset notices update the current numbers', () => {
        instance.processResponse('MD recall_preset_notice 0000 00 NC 3 ');
        instance.processResponse('MD recall_partial_preset_notice 0000 00 NC 12 ');

        expect(instance.DATA.preset_number).toBe('3');
        expect(instance.DATA.partial_preset_number).toBe('12');
    });

    test('can cut notice records every input', () => {
        instance.processResponse('MD cancut_notice 0000 00 NC 0,1,0,0,0,0,0,0,0,0 ');

        expect(instance.DATA.cancut).toHaveLength(10);
        expect(instance.DATA.cancut[1]).toEqual({ id: '1', status: true });
    });

    test('AEC calibration result notice is recorded', () => {
        instance.processResponse('MD aec_calibration_notice 0000 00 NC 3 ');

        expect(instance.DATA.aec_calibration_result).toBe('3');
    });

    test('level meter notice fills every monitor point in order', () => {
        const levels = Array.from({ length: 42 }, (_, i) => i);
        instance.processResponse('MD level_meter_notice 0000 00 NC ' + levels.join(',') + ' ');

        expect(instance.DATA.meter_levels).toHaveLength(42);
        expect(instance.DATA.meter_levels[0]).toEqual({ monitorPoint: '0', level: '0' });
        expect(instance.DATA.meter_levels[41]).toEqual({ monitorPoint: '41', level: '41' });
    });

    test('fbs notice records the channel state', () => {
        instance.processResponse('MD fbs_notice 0000 00 NC 0,0,1,0,0,0,0 ');

        expect(instance.DATA.fbs).toContainEqual({ id: '0', processing_type: '0', enabled: true });
    });
});

describe('notice datagram handling', () => {
    let instance;

    beforeEach(() => {
        instance = new TestAtdmInstance();
        instance.init({ model: 'atdm-1012' });
        Object.assign(instance, { ...notices });
        instance.CONTROL_END = '\r';
        instance.logs = [];
        instance.log = (level, message) => instance.logs.push({ level, message });
    });

    test('several notices in one datagram are all applied', () => {
        instance.handleNotice('MD output_mute_notice 0000 00 NC 0,1 \rMD output_mute_notice 0000 00 NC 1,1 \r');

        expect(instance.DATA.output_mutes).toContainEqual({ id: '0', mute: true });
        expect(instance.DATA.output_mutes).toContainEqual({ id: '1', mute: true });
    });

    test('a notice that fails to parse is logged and does not stop the rest', () => {
        instance.handleNotice('MD input_gain_level_notice 0000 00 NC 0 \rMD output_mute_notice 0000 00 NC 2,1 \r');

        expect(instance.logs.some((l) => l.level === 'error')).toBe(true);
        expect(instance.DATA.output_mutes).toContainEqual({ id: '2', mute: true });
    });
});
