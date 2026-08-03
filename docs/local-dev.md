# Local development

```bash
make setup             # deps + .env + workers/.dev.vars
make d1-migrate-local  # seed the local database (once)
make run               # http://localhost:8787
```

`make run` serves the API and the built SPA from one origin, exactly like
production. For frontend hot reload, `cd frontend && npm run dev` in a second
shell (port 3000, `/api` proxied to the Worker).

## Env files

Two files, because two different things read them. `make env` creates both from
their committed examples and never overwrites one you have edited; both are
gitignored.

| File | Read by | Holds |
| --- | --- | --- |
| `workers/.dev.vars` | `wrangler dev`, injected as bindings on `env` | `ADMIN_TOKEN`, `NOTIFY_EMAIL_*` |
| `.env` | the Makefile, which includes and exports it | `CLOUDFLARE_*`, `WORKER_URL`, `ADMIN_TOKEN` for curl |

The committed examples work as-is: both ship the same placeholder `ADMIN_TOKEN`,
so `make admin-appointments` authenticates against `make run` with no editing.
Your real `.env` additionally holds the Cloudflare API token that `make deploy`
and `make d1-migrate` need. CI does not use it.

`ENV` and `BUSINESS_TZ` are plain vars in `wrangler.jsonc`, not secrets. The
frontend reads no `VITE_*` variables today.

## Tests

`make prep` runs everything. Worker tests use `@cloudflare/vitest-pool-workers`
against a local D1 seeded from `migrations/`; no network, no remote database.
