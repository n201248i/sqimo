import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
const a = 'b'
export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'], plugins: { js }, extends: ['js/recommended'] },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  { 
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'], 
    rules: { 
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'], 
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    } 
  }
])