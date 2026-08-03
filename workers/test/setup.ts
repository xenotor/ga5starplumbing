import { applyD1Migrations, env } from "cloudflare:test";

// Schema is applied once per worker; isolatedStorage rolls back per test.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
