module.exports = {
	/**
	 * The mixer processes commands asynchronously and says so explicitly: "The next command can be sent
	 * without waiting for ACK/NAK and Answer" (spec 4.1). Several commands are therefore kept in flight at
	 * once, which is what stops a 200 request poll of an ATDM-1012 taking half a second of round trips.
	 *
	 * Button actions are still held in their own queue and always drained first, so a press never waits
	 * behind a poll batch.
	 */
	resetQueues() {
		this.actionQueue = []
		this.pollQueue = []
		this.pending = []
		this.receiveBuffer = ''
		this.busyBackoffUntil = 0

		this.clearResponseTimeout()
	},

	sendCommand(cmd, handshake, params, priority = 'high') {
		if (cmd === undefined) {
			return
		}

		const entry = { cmd: cmd, handshake: handshake, params: params }

		if (priority === 'low') {
			this.pollQueue.push(entry)
		}
		else {
			this.actionQueue.push(entry)
		}

		this.processQueue()
	},

	pollCommand(cmd, handshake, params) {
		this.sendCommand(cmd, handshake, params, 'low')
	},

	/**
	 * How many commands may be outstanding at once. The mixer answers a NAK 90 (Busy) when it cannot keep
	 * up, so the window is halved on every busy reply and recovers slowly once they stop.
	 */
	windowSize() {
		if (Date.now() < this.busyBackoffUntil) {
			return 1
		}

		const configured = this.config.pipeline_depth > 0 ? this.config.pipeline_depth : this.PIPELINE_DEPTH

		return Math.max(1, Math.min(configured, this.PIPELINE_DEPTH_MAX))
	},

	processQueue() {
		while (this.pending.length < this.windowSize()) {
			const next = this.actionQueue.length > 0 ? this.actionQueue.shift() : this.pollQueue.shift()

			if (next === undefined) {
				return
			}

			this.pending.push(next)
			this.runCommand(next.cmd, next.handshake, next.params)
		}

		this.startResponseTimeout()
	},

	/**
	 * A busy reply means the mixer is saturated. Drop to one command in flight for a moment rather than
	 * hammering it, then let the window come back.
	 */
	noteBusy() {
		this.busyBackoffUntil = Date.now() + this.BUSY_BACKOFF
	},

	runCommand(cmd, handshake, params) {
		if (this.socket !== undefined && this.socket.isConnected) {
			this.socket.send(this.buildCommand(cmd, handshake, params))
			.catch((error) => {
				this.log('error', 'Network error sending command: ' + error.message)
			});
		}
		else {
			this.log('error', 'Network error: Connection to Device not opened.')
			this.stopPolling()
		}
	},

	/**
	 * Frames are CR terminated. A single socket read can hold several of them, or half of one, so keep
	 * whatever follows the last CR and wait for the rest of it.
	 */
	handleIncoming(chunk) {
		this.receiveBuffer += chunk

		const frames = this.receiveBuffer.split(this.CONTROL_END)
		this.receiveBuffer = frames.pop()

		for (const frame of frames) {
			if (frame === '') {
				continue
			}

			// A failure while parsing one frame must not stop the queue from advancing.
			try {
				if (frame.includes(this.CONTROL_NAK)) { // NAKs are sent on error, let's see what error we got
					const errorCode = frame.trim().split(' ')[2]

					if (errorCode === '90' || errorCode === '92' || errorCode === '93') {
						this.noteBusy()
					}

					this.processError(frame)
				}
				else if (!frame.includes(this.CONTROL_ACK)) { // ACKs only confirm receipt, there is nothing to process
					this.processResponse(frame)
				}
			}
			catch (error) {
				this.log('error', `Error processing response '${frame.trim()}': ${error.message}`)
			}

			this.frameReceived(frame)
		}
	},

	/**
	 * Release the oldest command matching this frame. Replies come back in the order the commands were
	 * sent, but matching on the command name rather than position means an unsolicited notice - which
	 * carries a name we are not waiting on - cannot release anything.
	 */
	frameReceived(frame) {
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
	},

	startResponseTimeout() {
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
				this.log('warn', `No response to '${timedOut[0].cmd}' within ${this.RESPONSE_TIMEOUT}ms, continuing.`)
			}

			this.processQueue()
		}, this.RESPONSE_TIMEOUT)
	},

	clearResponseTimeout() {
		if (this.responseTimer !== undefined) {
			clearTimeout(this.responseTimer)
			this.responseTimer = undefined
		}
	},
}
