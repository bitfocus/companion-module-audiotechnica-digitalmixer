import dgram from 'dgram'
import type { LogLevel } from '@companion-module/base'
import { CONTROL_END, MULTICAST_ADDRESS, MULTICAST_PORT } from './utils.js'

export interface NoticeListenerOptions {
	address: string
	port: number
	/** Interface to join the group on. Empty lets the operating system choose. */
	interface: string
	/** Only accept datagrams from this address, since several mixers can share one group. */
	host: string
	processFrame: (frame: string) => void
	log: (level: LogLevel, message: string) => void
}

/**
 * State changes made at the mixer's front panel, from Web Remote or by another controller are pushed as
 * notifications over UDP multicast (protocol spec chapter 5), not over the TCP control socket. Listening
 * for them is what keeps feedbacks honest between polls - without it the only way to notice an external
 * change is to poll for it.
 *
 * Notifications are only sent when 'IP Control Settings > Notification' is enabled on the mixer, which is
 * off by default. Level meter notifications additionally need 'Audio Level Notification'.
 *
 * dgram is used directly because UDPHelper cannot join a multicast group - its membership handling is
 * commented out, in every version up to and including 2.x.
 */
export class NoticeListener {
	private socket: dgram.Socket | undefined
	private readonly options: NoticeListenerOptions

	constructor(options: NoticeListenerOptions) {
		this.options = options
	}

	start(): void {
		this.stop()

		const address = this.options.address || MULTICAST_ADDRESS
		const port = this.options.port > 0 ? this.options.port : MULTICAST_PORT

		let socket: dgram.Socket

		try {
			socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
		} catch (error) {
			this.options.log('error', `Could not create the notification listener: ${(error as Error).message}`)
			return
		}

		this.socket = socket

		socket.on('error', (error) => {
			this.options.log('error', `Notification listener error: ${error.message}`)
			this.stop()
		})

		socket.on('listening', () => {
			try {
				// An empty interface lets the OS choose. On a machine with several NICs - a control network
				// and a Dante network, say - that choice is often wrong, so it can be pinned in the config.
				const iface = this.options.interface.trim()

				if (iface !== '') {
					socket.addMembership(address, iface)
				} else {
					socket.addMembership(address)
				}

				this.options.log('debug', `Listening for notifications on ${address}:${port}${iface ? ` via ${iface}` : ''}`)
			} catch (error) {
				this.options.log(
					'error',
					`Could not join the notification multicast group ${address}: ${(error as Error).message}`,
				)
				this.stop()
			}
		})

		socket.on('message', (message, remote) => {
			// Several mixers can share one multicast group, so only take notifications from the one we control.
			if (this.options.host && remote.address !== this.options.host) {
				return
			}

			this.handleDatagram(message.toString('utf8'))
		})

		try {
			socket.bind(port)
		} catch (error) {
			this.options.log('error', `Could not bind the notification listener to port ${port}: ${(error as Error).message}`)
			this.stop()
		}
	}

	handleDatagram(payload: string): void {
		for (const frame of payload.split(CONTROL_END)) {
			if (frame.trim() === '') {
				continue
			}

			try {
				this.options.processFrame(frame)
			} catch (error) {
				this.options.log('error', `Error processing notification '${frame.trim()}': ${(error as Error).message}`)
			}
		}
	}

	stop(): void {
		if (this.socket === undefined) {
			return
		}

		const socket = this.socket
		this.socket = undefined

		try {
			socket.close()
		} catch {
			// already closed
		}
	}
}
