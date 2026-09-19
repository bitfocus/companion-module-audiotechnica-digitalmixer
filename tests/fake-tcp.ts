import { EventEmitter } from 'events'
import { InstanceStatus } from '@companion-module/base'
import type { LinkSocket } from '../src/link.js'

/**
 * A stand-in for TCPHelper. The real one reconnects on its own for as long as it is alive, so what the
 * link tests care about is whether the module lets it stay alive.
 */
export class FakeTCP extends EventEmitter implements LinkSocket {
	static instances: FakeTCP[] = []

	isConnected = false
	isDestroyed = false
	sent: string[] = []

	constructor(
		readonly host: string,
		readonly port: number,
	) {
		super()
		FakeTCP.instances.push(this)
	}

	static reset(): void {
		FakeTCP.instances = []
	}

	static get latest(): FakeTCP {
		const socket = FakeTCP.instances.at(-1)

		if (socket === undefined) {
			throw new Error('no socket was created')
		}

		return socket
	}

	/** Bring the link up the way the real helper does. */
	open(): void {
		this.isConnected = true
		this.emit('status_change', InstanceStatus.Ok, undefined)
		this.emit('connect')
	}

	fail(message: string): void {
		this.isConnected = false
		this.emit('error', new Error(message))
	}

	reply(frame = 'g_firmware_version O 0000 00 NC 1.0.0 \r'): void {
		this.emit('data', Buffer.from(frame))
	}

	send(message: string | Buffer): boolean {
		this.sent.push(message.toString())
		return this.isConnected
	}

	destroy(): void {
		this.isConnected = false
		this.isDestroyed = true
		this.removeAllListeners()
	}
}
