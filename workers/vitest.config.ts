import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// Hermetic: every test worker gets an isolated local D1 seeded from migrations/,
// so the suite needs no network and no remote database.
const migrations = await readD1Migrations(path.join(import.meta.dirname, "migrations"));

export default defineConfig({
  plugins: [
    cloudflareTest({
      singleWorker: true,
      isolatedStorage: true,
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        compatibilityFlags: ["nodejs_compat"],
        bindings: { TEST_MIGRATIONS: migrations, ADMIN_TOKEN: "test-admin-token" },
      },
    }),
  ],
  test: {
    setupFiles: ["./test/setup.ts"],
  },
});
