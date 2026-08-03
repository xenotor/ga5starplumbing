# Deployment

`.github/workflows/cloudflare-deploy.yml`:

- **every pull request** → `make prep` only.
- **merge to `main`** → `make prep`, then apply D1 migrations, sync Worker
  secrets, deploy. Pushes touching only `docs/**`, `todo.txt`, `README.md`, or
  `CLAUDE.md`/`AGENTS.md` run no job — prose never reaches the Worker bundle.

## Required secrets

GitHub `production` environment:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | deploy credential for **this project's** account |
| `CLOUDFLARE_ACCOUNT_ID` | `3424bc39…`, must match the pin in `wrangler.jsonc` |
| `ADMIN_TOKEN` | Bearer token for `/api/admin/*` |
| `NOTIFY_EMAIL_TO` / `_FROM` | optional; empty values are filtered out |
| `TURNSTILE_SECRET_KEY` | booking bot check; unset disables it ([booking-module.md](booking-module.md)) |

Set them from stdin, not `--body -`, which stores a literal `-`:

```bash
printf '%s' "$VALUE" | gh secret set NAME --env production
```

The workflow overwrites the Worker's `ADMIN_TOKEN` from the GitHub secret on
every deploy, so those two must agree.

## Manual deploy

`make deploy`. Requires `CLOUDFLARE_API_TOKEN` in `.env`.

## Token permissions

Deploying the Worker and running migrations needs Workers Scripts:Edit and
D1:Edit, both account-scoped. Managing DNS needs a **Zone** resource with
DNS:Edit — account permissions alone do not cover it. See
[cutover.md](cutover.md).
