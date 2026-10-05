import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.MORE_TEST_URL ?? "http://127.0.0.1:3001",
    channel: "chrome",
    screenshot: "only-on-failure",
  },
});
