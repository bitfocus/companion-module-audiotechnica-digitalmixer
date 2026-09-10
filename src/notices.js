const dgram = require('dgram')

module.exports = {
	/**
	 * State changes made at the mixer's front panel, from Web Remote or by another controller are pushed
	 * as notices over UDP multicast (protocol spec chapter 5), not over the TCP control socket. Listening
	 * for them is what keeps feedbacks honest between polls - without it the only way to notice an
	 * external change is to poll for it.
	 *
	 * Notices are only sent when 'IP Control Settings > Notification' is enabled on the mixer, which is
	 * off by default. Level meter notices additionally need 'Audio Level Notification'.
	 */
	initNotices() {
		if (this.noticeSocket !== undefined) {
			this.stopNotices()
		}

		if (this.config.notices !== true) {
			return
		}

		const address = this.config.multicast_address || this.MULTICAST_ADDRESS
		const port = this.config.multicast_port > 0 ? this.config.multicast_port : this.MULTICAST_PORT

		let socket

		try {
			socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
		}
		catch (error) {
			this.log('error', `Could not create the notice listener: ${error.message}`)
			return
		}

		this.noticeSocket = socket

		socket.on('error', (error) => {
			this.log('error', `Notice listener error: ${error.message}`)
			this.stopNotices()
		})

		socket.on('listening', () => {
			try {
				// An empty interface lets the OS choose. On a machine with several NICs - a control network
				// and a Dante network, say - that choice is often wrong, so it can be pinned in the config.
				const iface = this.config.multicast_interface ? this.config.multicast_interface.trim() : ''

				if (iface !== '') {
					socket.addMembership(address, iface)
				}
				else {
					socket.addMembership(address)
				}

				this.log('debug', `Listening for notices on ${address}:${port}${iface !== '' ? ` via ${iface}` : ''}`)
			}
			catch (error) {
				this.log('error', `Could not join the notice multicast group ${address}: ${error.message}`)
				this.stopNotices()
			}
		})

		socket.on('message', (message, remote) => {
			// Several mixers can share one multicast group, so only take notices from the one we control.
			if (this.config.host && remote.address !== this.config.host) {
				return
			}

			this.handleNotice(message.toString('utf8'))
		})

		try {
			socket.bind(port)
		}
		catch (error) {
			this.log('error', `Could not bind the notice listener to port ${port}: ${error.message}`)
			this.stopNotices()
		}
	},

	handleNotice(payload) {
		for (const frame of payload.split(this.CONTROL_END)) {
			if (frame.trim() === '') {
				continue
			}

			try {
				this.processResponse(frame)
			}
			catch (error) {
				this.log('error', `Error processing notice '${frame.trim()}': ${error.message}`)
			}
		}
	},

	stopNotices() {
		if (this.noticeSocket === undefined) {
			return
		}

		const socket = this.noticeSocket
		this.noticeSocket = undefined

		try {
			socket.close()
		}
		catch (error) {
			// already closed
		}
	},

	/**
	 * Level meter notices are only sent while an interval is set, and the mixer keeps that setting, so ask
	 * for the rate we want once we are connected rather than relying on whatever was left behind.
	 */
	applyLevelMeterInterval() {
		if (this.config.notices !== true || this.config.level_meters !== true) {
			return
		}

		const interval = this.config.level_meter_interval > 0 ? this.config.level_meter_interval : 100

		this.sendCommand('s_level_meter_interval', 'S', `${interval}`)
	},
}
