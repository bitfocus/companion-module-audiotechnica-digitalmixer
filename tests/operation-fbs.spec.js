import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TestAtdmInstance } from './test-helpers';

describe('fbs action', () => {
    let instance;
    let sendCommandSpy;

    beforeEach(() => {
        instance = new TestAtdmInstance();
        instance.init({
            model: 'atdm-1012'
        });
        sendCommandSpy = vi.spyOn(instance, 'sendCommand');
    });

    test('set fbs enabled', () => {
        instance.actionDefinitions['fbs'].callback({
            options: {
                channel: '21',
                processing_type: '3',
                enable: true,
                band1: '1', band2: '1', band3: '1', band4: '1',
                band5: '1', band6: '1', band7: '1', band8: '1'
            }
        });
        expect(sendCommandSpy).toHaveBeenCalledWith('s_fbs', 'S', '21,3,1,1,1,1,1,1,1,1,1');
    });

    test('set fbs disabled', () => {
        instance.actionDefinitions['fbs'].callback({
            options: {
                channel: '0',
                processing_type: '0',
                enable: false,
                band1: '0', band2: '0', band3: '0', band4: '0',
                band5: '0', band6: '0', band7: '0', band8: '0'
            }
        });
        expect(sendCommandSpy).toHaveBeenCalledWith('s_fbs', 'S', '0,0,0,0,0,0,0,0,0,0,0');
    });

    test('each band is sent in its own position', () => {
        instance.actionDefinitions['fbs'].callback({
            options: {
                channel: '12',
                processing_type: '3',
                enable: true,
                band1: '0', band2: '1', band3: '0', band4: '1',
                band5: '0', band6: '1', band7: '0', band8: '1'
            }
        });
        expect(sendCommandSpy).toHaveBeenCalledWith('s_fbs', 'S', '12,3,1,0,1,0,1,0,1,0,1');
    });
});

describe('fbs action options', () => {
    // Band 7 and Band 8 previously reused id 'band1', so those two band
    // values could never be set independently.
    test.each(['atdm-0604', 'atdm-0604a', 'atdm-1012'])('%s has one option per band', (model) => {
        const instance = new TestAtdmInstance();
        instance.init({ model: model });

        const ids = instance.actionDefinitions['fbs'].options.map((option) => option.id);

        expect(ids).toStrictEqual([
            'channel',
            'processing_type',
            'enable',
            'band1', 'band2', 'band3', 'band4',
            'band5', 'band6', 'band7', 'band8'
        ]);
    });

    test.each(['atdm-0604', 'atdm-0604a', 'atdm-1012'])('%s dropdown choices have unique ids', (model) => {
        const instance = new TestAtdmInstance();
        instance.init({ model: model });

        for (const option of instance.actionDefinitions['fbs'].options) {
            if (option.choices === undefined) {
                continue;
            }

            const ids = option.choices.map((choice) => choice.id);
            expect(new Set(ids).size, `duplicate choice id in ${option.id}`).toBe(ids.length);
        }
    });
});
