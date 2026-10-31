import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: './',
    include: ['src/**/*.spec.ts'],
    // HTTP specs boot a Nest app and open a socket; under `turbo test` (web and api in parallel)
    // the first boot exceeded the 5 s default, which made throttling.http.spec.ts flaky.
    testTimeout: 20_000,
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
})