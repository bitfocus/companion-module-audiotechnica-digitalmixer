import type { LogLevel } from '@companion-module/base'
import { CONTROL_ACK, CONTROL_END, CONTROL_NAK, buildCommand, isBusyError } from './utils.js'

export interface QueuedCommand {
	cmd: string
	handshake: string
	params: string
}

export interface CommandQueueOptions {
	/** Write a built command onto the wire. */
	write: (payload: string) => void
	isConnected: () => boolean
	/** Handle one complete response frame. May throw; the queue keeps going regardless. */
	processFrame: (frame: string) => void
	/** How many commands the user has allowed in flight. */
	pipelineDepth: () => number
	log: (level: LogLevel, message: string) => void
	/** Called when a command is queued while the socket is not open. */
	onNotConnected: () => void
}

/**
 * The mixer processes commands asynchronously and says so explicitly: "The next command can be sent
 * without waiting for ACK/NAK and Answer" (spec 4.1). Several commands are therefore kept in flight at
 * once, which is what stops a 200 request poll of an ATDM-1012 taking half a second of round trips.
 *
 * Button actions are held in their own queue and always drained first, so a press never waits behind a
 * poll batch.
 */
export class CommandQueue {
	/** The mixer answers in about a millisecond, so anything near this means the response was lost. */
	static readonly RESPONSE_TIMEOUT = 5000
	static readonly PIPELINE_DEPTH_MAX = 32
	static readonly BUSY_BACKOFF = 2000

	private readonly options: CommandQueueOptions

	private actionQueue: QueuedCommand[] = []
	private pollQueue: QueuedCommand[] = []
	private pending: QueuedCommand[] = []
	private receiveBuffer = ''
	private busyBackoffUntil = 0
	private responseTimer: NodeJS.Timeout | undefined

	lastReturnedCommand: QueuedCommand | undefined

	constructor(options: CommandQueueOptions) {
		this.options = options
	}

	get pollQueueLength(): number {
		return this.pollQueue.length
	}

	reset(): void {
		this.actionQueue = []
		this.pollQueue = []
		this.pending = []
		this.receiveBuffer = ''
		this.busyBackoffUntil = 0

		this.clearResponseTimeout()
	}

	/** Queue a command. Button actions default to the priority queue; polling passes 'low'. */
	send(cmd: string, handshake: string, params: string, priority: 'high' | 'low' = 'high'): void {
		const entry: QueuedCommand = { cmd, handshake, params }

		if (priority === 'low') {
			this.pollQueue.push(entry)
		} else {
			this.actionQueue.push(entry)
		}

		this.processQueue()
	}

	poll(cmd: string, handshake: string, params: string): void {
		this.send(cmd, handshake, params, 'low')
	}

	/**
	 * How many commands may be outstanding at once. The mixer answers a NAK 90 (Busy) when it cannot keep
	 * up, so the window drops to one on every busy reply and recovers once they stop.
	 */
	private windowSize(): number {
		if (Date.now() < this.busyBackoffUntil) {
			return 1
		}

		return Math.max(1, Math.min(this.options.pipelineDepth(), CommandQueue.PIPELINE_DEPTH_MAX))
	}

	private processQueue(): void {
		while (this.pending.length < this.windowSize()) {
			const next = this.actionQueue.length > 0 ? this.actionQueue.shift() : this.pollQueue.shift()

			if (next === undefined) {
				return
			}

			this.pending.push(next)
			this.runCommand(next)
		}

		this.startResponseTimeout()
	}

	private runCommand(entry: QueuedCommand): void {
		if (this.options.isConnected()) {
			this.options.write(buildCommand(entry.cmd, entry.handshake, entry.params))
		} else {
			this.options.log('error', 'Network error: Connection to Device not opened.')
			this.options.onNotConnected()
		}
	}

	/**
	 * Frames are CR terminated. A single socket read can hold several of them, or half of one, so keep
	 * whatever follows the last CR and wait for the rest of it.
	 */
	handleIncoming(chunk: string): void {
		this.receiveBuffer += chunk

		const frames = this.receiveBuffer.split(CONTROL_END)
		this.receiveBuffer = frames.pop() ?? ''

		for (const frame of frames) {
			if (frame === '') {
				continue
			}

			// A failure while parsing one frame must not stop the queue from advancing.
			try {
				if (frame.includes(CONTROL_NAK)) {
					if (isBusyError(frame)) {
						this.busyBackoffUntil = Date.now() + CommandQueue.BUSY_BACKOFF
					}

					this.options.processFrame(frame)
				} else if (!frame.includes(CONTROL_ACK)) {
					// ACKs only confirm receipt, there is nothing to process
					this.options.processFrame(frame)
				}
			} catch (error) {
				this.options.log('error', `Error processing response '${frame.trim()}': ${(error as Error).message}`)
			}

			this.frameReceived(frame)
		}
	}

	/**
	 * Release the oldest command matching this frame. Replies come back in the order the commands were
	 * sent, but matching on the command name rather than position means an unsolicited notification -
	 * which carries a name we are not waiting on - cannot release anything.
	 */
	private frameReceived(frame: string): void {
		if (this.pending.length === 0) {
			return
		}

		const category = frame.trim().split(' ')[0].toLowerCase()
		const index = this.pending.findIndex((entry) => entry.cmd.toLowerCase() === category)

		if (index === -1) {
			return
		}

		this.lastReturnedCommand = this.pending[index]
		this.pending.splice(index, 1)

		this.clearResponseTimeout()
		this.processQueue()
	}

	private startResponseTimeout(): void {
		this.clearResponseTimeout()

		if (this.pending.length === 0) {
			return
		}

		this.responseTimer = setTimeout(() => {
			this.responseTimer = undefined

			// Drop everything outstanding and keep going, otherwise one lost response stalls the module
			// for good.
			const timedOut = this.pending

			this.pending = []

			if (timedOut.length > 0) {
				this.options.log(
					'warn',
					`No response to '${timedOut[0].cmd}' within ${CommandQueue.RESPONSE_TIMEOUT}ms, continuing.`,
				)
			}

			this.processQueue()
		}, CommandQueue.RESPONSE_TIMEOUT)
	}

	clearResponseTimeout(): void {
		if (this.responseTimer !== undefined) {
			clearTimeout(this.responseTimer)
			this.responseTimer = undefined
		}
	}
}
