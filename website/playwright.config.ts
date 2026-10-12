import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4322', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'small-mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 700 } } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4322 --ignore-lock',
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: !process.env.CI,
  },
});