import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { E2E_TIMEZONE } from "./e2e/constants";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  testDir: "./e2e/preview",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["html", { open: "on-failure" }]],
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:5555",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    viewport: { width: 1280, height: 720 },
    timezoneId: E2E_TIMEZONE,
    ignoreHTTPSErrors: true,
    actionTimeout: 15 * 1000,
    navigationTimeout: 15 * 1000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "corepack pnpm run build && corepack pnpm exec vite preview --host 127.0.0.1 --port 5555",
    url: "http://127.0.0.1:5555",
    reuseExistingServer: false,
    timeout: 420 * 1000,
    stdout: "ignore",
    stderr: "pipe",
  },
  outputDir: "test-results-preview",
});
