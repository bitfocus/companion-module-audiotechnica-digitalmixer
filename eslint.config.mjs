import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableTypescript: true,
})

export default [
	...baseConfig,
	{
		// Test files and the vitest config legitimately import devDependencies.
		files: ['tests/**/*.ts', 'vitest.config.ts'],
		rules: {
			'n/no-unpublished-import': 'off',
		},
	},
]
