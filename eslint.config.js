import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Calling a useCallback function from useEffect is a correct and intentional
      // React data-loading pattern. The rule incorrectly flags this as a problem.
      'react-hooks/set-state-in-effect': 'off',
      // Allow explicit `any` in limited cases — primarily Recharts formatter callbacks
      // which have complex union types that require explicit narrowing.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
