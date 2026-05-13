import { defineConfig, devices } from "@playwright/test"

const devServerPort = 4174
const devServerUrl = `http://127.0.0.1:${devServerPort}`

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: devServerUrl,
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Emulator mode enables unauthenticated PrepTest UI preview (see `prep-test-ui-preview.ts`).
    command: `pnpm exec vite --mode emulator --host 127.0.0.1 --port ${devServerPort} --strictPort`,
    url: devServerUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
