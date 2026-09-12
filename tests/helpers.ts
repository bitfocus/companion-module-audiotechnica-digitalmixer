import { vi } from 'vitest'
import type ModuleInstance from '../src/main.js'
import type { ModuleConfig } from '../src/config.js'
import { getModel } from '../src/models.js'
import { createState } from '../src/state.js'
import { UpdateActions } from '../src/actions.js'
import { UpdateFeedbacks } from '../src/feedbacks.js'
import { UpdateVariableDefinitions, checkVariables } from '../src/variables.js'

export interface TestInstance {
	instance: ModuleInstance
	sent: [string, string, string][]
	logs: { level: string; message: string }[]
	variableValues: Record<string, unknown>
	actions: Record<string, any>
	feedbacks: Record<string, any>
	fireAction: (name: string, overrides?: Record<string, unknown>) => void
	checkVariables: () => void
}

/**
 * A stand-in for the real instance. Everything the definition builders touch is provided; the socket,
 * polling and notification listener are not, since those are covered separately.
 */
export function makeInstance(model: string, config: Partial<ModuleConfig> = {}): TestInstance {
	const sent: [string, string, string][] = []
	const logs: { level: string; message: string }[] = []
	const variableValues: Record<string, unknown> = {}
	let actions: Record<string, any> = {}
	let feedbacks: Record<string, any> = {}

	const self: any = {
		config: { model, host: '', port: 17300, ...config },
		model: getModel(model),
		state: createState(getModel(model)),
		log: (level: string, message: string) => logs.push({ level, message }),
		sendCommand: (cmd: string, handshake: string, params: string) => sent.push([cmd, handshake, params]),
		pollCommand: (cmd: string, handshake: string, params: string) => sent.push([cmd, handshake, params]),
		requestUiUpdate: vi.fn(),
		setActionDefinitions: (defs: Record<string, any>) => (actions = defs),
		setFeedbackDefinitions: (defs: Record<string, any>) => (feedbacks = defs),
		setVariableDefinitions: vi.fn(),
		setVariableValues: (values: Record<string, unknown>) => Object.assign(variableValues, values),
		setPresetDefinitions: vi.fn(),
		checkFeedbacks: vi.fn(),
	}

	// the optimistic state helpers the actions call
	self.setOutputMuteState = (channel: string | number, mute: boolean) => {
		const id = String(channel)
		const existing = self.state.output_mutes.find((c: any) => c.id === id)
		if (existing) existing.mute = mute
		else self.state.output_mutes.push({ id, mute })
		self.requestUiUpdate()
	}
	self.setInputMuteState = (channel: string | number, mute: boolean) => {
		const id = String(channel)
		const existing = self.state.input_gain_levels.find((c: any) => c.id === id)
		if (existing) existing.mute = mute
		else self.state.input_gain_levels.push({ id, mute })
		self.requestUiUpdate()
	}
	self.setOperatorFaderMuteState = (page: string | number, fader: string | number, mute: boolean) => {
		const index = Number(page) - 1
		if (!self.state.operator_page[index]) return
		self.state.operator_page[index][`fader_${fader}_mute`] = mute
		self.requestUiUpdate()
	}
	self.setArrayMicMuteState = (mute: boolean) => {
		self.state.arraymic_mute = mute
		self.requestUiUpdate()
	}

	const instance = self as ModuleInstance

	UpdateActions(instance)
	UpdateFeedbacks(instance)
	UpdateVariableDefinitions(instance)

	return {
		instance,
		sent,
		logs,
		variableValues,
		get actions() {
			return actions
		},
		get feedbacks() {
			return feedbacks
		},
		fireAction: (name, overrides = {}) => {
			const definition = actions[name]
			if (!definition) throw new Error(`action '${name}' is not defined for ${model}`)
			const options: Record<string, unknown> = {}
			for (const option of definition.options ?? []) options[option.id] = option.default
			void definition.callback({ options: { ...options, ...overrides } })
		},
		checkVariables: () => checkVariables(instance),
	}
}
