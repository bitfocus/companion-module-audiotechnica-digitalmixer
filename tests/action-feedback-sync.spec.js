import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TestAtdmInstance } from './test-helpers';

// A set command is only confirmed by an ACK; the mixer reports the new value on the next poll. Actions
// therefore apply the change locally so the button does not sit on a stale state for a whole poll interval.
describe('mute actions update local state immediately', () => {
    let instance;

    beforeEach(() => {
        instance = new TestAtdmInstance();
        instance.init({ model: 'atdm-1012' });
    });

    test('output mute is reflected before the mixer is polled again', () => {
        expect(instance.feedbackDefinitions['output_mute'].callback({ options: { output: '0' } })).toBe(false);

        instance.actionDefinitions['output_mute'].callback({ options: { output: '0', mute: true } });

        expect(instance.DATA.output_mutes).toContainEqual({ id: '0', mute: true });
        expect(instance.feedbackDefinitions['output_mute'].callback({ options: { output: '0' } })).toBe(true);
    });

    test('output unmute clears the state in place rather than adding a second entry', () => {
        instance.actionDefinitions['output_mute'].callback({ options: { output: '0', mute: true } });
        instance.actionDefinitions['output_mute'].callback({ options: { output: '0', mute: false } });

        expect(instance.DATA.output_mutes).toEqual([{ id: '0', mute: false }]);
        expect(instance.feedbackDefinitions['output_mute'].callback({ options: { output: '0' } })).toBe(false);
    });

    test('the local update requests a UI refresh', () => {
        const spy = vi.spyOn(instance, 'requestUiUpdate');

        instance.actionDefinitions['output_mute'].callback({ options: { output: '0', mute: true } });

        expect(spy).toHaveBeenCalled();
    });

    test('a later poll response still wins over the local value', () => {
        instance.actionDefinitions['output_mute'].callback({ options: { output: '0', mute: true } });

        instance.processResponse('g_output_mute 0000 41 NC 0,0 ');

        expect(instance.feedbackDefinitions['output_mute'].callback({ options: { output: '0' } })).toBe(false);
    });

    test('operator fader mute is reflected immediately', () => {
        instance.actionDefinitions['sopm'].callback({ options: { page: 1, fader: 3, mute: true } });

        expect(instance.DATA.operator_page[0]['fader_3_mute']).toBe(true);
        expect(instance.feedbackDefinitions['gopm'].callback({ options: { page: 1, fader: 3 } })).toBe(true);
    });

    test('the command still goes to the mixer', () => {
        const spy = vi.spyOn(instance, 'sendCommand');

        instance.actionDefinitions['output_mute'].callback({ options: { output: '0', mute: true } });

        expect(spy).toHaveBeenCalledWith('s_output_mute', 'S', '0,1');
    });
});
