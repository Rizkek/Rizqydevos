import tsPlugin from '@typescript-eslint/eslint-plugin'

// Minimal config built only from packages already installed (no @eslint/js or typescript-eslint meta package).
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['src/**/*.ts'],
    rules: {
      // Controllers take `_userId` to keep the route scoped to a session without using the value.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Existing `any` is tracked as debt (AGENTS.md section 9); warn so new code is visible without blocking.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
