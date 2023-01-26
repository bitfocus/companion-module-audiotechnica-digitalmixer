module.exports = {
	buildCommand(cmd, handshake, params) {
		let builtCmd = ''

		builtCmd += cmd
				+ ' '
				+ handshake
				+ ' '
				+ this.CONTROL_MODELID
				+ ' '
				+ this.CONTROL_UNITNUMBER
				+ ' '
				+ this.CONTROL_CONTINUESELECT
				+ ' '
				+ params
				+ ' '
				+ this.CONTROL_END;

		console.log('builtCmd: ' + builtCmd);
		return builtCmd
	},

	processError(response) {

		let errorReturn = response.split(' ');

		let errorCode = errorReturn[2];

		let errorType = '';

		switch(errorCode) {
			case '01': // Grammar error
				break
			case '02': // Invalid command
				break
			case '03': // Divided Transmission error
				break
			case '04': // Parameter error
				errorType = 'Parameter error';
				break
			case '05': // Transmit timeout
				break
			case '90': // Busy
				break
			case '92': // Busy (Safe Mode)
				break
			case '93': // Busy (Extension)
				break
			case '99': // Other
				break
		}

		this.log('error', `Error: ${response} Error type: ${errorType}`);
	}
}