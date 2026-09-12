import type { CompanionPresetDefinitions, CompanionPresetSection } from '@companion-module/base'
import type ModuleInstance from './main.js'
import type { ModuleSchema } from './main.js'

export function UpdatePresets(self: ModuleInstance): void {
	const structure: CompanionPresetSection[] = []
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}

	self.setPresetDefinitions(structure, presets)
}
