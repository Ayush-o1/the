import { defineConfig, devices } from '@playwright/test';

// Tests run against the built site served by `vite preview`, the same files that get deployed.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  // Software-rendered WebGL is slow, so assertions about the flight get longer to settle.
  expect: { timeout: 15_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173/' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      // Software GL flags so headless Chromium can run WebGL. See docs/DECISIONS.md D16.
      use: {
        ...devices['Desktop Chrome'],
        // SwiftShader is a software renderer, which the site would send to the plain page. The
        // flight tests need the flight, so this project starts with the saved choice a visitor
        // makes with the "Start the flight" toggle.
        storageState: {
          cookies: [],
          origins: [
            { origin: 'http://localhost:4173', localStorage: [{ name: 'ak-lite', value: '0' }] },
          ],
        },
        launchOptions: {
          args: [
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
