import { beforeEach, describe, expect, test, vi } from 'vitest'
import { CommandQueue } from '../src/command-queue.js'
import { processResponse, type ResponseHost } from '../src/process-response.js'
import { createState } from '../src/state.js'
import { getModel } from '../src/models.js'
import { describeError } from '../src/utils.js'

class QueueHarness {
	readonly wire: string[] = []
	readonly logs: { level: string; message: string }[] = []
	readonly host: ResponseHost
	readonly queue: CommandQueue

	constructor(depth = 1) {
		this.host = {
			state: createState(getModel('atdm-1012')),
			model: getModel('atdm-1012'),
			log: (level, message) => this.logs.push({ level, message }),
			requestUiUpdate: () => {},
		}

		this.queue = new CommandQueue({
			write: (payload) => this.wire.push(payload),
			isConnected: () => true,
			processFrame: (frame) => {
				if (frame.includes('NAK')) {
					this.logs.push({ level: 'error', message: `Error: ${frame} Error type: ${describeError(frame)}` })
				} else {
					processResponse(this.host, frame)
				}
			},
			pipelineDepth: () => depth,
			log: (level, message) => this.logs.push({ level, message }),
			onNotConnected: () => {},
		})
	}

	get state() {
		return this.host.state
	}
}

describe('command queue', () => {
	let h: QueueHarness
	beforeEach(() => {
		h = new QueueHarness(1)
	})

	test('at a depth of one, only one command is outstanding', () => {
		h.queue.poll('GOPL', 'O', '1,1')
		h.queue.poll('GOPL', 'O', '1,2')
		h.queue.poll('GOPL', 'O', '1,3')

		expect(h.wire).toHaveLength(1)
		expect(h.wire[0]).toBe('GOPL O 0000 00 NC 1,1 \r')
	})

	test('a button action is sent ahead of a queued poll batch', () => {
		for (let i = 1; i <= 200; i++) h.queue.poll('GOPL', 'O', `1,${i}`)
		expect(h.wire).toHaveLength(1)

		h.queue.send('s_output_mute', 'S', '0,1')
		h.queue.handleIncoming('GOPL 0000 41 NC 1,1,70 \r')

		expect(h.wire[1]).toBe('s_output_mute S 0000 00 NC 0,1 \r')
	})

	test('several actions keep their order relative to each other', () => {
		h.queue.poll('GOPL', 'O', '1,1')
		h.queue.send('s_output_mute', 'S', '0,1')
		h.queue.send('s_output_mute', 'S', '1,1')

		h.queue.handleIncoming('GOPL 0000 41 NC 1,1,70 \r')
		expect(h.wire[1]).toBe('s_output_mute S 0000 00 NC 0,1 \r')

		h.queue.handleIncoming('s_output_mute ACK \r')
		expect(h.wire[2]).toBe('s_output_mute S 0000 00 NC 1,1 \r')
	})
})

// The mixer states that the next command may be sent without waiting for ACK/NAK and Answer (spec 4.1).
describe('pipelining', () => {
	test('the configured number of commands go out without waiting', () => {
		const h = new QueueHarness(8)
		for (let i = 1; i <= 200; i++) h.queue.poll('GOPL', 'O', `1,${i}`)

		expect(h.wire).toHaveLength(8)
	})

	test('each answer releases exactly one slot', () => {
		const h = new QueueHarness(8)
		for (let i = 1; i <= 200; i++) h.queue.poll('GOPL', 'O', `1,${i}`)

		h.queue.handleIncoming('GOPL 0000 41 NC 1,1,70 \r')
		expect(h.wire).toHaveLength(9)

		h.queue.handleIncoming('GOPL 0000 41 NC 1,2,70 \rGOPL 0000 41 NC 1,3,70 \r')
		expect(h.wire).toHaveLength(11)
	})

	test('an action still jumps the queue while the window is full', () => {
		const h = new QueueHarness(8)
		for (let i = 1; i <= 200; i++) h.queue.poll('GOPL', 'O', `1,${i}`)
		h.queue.send('s_output_mute', 'S', '0,1')

		h.queue.handleIncoming('GOPL 0000 41 NC 1,1,70 \r')

		expect(h.wire[8]).toBe('s_output_mute S 0000 00 NC 0,1 \r')
	})

	test('the depth is clamped to the supported maximum', () => {
		const h = new QueueHarness(9999)
		for (let i = 1; i <= 200; i++) h.queue.poll('GOPL', 'O', `1,${i}`)

		expect(h.wire).toHaveLength(CommandQueue.PIPELINE_DEPTH_MAX)
	})

	test('a busy NAK drops the window to one until the backoff passes', () => {
		vi.useFakeTimers()
		try {
			const h = new QueueHarness(8)
			for (let i = 1; i <= 200; i++) h.queue.poll('GOPL', 'O', `1,${i}`)
			expect(h.wire).toHaveLength(8)

			h.queue.handleIncoming('GOPL NAK 90 \r')
			const afterBusy = h.wire.length

			h.queue.handleIncoming('GOPL 0000 41 NC 1,1,70 \r')
			expect(h.wire.length).toBe(afterBusy)

			vi.advanceTimersByTime(CommandQueue.BUSY_BACKOFF + 1)
			h.queue.handleIncoming('GOPL 0000 41 NC 1,2,70 \r')
			expect(h.wire.length).toBeGreaterThan(afterBusy)
		} finally {
			vi.useRealTimers()
		}
	})
})

describe('response framing', () => {
	let h: QueueHarness
	beforeEach(() => {
		h = new QueueHarness(1)
	})

	test('several frames in one socket read each advance the queue', () => {
		h.queue.poll('GOPL', 'O', '1,1')
		h.queue.poll('GOPL', 'O', '1,2')
		h.queue.poll('GOPL', 'O', '1,3')

		h.queue.handleIncoming('GOPL 0000 41 NC 1,1,70 \rGOPL 0000 41 NC 1,2,70 \r')

		expect(h.wire).toHaveLength(3)
		expect(h.wire[2]).toBe('GOPL O 0000 00 NC 1,3 \r')
	})

	test('a frame split across two reads is only acted on once complete', () => {
		h.queue.poll('GOPL', 'O', '1,1')
		h.queue.poll('GOPL', 'O', '1,2')

		h.queue.handleIncoming('GOPL 0000 41 NC ')
		expect(h.wire).toHaveLength(1)

		h.queue.handleIncoming('1,1,70 \r')
		expect(h.wire).toHaveLength(2)
		expect(h.state.operator_page[0].fader_1_level).toBe(70)
	})

	test('an ACK releases the command without being parsed as a response', () => {
		h.queue.send('s_output_mute', 'S', '0,1')
		h.queue.send('s_output_mute', 'S', '1,1')

		h.queue.handleIncoming('s_output_mute ACK \r')

		expect(h.wire).toHaveLength(2)
		expect(h.logs.filter((l) => l.level === 'error')).toHaveLength(0)
	})

	test('a NAK is reported and still releases the command', () => {
		h.queue.send('s_output_mute', 'S', '0,9')
		h.queue.send('s_output_mute', 'S', '1,1')

		h.queue.handleIncoming('s_output_mute NAK 04 \r')

		expect(h.logs.some((l) => l.level === 'error' && l.message.includes('Parameter error'))).toBe(true)
		expect(h.wire).toHaveLength(2)
	})
})

describe('unsolicited notifications', () => {
	let h: QueueHarness
	beforeEach(() => {
		h = new QueueHarness(1)
	})

	test('a notification does not release a command that is still outstanding', () => {
		h.queue.poll('GOPL', 'O', '1,1')
		h.queue.poll('GOPL', 'O', '1,2')

		h.queue.handleIncoming('MD open_channel_notice 0000 00 NC 0,1,1 \r')
		expect(h.wire).toHaveLength(1)

		h.queue.handleIncoming('GOPL 0000 41 NC 1,1,70 \r')
		expect(h.wire).toHaveLength(2)
	})

	test('an open channel notification is recorded and does not corrupt the operator page', () => {
		h.queue.handleIncoming('MD open_channel_notice 0000 00 NC 0,1,1 \r')

		expect(h.state.open_channels).toEqual([{ id: '0', smartmixGroup: '1', status: true }])
		expect(h.state.operator_page[0].fader_1_level).toBe(0)
		expect(h.logs.filter((l) => l.level === 'error')).toHaveLength(0)
	})
})

describe('recovery', () => {
	test('a frame that fails to parse still advances the queue', () => {
		const logs: { level: string; message: string }[] = []
		const wire: string[] = []
		const queue = new CommandQueue({
			write: (payload) => wire.push(payload),
			isConnected: () => true,
			processFrame: () => {
				throw new Error('boom')
			},
			pipelineDepth: () => 1,
			log: (level, message) => logs.push({ level, message }),
			onNotConnected: () => {},
		})

		queue.poll('GOPL', 'O', '1,1')
		queue.poll('GOPL', 'O', '1,2')
		queue.handleIncoming('GOPL 0000 41 NC 1,1,70 \r')

		expect(logs.some((l) => l.level === 'error' && l.message.includes('boom'))).toBe(true)
		expect(wire).toHaveLength(2)
	})

	test('a lost response is dropped after the timeout instead of stalling forever', () => {
		vi.useFakeTimers()
		try {
			const h = new QueueHarness(1)
			h.queue.poll('GOPL', 'O', '1,1')
			h.queue.send('s_output_mute', 'S', '0,1')

			expect(h.wire).toHaveLength(1)

			vi.advanceTimersByTime(CommandQueue.RESPONSE_TIMEOUT + 1)

			expect(h.logs.some((l) => l.level === 'warn')).toBe(true)
			expect(h.wire[1]).toBe('s_output_mute S 0000 00 NC 0,1 \r')
		} finally {
			vi.useRealTimers()
		}
	})
})
