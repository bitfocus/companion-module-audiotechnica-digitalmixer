export const CONTROL_MODELID = '0000'
export const CONTROL_UNITNUMBER = '00'
export const CONTROL_CONTINUESELECT = 'NC'
export const CONTROL_ACK = 'ACK'
export const CONTROL_NAK = 'NAK'
export const CONTROL_END = '\r'

/** Defaults from the protocol specification; the mixer lets both be changed. */
export const MULTICAST_ADDRESS = '225.0.0.100'
export const MULTICAST_PORT = 17000

export function buildCommand(cmd: string, handshake: string, params: string): string {
	return (
		cmd +
		' ' +
		handshake +
		' ' +
		CONTROL_MODELID +
		' ' +
		CONTROL_UNITNUMBER +
		' ' +
		CONTROL_CONTINUESELECT +
		' ' +
		params +
		' ' +
		CONTROL_END
	)
}

/** Error codes from the protocol specification, table 2-6. */
const ERROR_CODES: Record<string, string> = {
	'01': 'Syntax error - a required element is missing, malformed, or the message is too long',
	'02': 'Invalid command - the command does not exist or is not supported by this device',
	'03': 'Divided message transmission error - a split message was not completed',
	'04': 'Parameter error - an invalid channel, an out of range value, or a parameter that cannot be changed right now',
	'90': 'Busy - the device could not process the command',
	'92': 'Busy - the device is saving settings',
	'93': 'Busy - the device is in Extension mode',
	'99': 'Other error',
}

export function describeError(response: string): string {
	const errorCode = response.split(' ')[2]

	return ERROR_CODES[errorCode] ?? `Unknown error code '${errorCode}'`
}

/** A busy reply means the mixer is saturated rather than that the command was wrong. */
export function isBusyError(response: string): boolean {
	const errorCode = response.trim().split(' ')[2]

	return errorCode === '90' || errorCode === '92' || errorCode === '93'
}
