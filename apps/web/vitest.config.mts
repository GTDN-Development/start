import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import testEnv from "./tests/load-test-env.cjs";

const { loadTestEnv } = testEnv;
loadTestEnv();

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/vitest/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/vitest/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    passWithNoTests: true,
  },
});
