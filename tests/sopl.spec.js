import { expect, test, vi } from 'vitest';
import { TestAtdmInstance } from './test-helpers';

const instance = new TestAtdmInstance();
instance.init({
    model: 'atdm-1012'
});

test('set fader level', async () => {
    const spy = vi.spyOn(instance, 'sendCommand');

    await instance.actions['sopl'].callback({ options: { page: 1, fader: 1, level: 55 }});

    expect(spy).toHaveBeenCalledWith('SOPL', 'S', '1,1,55');
});

test('increase fader level', async () => {
    await instance.actions['sopl'].callback({ options: { page: 1, fader: 1, level: 45 }});
    const spy = vi.spyOn(instance, 'sendCommand');

    await instance.actions['sopl_increase'].callback({ options: { page: 1, fader: 1, steps: 1 }});

    expect(spy).toHaveBeenCalledWith('SOPL', 'S', '1,1,46');
});

test('decrease fader level', async () => {
    await instance.actions['sopl'].callback({ options: { page: 1, fader: 1, level: 45 }});
    const spy = vi.spyOn(instance, 'sendCommand');

    await instance.actions['sopl_decrease'].callback({ options: { page: 1, fader: 1, steps: 1 }});

    expect(spy).toHaveBeenCalledWith('SOPL', 'S', '1,1,44');
});
