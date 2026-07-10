import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/setup/global-setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 60_000,
    // Serialize: shared test DB + shared rate-limit buckets on the single server
    // process make parallel test files risk cross-talk. fileParallelism: false
    // also forces maxWorkers to 1 (Vitest 4 dropped poolOptions.forks.singleFork).
    fileParallelism: false,
    pool: "forks",
  },
});
