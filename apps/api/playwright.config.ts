import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/routes/__tests__',
  timeout: 30_000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  globalSetup: './src/routes/__tests__/global-setup',
});
