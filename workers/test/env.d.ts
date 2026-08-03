import type { D1Migration } from "@cloudflare/vitest-pool-workers";
import type { Env as WorkerEnv } from "../src/env";

// `cloudflare:test` types its `env` as `Cloudflare.Env`; widening that global
// namespace is what gives the suite typed bindings.
declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}

export {};
