import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TestAtdmInstance } from './test-helpers';

describe('sopm action', () => {
    let instance;
    let sendCommandSpy;

    beforeEach(() => {
        instance = new TestAtdmInstance();
        instance.init({
            model: 'atdm-1012'
        });
        sendCommandSpy = vi.spyOn(instance, 'sendCommand');
    });

    test('set mute', () => {
        instance.DATA.operator_page[0]['fader_1_mute'] = false;
        instance.actions['sopm'].callback({ options: { page: 1, fader: 1, mute: true } });
        expect(sendCommandSpy).toHaveBeenCalledWith('SOPM', 'S', '1,1,1');
    });

    test('set unmute', () => {
        instance.DATA.operator_page[0]['fader_1_mute'] = true;
        instance.actions['sopm'].callback({ options: { page: 1, fader: 1, mute: false } });
        expect(sendCommandSpy).toHaveBeenCalledWith('SOPM', 'S', '1,1,0');
    });
});

describe('sopm variable', () => {
    let instance;

    beforeEach(() => {
        instance = new TestAtdmInstance();
        instance.init({
            model: 'atdm-1012'
        });
        instance.DATA.operator_page[0]['fader_1_mute'] = true;
        instance.DATA.operator_page[0]['fader_2_mute'] = false;
        instance.DATA.operator_page[0]['fader_3_mute'] = true;
    });

    test('mute status', async () => {
        const spy = vi.spyOn(instance, 'setVariableValues');

        instance.checkVariables();

        expect(spy).toHaveBeenNthCalledWith(11, {
            "gopm_1_1": "On",
            "gopm_1_2": "Off",
            "gopm_1_3": "On",
            "gopm_1_4": "Off",
            "gopm_1_5": "Off",
            "gopm_1_6": "Off",
            "gopm_1_7": "Off",
            "gopm_1_8": "Off",
            "gopm_2_1": "Off",
            "gopm_2_2": "Off",
            "gopm_2_3": "Off",
            "gopm_2_4": "Off",
            "gopm_2_5": "Off",
            "gopm_2_6": "Off",
            "gopm_2_7": "Off",
            "gopm_2_8": "Off",
            "gopm_3_1": "Off",
            "gopm_3_2": "Off",
            "gopm_3_3": "Off",
            "gopm_3_4": "Off",
            "gopm_3_5": "Off",
            "gopm_3_6": "Off",
            "gopm_3_7": "Off",
            "gopm_3_8": "Off",
            "gopm_4_1": "Off",
            "gopm_4_2": "Off",
            "gopm_4_3": "Off",
            "gopm_4_4": "Off",
            "gopm_4_5": "Off",
            "gopm_4_6": "Off",
            "gopm_4_7": "Off",
            "gopm_4_8": "Off",
            "gopm_5_1": "Off",
            "gopm_5_2": "Off",
            "gopm_5_3": "Off",
            "gopm_5_4": "Off",
            "gopm_5_5": "Off",
            "gopm_5_6": "Off",
            "gopm_5_7": "Off",
            "gopm_5_8": "Off",
            "gopm_6_1": "Off",
            "gopm_6_2": "Off",
            "gopm_6_3": "Off",
            "gopm_6_4": "Off",
            "gopm_6_5": "Off",
            "gopm_6_6": "Off",
            "gopm_6_7": "Off",
            "gopm_6_8": "Off",
            "gopm_7_1": "Off",
            "gopm_7_2": "Off",
            "gopm_7_3": "Off",
            "gopm_7_4": "Off",
            "gopm_7_5": "Off",
            "gopm_7_6": "Off",
            "gopm_7_7": "Off",
            "gopm_7_8": "Off",
            "gopm_8_1": "Off",
            "gopm_8_2": "Off",
            "gopm_8_3": "Off",
            "gopm_8_4": "Off",
            "gopm_8_5": "Off",
            "gopm_8_6": "Off",
            "gopm_8_7": "Off",
            "gopm_8_8": "Off"
        });
    });
});
