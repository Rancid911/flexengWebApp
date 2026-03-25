import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const useExternalServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER === "1";
const parsedBaseUrl = new URL(baseURL);
const webHost = parsedBaseUrl.hostname;
const webPort = parsedBaseUrl.port || (parsedBaseUrl.protocol === "https:" ? "443" : "80");
const webServerCommand = `npm run build && npm run start -- --hostname ${webHost} --port ${webPort}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: useExternalServer
    ? undefined
    : {
        command: webServerCommand,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
