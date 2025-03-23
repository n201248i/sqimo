import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'

export default defineConfig([
	{ files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
	{ files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'], languageOptions: { globals: {...globals.browser, ...globals.node} } },
	{ files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'], plugins: { js }, extends: ['js/recommended'] },
	tseslint.configs.recommended,
	pluginReact.configs.flat.recommended,
	{

		'settings': {
			'react': {
				'createClass': 'createReactClass', // Regex for Component Factory to use,
				// default to "createReactClass"
				'pragma': 'React',  // Pragma to use, default to "React"
				'fragment': 'Fragment',  // Fragment to use (may be a property of <pragma>), default to "Fragment"
				'version': 'detect', // React version. "detect" automatically picks the version you have installed.
				// You can also use `16.0`, `16.3`, etc, if you want to override the detected value.
				// Defaults to the "defaultVersion" setting and warns if missing, and to "detect" in the future
				'defaultVersion': '', // Default React version to use when the version you have installed cannot be detected.
				// If not provided, defaults to the latest React version.
				'flowVersion': '0.53' // Flow version
			},
		}
	},
	{ 
		files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'], 
		rules: { 
			'semi': ['error', 'never'],
			'quotes': ['error', 'single'],
			'indent': ['error', 'tab'],
			'@typescript-eslint/no-explicit-any': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		} 
	}
])