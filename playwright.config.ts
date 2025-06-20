import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npx next dev -p 3000',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
});
