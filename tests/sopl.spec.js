import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TestAtdmInstance } from './test-helpers';

describe('sopl action', () => {
    let instance;
    let sendCommandSpy;

    beforeEach(() => {
        instance = new TestAtdmInstance();
        instance.init({
            model: 'atdm-1012'
        });
        instance.DATA.operator_page[0]['fader_1_level'] = 50;
        sendCommandSpy = vi.spyOn(instance, 'sendCommand');
    });

    test('set fader level', () => {
        instance.actions['sopl'].callback({ options: { page: 1, fader: 1, level: 55 } });
        expect(sendCommandSpy).toHaveBeenCalledWith('SOPL', 'S', '1,1,55');
    });

    test('increase fader level', async () => {
        await instance.actions['sopl_increase'].callback({ options: { page: 1, fader: 1, steps: 1 } });
        expect(sendCommandSpy).toHaveBeenCalledWith('SOPL', 'S', '1,1,51');
    });

    test('decrease fader level', async () => {
        await instance.actions['sopl_decrease'].callback({ options: { page: 1, fader: 1, steps: 1 } });
        expect(sendCommandSpy).toHaveBeenCalledWith('SOPL', 'S', '1,1,49');
    });

});

describe('sopl variable', () => {
    let instance;

    beforeEach(() => {
        instance = new TestAtdmInstance();
        instance.init({
            model: 'atdm-1012'
        });
        instance.DATA.operator_page[0]['fader_1_level'] = 50;
        instance.DATA.operator_page[0]['fader_2_level'] = 82;
        instance.DATA.operator_page[0]['fader_3_level'] = 20;
    });

    test('fader level', async () => {
        const spy = vi.spyOn(instance, 'setVariableValues');

        instance.checkVariables();

        expect(spy).toHaveBeenNthCalledWith(10, {
            "gopl_1_1": 50,
            "gopl_1_2": 82,
            "gopl_1_3": 20,
            "gopl_1_4": 0,
            "gopl_1_5": 0,
            "gopl_1_6": 0,
            "gopl_1_7": 0,
            "gopl_1_8": 0,
            "gopl_2_1": 0,
            "gopl_2_2": 0,
            "gopl_2_3": 0,
            "gopl_2_4": 0,
            "gopl_2_5": 0,
            "gopl_2_6": 0,
            "gopl_2_7": 0,
            "gopl_2_8": 0,
            "gopl_3_1": 0,
            "gopl_3_2": 0,
            "gopl_3_3": 0,
            "gopl_3_4": 0,
            "gopl_3_5": 0,
            "gopl_3_6": 0,
            "gopl_3_7": 0,
            "gopl_3_8": 0,
            "gopl_4_1": 0,
            "gopl_4_2": 0,
            "gopl_4_3": 0,
            "gopl_4_4": 0,
            "gopl_4_5": 0,
            "gopl_4_6": 0,
            "gopl_4_7": 0,
            "gopl_4_8": 0,
            "gopl_5_1": 0,
            "gopl_5_2": 0,
            "gopl_5_3": 0,
            "gopl_5_4": 0,
            "gopl_5_5": 0,
            "gopl_5_6": 0,
            "gopl_5_7": 0,
            "gopl_5_8": 0,
            "gopl_6_1": 0,
            "gopl_6_2": 0,
            "gopl_6_3": 0,
            "gopl_6_4": 0,
            "gopl_6_5": 0,
            "gopl_6_6": 0,
            "gopl_6_7": 0,
            "gopl_6_8": 0,
            "gopl_7_1": 0,
            "gopl_7_2": 0,
            "gopl_7_3": 0,
            "gopl_7_4": 0,
            "gopl_7_5": 0,
            "gopl_7_6": 0,
            "gopl_7_7": 0,
            "gopl_7_8": 0,
            "gopl_8_1": 0,
            "gopl_8_2": 0,
            "gopl_8_3": 0,
            "gopl_8_4": 0,
            "gopl_8_5": 0,
            "gopl_8_6": 0,
            "gopl_8_7": 0,
            "gopl_8_8": 0,
        });
    });
});
