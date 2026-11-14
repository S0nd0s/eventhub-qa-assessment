import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { env, authFiles, UserRole } from './src/config/env';

/**
 * Projects:
 *  - setup:  logs both permanent users in ONCE and saves their sessions (tests/auth.setup.ts)
 *  - e2e:    functional browser tests (main, edge, error scenarios) as the primary user
 *  - api:    pure HTTP tests, no browser
 *  - cleanup: runs last and deletes any test event an interrupted run left behind
 *  - visual: screenshot comparison against committed baselines, as the secondary (clean) user
 * Tests never log in themselves.
 */

// Declares the custom `userRole` option so it can be set per project.
type Options = { userRole: UserRole };

// Screenshot baselines are tied to the operating system's font rendering, so there is one
// set per platform (tests/visual/__screenshots__/win32, .../linux).
// On CI the visual project runs only when baselines for that platform are committed,
// or when VISUAL=1 is set (used by the workflow that generates them). Locally it always runs.
const baselinesExist = fs.existsSync(path.join(__dirname, 'tests/visual/__screenshots__', process.platform));
const runVisual = !process.env.CI || baselinesExist || process.env.VISUAL === '1';

export default defineConfig<Options>({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2, // shared public environment — stay polite
  timeout: 60_000, // the shared server is sometimes slow; 30s was not enough for multi-step flows
  // The app shows a loading state for several seconds under load; the 5s default is too tight.
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.01, stylePath: './tests/visual/screenshot.css' },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{arg}{ext}',
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: env.baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, teardown: 'cleanup' },
    { name: 'cleanup', testMatch: /cleanup\.teardown\.ts/ },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], userRole: 'primary', storageState: authFiles.storageState('primary') },
    },
    {
      name: 'api',
      testDir: './tests/api',
      dependencies: ['setup'],
      use: { userRole: 'primary' },
    },
    ...(runVisual
      ? [
          {
            name: 'visual',
            testDir: './tests/visual',
            dependencies: ['setup'],
            use: {
              ...devices['Desktop Chrome'],
              viewport: { width: 1280, height: 900 },
              userRole: 'secondary' as UserRole,
              storageState: authFiles.storageState('secondary'),
            },
          },
        ]
      : []),
  ],
});
