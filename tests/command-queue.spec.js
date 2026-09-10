import { beforeEach, describe, expect, test, vi } from 'vitest';

const commandQueue = require('../src/command-queue');
const processResponse = require('../src/process-response');
const utils = require('../src/utils');
const models = require('../src/models');
const data = require('../src/data');

// Minimal stand-in for the instance: the real socket is replaced by a list of what was written.
class QueueHarness {
    constructor(pipelineDepth = 1) {
        Object.assign(this, { ...utils, ...models, ...data, ...processResponse, ...commandQueue });

        this.CONTROL_MODELID = '0000';
        this.CONTROL_UNITNUMBER = '00';
        this.CONTROL_CONTINUESELECT = 'NC';
        this.CONTROL_ACK = 'ACK';
        this.CONTROL_NAK = 'NAK';
        this.CONTROL_END = '\r';
        this.RESPONSE_TIMEOUT = 5000;
        this.PIPELINE_DEPTH = 8;
        this.PIPELINE_DEPTH_MAX = 32;
        this.BUSY_BACKOFF = 2000;

        this.config = { model: 'atdm-1012', pipeline_depth: pipelineDepth };
        this.DATA = {};
        this.logs = [];
        this.wire = [];

        this.socket = { isConnected: true, send: (payload) => { this.wire.push(payload); return Promise.resolve(); } };

        this.initData();
        this.resetQueues();
    }

    log(level, message) { this.logs.push({ level, message }); }
    stopPolling() { this.pollQueue = []; }
    requestUiUpdate() {}
    setVariableValues() {}
    checkVariables() {}
    checkFeedbacks() {}

    sentCommands() { return this.wire.map((w) => w.trim().split(' ')[0]); }
}

describe('command queue', () => {
    let h;
    beforeEach(() => { h = new QueueHarness(1); });

    test('at a depth of one, only one command is outstanding', () => {
        h.pollCommand('GOPL', 'O', '1,1');
        h.pollCommand('GOPL', 'O', '1,2');
        h.pollCommand('GOPL', 'O', '1,3');

        expect(h.wire).toHaveLength(1);
        expect(h.wire[0]).toBe('GOPL O 0000 00 NC 1,1 \r');
    });

    test('a button action is sent ahead of a queued poll batch', () => {
        for (let i = 1; i <= 200; i++) {
            h.pollCommand('GOPL', 'O', `1,${i}`);
        }
        expect(h.sentCommands()).toEqual(['GOPL']); // first poll is already outstanding

        h.sendCommand('s_output_mute', 'S', '0,1'); // operator presses a button

        h.handleIncoming('GOPL 0000 41 NC 1,1,70 \r'); // outstanding poll is answered

        expect(h.wire[1]).toBe('s_output_mute S 0000 00 NC 0,1 \r');
    });

    test('several actions keep their order relative to each other', () => {
        h.pollCommand('GOPL', 'O', '1,1');
        h.sendCommand('s_output_mute', 'S', '0,1');
        h.sendCommand('s_output_mute', 'S', '1,1');

        h.handleIncoming('GOPL 0000 41 NC 1,1,70 \r');
        expect(h.wire[1]).toBe('s_output_mute S 0000 00 NC 0,1 \r');

        h.handleIncoming('s_output_mute ACK \r');
        expect(h.wire[2]).toBe('s_output_mute S 0000 00 NC 1,1 \r');
    });
});

// The mixer states that the next command may be sent without waiting for ACK/NAK and Answer (spec 4.1).
describe('pipelining', () => {
    test('the configured number of commands go out without waiting', () => {
        const h = new QueueHarness(8);

        for (let i = 1; i <= 200; i++) {
            h.pollCommand('GOPL', 'O', `1,${i}`);
        }

        expect(h.wire).toHaveLength(8);
    });

    test('each answer releases exactly one slot', () => {
        const h = new QueueHarness(8);

        for (let i = 1; i <= 200; i++) {
            h.pollCommand('GOPL', 'O', `1,${i}`);
        }

        h.handleIncoming('GOPL 0000 41 NC 1,1,70 \r');
        expect(h.wire).toHaveLength(9);

        h.handleIncoming('GOPL 0000 41 NC 1,2,70 \rGOPL 0000 41 NC 1,3,70 \r');
        expect(h.wire).toHaveLength(11);
    });

    test('an action still jumps the queue while the window is full', () => {
        const h = new QueueHarness(8);

        for (let i = 1; i <= 200; i++) {
            h.pollCommand('GOPL', 'O', `1,${i}`);
        }
        h.sendCommand('s_output_mute', 'S', '0,1');

        h.handleIncoming('GOPL 0000 41 NC 1,1,70 \r');

        expect(h.wire[8]).toBe('s_output_mute S 0000 00 NC 0,1 \r');
    });

    test('the depth is clamped to the supported maximum', () => {
        const h = new QueueHarness(9999);

        for (let i = 1; i <= 200; i++) {
            h.pollCommand('GOPL', 'O', `1,${i}`);
        }

        expect(h.wire).toHaveLength(h.PIPELINE_DEPTH_MAX);
    });

    test('a busy NAK drops the window to one until the backoff passes', () => {
        vi.useFakeTimers();
        try {
            const h = new QueueHarness(8);

            for (let i = 1; i <= 200; i++) {
                h.pollCommand('GOPL', 'O', `1,${i}`);
            }
            expect(h.wire).toHaveLength(8);

            h.handleIncoming('GOPL NAK 90 \r');
            const afterBusy = h.wire.length;

            // window is 1 now, so answering one command releases only one more
            h.handleIncoming('GOPL 0000 41 NC 1,1,70 \r');
            expect(h.wire.length).toBe(afterBusy);

            vi.advanceTimersByTime(h.BUSY_BACKOFF + 1);
            h.handleIncoming('GOPL 0000 41 NC 1,2,70 \r');
            expect(h.wire.length).toBeGreaterThan(afterBusy);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('response framing', () => {
    let h;
    beforeEach(() => { h = new QueueHarness(1); });

    test('several frames in one socket read each advance the queue', () => {
        h.pollCommand('GOPL', 'O', '1,1');
        h.pollCommand('GOPL', 'O', '1,2');
        h.pollCommand('GOPL', 'O', '1,3');

        // The first two answers arrive coalesced into a single read.
        h.handleIncoming('GOPL 0000 41 NC 1,1,70 \rGOPL 0000 41 NC 1,2,70 \r');

        expect(h.wire).toHaveLength(3);
        expect(h.wire[2]).toBe('GOPL O 0000 00 NC 1,3 \r');
    });

    test('a frame split across two reads is only acted on once complete', () => {
        h.pollCommand('GOPL', 'O', '1,1');
        h.pollCommand('GOPL', 'O', '1,2');

        h.handleIncoming('GOPL 0000 41 NC ');
        expect(h.wire).toHaveLength(1); // nothing complete yet

        h.handleIncoming('1,1,70 \r');
        expect(h.wire).toHaveLength(2);
        expect(h.DATA.operator_page[0].fader_1_level).toBe(70);
    });

    test('an ACK releases the command without being parsed as a response', () => {
        h.sendCommand('s_output_mute', 'S', '0,1');
        h.sendCommand('s_output_mute', 'S', '1,1');

        h.handleIncoming('s_output_mute ACK \r');

        expect(h.wire).toHaveLength(2);
        expect(h.logs.filter((l) => l.level === 'error')).toHaveLength(0);
    });

    test('a NAK is reported and still releases the command', () => {
        h.sendCommand('s_output_mute', 'S', '0,9');
        h.sendCommand('s_output_mute', 'S', '1,1');

        h.handleIncoming('s_output_mute NAK 04 \r');

        expect(h.logs.some((l) => l.level === 'error' && l.message.includes('Parameter error'))).toBe(true);
        expect(h.wire).toHaveLength(2);
    });
});

describe('unsolicited notices', () => {
    let h;
    beforeEach(() => { h = new QueueHarness(1); });

    test('a notice does not release a command that is still outstanding', () => {
        h.pollCommand('GOPL', 'O', '1,1');
        h.pollCommand('GOPL', 'O', '1,2');

        h.handleIncoming('MD open_channel_notice 0000 00 NC 0,1,1 \r');
        expect(h.wire).toHaveLength(1); // still waiting on GOPL 1,1

        h.handleIncoming('GOPL 0000 41 NC 1,1,70 \r');
        expect(h.wire).toHaveLength(2);
    });

    test('an open channel notice is recorded and does not corrupt the operator page', () => {
        h.handleIncoming('MD open_channel_notice 0000 00 NC 0,1,1 \r');

        expect(h.DATA.open_channels).toEqual([{ id: '0', smartmixGroup: '1', status: true }]);
        expect(h.DATA.operator_page[0].fader_1_level).toBe(0); // untouched by the notice
        expect(h.logs.filter((l) => l.level === 'error')).toHaveLength(0);
    });
});

describe('recovery', () => {
    let h;
    beforeEach(() => { h = new QueueHarness(1); });

    test('a frame that fails to parse still advances the queue', () => {
        h.pollCommand('GOPL', 'O', '1,1');
        h.pollCommand('GOPL', 'O', '1,2');

        vi.spyOn(h, 'processResponse').mockImplementationOnce(() => { throw new Error('boom'); });

        h.handleIncoming('GOPL 0000 41 NC 1,1,70 \r');

        expect(h.logs.some((l) => l.level === 'error' && l.message.includes('boom'))).toBe(true);
        expect(h.wire).toHaveLength(2); // queue kept moving
    });

    test('a lost response is dropped after the timeout instead of stalling forever', () => {
        vi.useFakeTimers();
        try {
            const harness = new QueueHarness(1);
            harness.pollCommand('GOPL', 'O', '1,1');
            harness.sendCommand('s_output_mute', 'S', '0,1');

            expect(harness.wire).toHaveLength(1); // the poll never gets answered

            vi.advanceTimersByTime(harness.RESPONSE_TIMEOUT + 1);

            expect(harness.logs.some((l) => l.level === 'warn')).toBe(true);
            expect(harness.wire[1]).toBe('s_output_mute S 0000 00 NC 0,1 \r');
        } finally {
            vi.useRealTimers();
        }
    });
});
