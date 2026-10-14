import { configDefaults, defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  // Match Next's automatic JSX runtime so components under test do not need `import React`.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    // Playwright owns e2e/; Vitest must not try to run those files.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
