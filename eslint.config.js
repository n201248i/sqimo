import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'

const environment = process.env.NODE_ENV || 'development'

const levels = {
	production: 'error',
	development: 'warn',
}

const level = levels[environment]

const defaultRules = () => {
	const rules =  {
		'no-unused-vars': 'off',
		'no-undef': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
		'padded-blocks': ['error', 'never'],
		'padding-line-between-statements': [
			'error',
			{
				blankLine: 'always',
				prev: ['if', 'class', 'function', 'const', 'let', 'var'],
				next: ['if', 'class', 'function', 'return']
			}
		],

		'no-multiple-empty-lines': [
			'error',
			{
				  max: 1,
				  maxEOF: 0,
				  maxBOF: 0
			}
		],

		'no-trailing-spaces': 'error',
		'indent': ['error', 'tab'],
		'semi': ['error', 'never'],
		'quotes': ['warn', 'single'],
	}

	return rules
}

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
		languageOptions: {
			globals: {...globals.browser, ...globals.node},
			parser: tseslint.parser,
			parserOptions: {
				ecmaVersion: 2024,
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true
				}
			}
		},
		settings: {
			react: {
				version: 'detect'
			}
		},
		plugins: {
			'@typescript-eslint': tseslint.plugin,
			react: pluginReact
		},
		rules: {
			...pluginJs.configs.recommended.rules,
			...tseslint.configs.recommended[0].rules,
			...pluginReact.configs.flat.recommended.rules,
			...defaultRules()
		}
	}
]