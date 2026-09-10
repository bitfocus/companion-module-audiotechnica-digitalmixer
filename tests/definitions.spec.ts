import { describe, expect, test } from 'vitest'
import { makeInstance } from './helpers.js'
import { MODELS } from '../src/models.js'

const MODEL_IDS = MODELS.map((model) => model.id)

// These caught two id collisions in the FBS action that had shipped unnoticed.
describe('definition structure', () => {
	test.each(MODEL_IDS)('%s gives every action option its own id', (model) => {
		const h = makeInstance(model)

		for (const [name, definition] of Object.entries(h.actions)) {
			if (!definition) continue

			const ids = (definition.options ?? []).map((option: any) => option.id)
			expect(new Set(ids).size, `${name} has duplicate option ids: ${ids.join(', ')}`).toBe(ids.length)
		}
	})

	test.each(MODEL_IDS)('%s gives every dropdown choice its own id', (model) => {
		const h = makeInstance(model)

		for (const [name, definition] of Object.entries(h.actions)) {
			if (!definition) continue

			for (const option of definition.options ?? []) {
				if (!option.choices) continue

				const ids = option.choices.map((choice: any) => choice.id)
				expect(new Set(ids).size, `${name}.${option.id} has duplicate choice ids`).toBe(ids.length)
			}
		}
	})

	test.each(MODEL_IDS)('%s exposes one FBS band option per band', (model) => {
		const h = makeInstance(model)
		const ids = h.actions['fbs'].options.map((option: any) => option.id)

		expect(ids).toEqual([
			'channel',
			'processing_type',
			'enable',
			...Array.from({ length: 8 }, (_, i) => `band${i + 1}`),
		])
	})
})
