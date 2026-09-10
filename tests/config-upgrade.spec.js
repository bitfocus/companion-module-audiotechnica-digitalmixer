import { describe, expect, test } from 'vitest';

const upgrades = require('../src/upgrades');

// Polling used to be enabled by any non-zero interval and allowed intervals down to 50ms, which on an
// ATDM-1012 queued 200 requests every 50ms against a link that can carry about 400 a second.
describe('polling config upgrade', () => {
    const upgrade = upgrades[upgrades.length - 1];
    const run = (config) => upgrade({}, { config }).updatedConfig;

    test('an existing interval turns into polling enabled', () => {
        expect(run({ poll_interval: 1000 })).toMatchObject({ polling: true, poll_interval: 1000 });
    });

    test('an interval below the new floor is raised', () => {
        expect(run({ poll_interval: 50 })).toMatchObject({ polling: true, poll_interval: 500 });
    });

    test('an interval of zero means the user had polling switched off', () => {
        expect(run({ poll_interval: 0 })).toMatchObject({ polling: false, poll_interval: 1000 });
    });

    test('the new settings get their defaults', () => {
        expect(run({ poll_interval: 1000 })).toMatchObject({
            port: 17300,
            pipeline_depth: 8,
            notices: false,
            multicast_address: '225.0.0.100',
            multicast_port: 17000,
            level_meters: false,
        });
    });

    test('notifications stay off on upgrade, since the mixer ships with them off', () => {
        expect(run({ poll_interval: 1000 }).notices).toBe(false);
    });

    test('a config that already has everything is left alone', () => {
        expect(run({
            polling: false, poll_interval: 1000, port: 17300, pipeline_depth: 8, notices: true,
        })).toBeNull();
    });

    test('a missing config is not touched', () => {
        expect(run(null)).toBeNull();
        expect(run(undefined)).toBeNull();
    });
});
