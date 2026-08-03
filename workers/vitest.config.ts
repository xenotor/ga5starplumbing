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
        // NOTIFY_EMAIL_TO is blanked so the suite sends no mail by default —
        // .dev.vars would otherwise leak a recipient in and every booking test
        // would dump a message file. The notification tests set it themselves.
        bindings: {
          TEST_MIGRATIONS: migrations,
          ADMIN_TOKEN: "test-admin-token",
          NOTIFY_EMAIL_TO: "",
          NOTIFY_EMAIL_FROM: "",
        },
      },
    }),
  ],
  test: {
    setupFiles: ["./test/setup.ts"],
  },
});
