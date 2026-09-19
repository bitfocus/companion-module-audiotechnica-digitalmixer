import { InstanceStatus, TCPHelper, type LogLevel } from '@companion-module/base'

/** How long TCPHelper waits between connection attempts while the mixer is unreachable. */
export const RECONNECT_INTERVAL = 5000

/**
 * A TCP connection can stay open long after the mixer has become unreachable - pull the network cable and
 * the socket sits there until the kernel gives up retransmitting, which takes minutes. While polling is
 * running a reply is expected every second, so silence for this long means the link is dead whatever the
 * socket believes, and it is torn down so that a fresh one takes its place.
 */
export const STALE_LINK_TIMEOUT = 15000

/** How often the staleness check runs. */
const WATCHDOG_INTERVAL = 1000

export interface LinkSocketEvents {
	connect: []
	end: []
	error: [err: Error]
	data: [data: Buffer]
	status_change: [status: InstanceStatus, message: string | undefined]
}

/** The part of TCPHelper this module uses, so that a test can stand in for it. */
export interface LinkSocket {
	readonly isConnected: boolean
	send(message: string | Buffer): boolean
	destroy(): void
	on<E extends keyof LinkSocketEvents>(event: E, listener: (...args: LinkSocketEvents[E]) => void): unknown
}

export interface LinkOptions {
	host: string
	port: number
	/** Whether a reply is expected from the mixer, which is what makes silence meaningful. */
	expectsTraffic: () => boolean
	onConnect: () => void
	/** The link has gone away. Anything waiting on the mixer should be abandoned. */
	onDisconnect: () => void
	onData: (chunk: string) => void
	onStatus: (status: InstanceStatus, message?: string) => void
	log: (level: LogLevel, message: string) => void
	/** Overridden in tests. */
	createSocket?: (host: string, port: number) => LinkSocket
}

/**
 * TCPHelper types its events as a closed set, which does not unify with the open structural type used
 * here, so the one cast is kept in the one place that builds a real socket.
 */
function openTCP(host: string, port: number): LinkSocket {
	return new TCPHelper(host, port, {
		reconnect: true,
		reconnect_interval: RECONNECT_INTERVAL,
	}) as unknown as LinkSocket
}

/**
 * Owns the connection to the mixer and keeps it up.
 *
 * TCPHelper retries on its own for as long as it is alive, so the socket is left in place when the link
 * drops rather than being destroyed - destroying it was why a module that lost the network never came back
 * without the connection being toggled by hand.
 */
export class Link {
	private readonly options: LinkOptions
	private socket: LinkSocket | undefined
	private watchdog: NodeJS.Timeout | undefined
	private lastReceivedAt = 0

	/** Set while the link is down, so the failure is logged once rather than on every retry. */
	private lost = false

	constructor(options: LinkOptions) {
		this.options = options
	}

	get isConnected(): boolean {
		return this.socket !== undefined && this.socket.isConnected
	}

	send(payload: string): boolean {
		return this.socket !== undefined && this.socket.send(payload)
	}

	open(): void {
		this.close()

		this.options.onStatus(InstanceStatus.Connecting)

		if (!this.options.host) {
			return
		}

		const socket = (this.options.createSocket ?? openTCP)(this.options.host, this.options.port)

		this.socket = socket
		this.lastReceivedAt = Date.now()

		socket.on('status_change', (status, message) => this.options.onStatus(status, message))

		socket.on('error', (err) => this.linkDown('Network error: ' + err.message))
		socket.on('end', () => this.linkDown('The mixer closed the connection.'))

		socket.on('connect', () => {
			if (this.lost) {
				this.lost = false
				this.options.log('info', 'Reconnected to the mixer.')
			}

			this.lastReceivedAt = Date.now()
			this.options.onConnect()
			this.options.onStatus(InstanceStatus.Ok)
		})

		socket.on('data', (data) => {
			this.lastReceivedAt = Date.now()
			this.options.onData(data.toString('utf8'))
		})

		this.watchdog = setInterval(() => this.checkForSilence(), WATCHDOG_INTERVAL)
	}

	close(): void {
		if (this.watchdog !== undefined) {
			clearInterval(this.watchdog)
			this.watchdog = undefined
		}

		this.socket?.destroy()
		this.socket = undefined
	}

	private linkDown(message: string): void {
		this.options.onDisconnect()

		// Every failed retry raises another error. Logging each one buries the rest of the log under a line
		// every few seconds for as long as the mixer is unreachable.
		if (!this.lost) {
			this.lost = true
			this.options.log('error', `${message} Retrying every ${RECONNECT_INTERVAL / 1000}s.`)
		}

		this.options.onStatus(InstanceStatus.ConnectionFailure, message)
	}

	/**
	 * A cable pulled between two keepalives leaves the socket believing it is still open, so nothing is
	 * emitted at all. The only evidence is that the requests stop being answered.
	 */
	private checkForSilence(): void {
		if (!this.isConnected || !this.options.expectsTraffic()) {
			// Nothing is being asked of the mixer, so silence says nothing about the link.
			this.lastReceivedAt = Date.now()
			return
		}

		if (Date.now() - this.lastReceivedAt <= STALE_LINK_TIMEOUT) {
			return
		}

		this.options.log('warn', `No reply from the mixer for ${STALE_LINK_TIMEOUT / 1000}s, reconnecting.`)

		this.linkDown('The mixer stopped answering.')
		this.open()
	}
}
