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

		//console.log('builtCmd: ' + builtCmd);
		return builtCmd
	},

	processError(response) {

		let errorReturn = response.split(' ');

		let errorCode = errorReturn[2];

		// Error codes from the protocol specification, table 2-6.
		const ERROR_CODES = {
			'01': 'Syntax error - a required element is missing, malformed, or the message is too long',
			'02': 'Invalid command - the command does not exist or is not supported by this device',
			'03': 'Divided message transmission error - a split message was not completed',
			'04': 'Parameter error - an invalid channel, an out of range value, or a parameter that cannot be changed right now',
			'90': 'Busy - the device could not process the command',
			'92': 'Busy - the device is saving settings',
			'93': 'Busy - the device is in Extension mode',
			'99': 'Other error',
		}

		let errorType = ERROR_CODES[errorCode] || `Unknown error code '${errorCode}'`;

		this.log('error', `Error: ${response} Error type: ${errorType}`);
	}
}