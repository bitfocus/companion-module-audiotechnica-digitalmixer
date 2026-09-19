import { InstanceStatus } from '@companion-module/base'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Link, RECONNECT_INTERVAL, STALE_LINK_TIMEOUT, type LinkOptions } from '../src/link.js'
import { FakeTCP } from './fake-tcp.js'

interface Harness {
	link: Link
	logs: { level: string; message: string }[]
	statuses: InstanceStatus[]
	connects: number
	disconnects: number
	data: string[]
}

/** Builds a link and, unless `connect` is false, brings it up the way a real mixer would. */
function makeLink(overrides: Partial<LinkOptions> = {}, connect = true): Harness {
	const harness: Harness = {
		link: undefined as unknown as Link,
		logs: [],
		statuses: [],
		connects: 0,
		disconnects: 0,
		data: [],
	}

	harness.link = new Link({
		host: '192.168.0.50',
		port: 17300,
		expectsTraffic: () => true,
		onConnect: () => harness.connects++,
		onDisconnect: () => harness.disconnects++,
		onData: (chunk) => harness.data.push(chunk),
		onStatus: (status) => harness.statuses.push(status),
		log: (level, message) => harness.logs.push({ level, message }),
		createSocket: (host, port) => new FakeTCP(host, port),
		...overrides,
	})

	harness.link.open()

	if (connect && FakeTCP.instances.length > 0) {
		FakeTCP.latest.open()
	}

	return harness
}

const errors = (h: Harness) => h.logs.filter((entry) => entry.level === 'error')

describe('link', () => {
	beforeEach(() => {
		FakeTCP.reset()
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	// The old handler destroyed the socket on error, which threw away the helper's own retry loop. Only
	// ECONNRESET got a replacement, so pulling the network cable - which fails in any of half a dozen
	// other ways - left the module red until somebody toggled the connection by hand.
	test.each([
		'connect ETIMEDOUT 192.168.0.50:17300',
		'connect EHOSTUNREACH 192.168.0.50:17300',
		'connect ENETUNREACH 192.168.0.50:17300',
		'connect ECONNREFUSED 192.168.0.50:17300',
		'read ECONNRESET',
		'write EPIPE',
	])('keeps the socket alive through %s', (message) => {
		const h = makeLink()
		const socket = FakeTCP.latest

		socket.fail(message)

		expect(socket.isDestroyed).toBe(false)
		expect(FakeTCP.instances).toHaveLength(1)
		expect(h.disconnects).toBe(1)
		expect(h.statuses.at(-1)).toBe(InstanceStatus.ConnectionFailure)

		// and the same socket coming back up is a reconnect, with no new socket needed
		socket.open()
		expect(h.connects).toBe(2)
		expect(h.logs).toContainEqual({ level: 'info', message: 'Reconnected to the mixer.' })
		expect(h.statuses.at(-1)).toBe(InstanceStatus.Ok)

		h.link.close()
	})

	test('the mixer closing the connection does not destroy the socket either', () => {
		const h = makeLink()
		const socket = FakeTCP.latest

		socket.isConnected = false
		socket.emit('end')

		expect(socket.isDestroyed).toBe(false)
		expect(h.disconnects).toBe(1)

		h.link.close()
	})

	test('a repeatedly failing link is logged once, and the recovery is logged', () => {
		const h = makeLink()
		const socket = FakeTCP.latest

		for (let i = 0; i < 5; i++) {
			socket.fail('connect ETIMEDOUT 192.168.0.50:17300')
		}

		expect(errors(h)).toHaveLength(1)
		expect(errors(h)[0].message).toContain(`Retrying every ${RECONNECT_INTERVAL / 1000}s`)
		expect(h.disconnects).toBe(5)

		socket.open()
		expect(h.logs).toContainEqual({ level: 'info', message: 'Reconnected to the mixer.' })

		// a second outage is reported again rather than being swallowed by the first
		socket.fail('connect ETIMEDOUT 192.168.0.50:17300')
		expect(errors(h)).toHaveLength(2)

		h.link.close()
	})

	// A cable pulled between two keepalives leaves the socket believing it is still open, so it emits
	// nothing at all. The only evidence is that the requests stop being answered.
	test('a socket that stops answering is torn down and replaced', () => {
		const h = makeLink()
		const socket = FakeTCP.latest

		vi.advanceTimersByTime(STALE_LINK_TIMEOUT + 1000)

		expect(socket.isDestroyed).toBe(true)
		expect(FakeTCP.instances).toHaveLength(2)
		expect(h.logs).toContainEqual({
			level: 'warn',
			message: `No reply from the mixer for ${STALE_LINK_TIMEOUT / 1000}s, reconnecting.`,
		})

		h.link.close()
	})

	test('a link that keeps answering is left alone', () => {
		const h = makeLink()
		const socket = FakeTCP.latest

		for (let i = 0; i < STALE_LINK_TIMEOUT / 1000 + 5; i++) {
			vi.advanceTimersByTime(1000)
			socket.reply()
		}

		expect(socket.isDestroyed).toBe(false)
		expect(FakeTCP.instances).toHaveLength(1)
		expect(h.data).toHaveLength(STALE_LINK_TIMEOUT / 1000 + 5)

		h.link.close()
	})

	test('silence is not held against a link that is not being polled', () => {
		const h = makeLink({ expectsTraffic: () => false })

		vi.advanceTimersByTime(STALE_LINK_TIMEOUT * 4)

		expect(FakeTCP.latest.isDestroyed).toBe(false)
		expect(FakeTCP.instances).toHaveLength(1)

		h.link.close()
	})

	test('a link that is down is not torn down again by the watchdog', () => {
		const h = makeLink()
		const socket = FakeTCP.latest

		socket.fail('connect ETIMEDOUT 192.168.0.50:17300')
		vi.advanceTimersByTime(STALE_LINK_TIMEOUT * 4)

		expect(socket.isDestroyed).toBe(false)
		expect(FakeTCP.instances).toHaveLength(1)

		h.link.close()
	})

	test('closing stops the watchdog and destroys the socket', () => {
		const h = makeLink()
		const socket = FakeTCP.latest

		h.link.close()

		expect(socket.isDestroyed).toBe(true)
		expect(h.link.isConnected).toBe(false)

		vi.advanceTimersByTime(STALE_LINK_TIMEOUT * 4)
		expect(FakeTCP.instances).toHaveLength(1)
	})

	test('no host means no socket', () => {
		const h = makeLink({ host: '' }, false)

		expect(FakeTCP.instances).toHaveLength(0)
		expect(h.statuses).toEqual([InstanceStatus.Connecting])

		h.link.close()
	})

	test('sending reports failure rather than pretending when there is no socket', () => {
		const h = makeLink({}, false)

		expect(h.link.send('identify S 0000 00 NC  \r')).toBe(false)

		FakeTCP.latest.open()
		expect(h.link.send('identify S 0000 00 NC  \r')).toBe(true)
		expect(FakeTCP.latest.sent).toContain('identify S 0000 00 NC  \r')

		h.link.close()
		expect(h.link.send('identify S 0000 00 NC  \r')).toBe(false)
	})
})
