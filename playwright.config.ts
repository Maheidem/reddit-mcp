import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  timeout: 90_000,
  retries: 0,
  workers: 1, // Sequential — we create/delete shared Reddit content
  use: {
    browserName: "chromium",
    headless: true,
    // Realistic user-agent to avoid Reddit's anti-bot blocking
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    // Reddit pages can be slow to render
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    // Reduce headless detection
    launchOptions: {
      args: ["--disable-blink-features=AutomationControlled"],
    },
  },
});
