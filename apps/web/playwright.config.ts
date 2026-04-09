import { defineConfig, devices } from "@playwright/test";
import testEnv from "./tests/load-test-env.cjs";

const { loadTestEnv } = testEnv;
loadTestEnv();

const e2ePort = Number.parseInt(process.env.PORT ?? "3100", 10);
const e2eBaseUrl = `http://localhost:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  outputDir: "test-results",
  use: {
    baseURL: e2eBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "node ./tests/scripts/run-next-with-test-env.cjs start",
    url: e2eBaseUrl,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      PORT: String(e2ePort),
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
