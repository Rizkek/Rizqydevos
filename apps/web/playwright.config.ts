import { defineConfig } from '@playwright/test'

// Runs against a production build (`bun run build`), the same way performance is measured.
// Uses the system Chrome so no browser download is needed.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    channel: 'chrome',
  },
  webServer: {
    command: 'bun run start -- -p 3100',
    url: 'http://127.0.0.1:3100/login',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
