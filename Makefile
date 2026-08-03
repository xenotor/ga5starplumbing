.PHONY: help env setup run build test prep frontend-install frontend-build d1-create d1-migrate d1-migrate-local secrets-push deploy admin-appointments ads-setup ads-test ads-report

.DEFAULT_GOAL := help

# Developer-machine settings (.env.example documents them). Exported so wrangler
# and curl below see them. Absent .env is fine: every target here works off an
# interactive `wrangler login`.
ifneq (,$(wildcard ./.env))
include .env
export
endif

WORKER_URL ?= http://localhost:8787

help:
	@echo "Georgia 5 Star Plumbing - React + Cloudflare Workers (TypeScript)"
	@echo ""
	@echo "Prerequisites:"
	@echo "  - Node.js 22+"
	@echo "  - wrangler authenticated: npx wrangler login (deploy only)"
	@echo ""
	@echo "Available targets:"
	@echo "  make env              - Create .env and workers/.dev.vars from the examples"
	@echo "  make run              - Build frontend + run Worker locally (wrangler dev)"
	@echo "  make test             - Run Worker tests (vitest)"
	@echo "  make prep             - Format check, lint, typecheck, test, build - run after changes"
	@echo "  make build            - Build frontend + dry-run Worker bundle"
	@echo "  make d1-create        - Create the D1 database (one-time)"
	@echo "  make d1-migrate       - Apply migrations to remote D1"
	@echo "  make d1-migrate-local - Apply migrations to the local dev D1"
	@echo "  make secrets-push     - Push workers/.dev.vars to the Worker"
	@echo "  make admin-appointments - List bookings at WORKER_URL using ADMIN_TOKEN"
	@echo "  make deploy           - Build + deploy the Worker (CI does this on merge)"
	@echo "  make ads-setup        - Install the Meta ads tooling in acquisitions/ (needs uv)"
	@echo "  make ads-test         - Lint + test the ads tooling (not part of prep)"
	@echo "  make ads-report       - Campaign efficiency report"
	@echo ""
	@echo "Local dev: http://localhost:8787 (wrangler dev serves API + built SPA)"

# Never clobber a filled-in file: these hold real tokens once you edit them.
.env:
	@cp .env.example .env && echo "Created .env from .env.example"

workers/.dev.vars:
	@cp workers/.dev.vars.example workers/.dev.vars && echo "Created workers/.dev.vars"

env: .env workers/.dev.vars
	@echo "Local environment ready. Edit .env and workers/.dev.vars as needed."

frontend/node_modules: frontend/package.json
	cd frontend && npm install
	@touch frontend/node_modules

workers/node_modules: workers/package.json
	cd workers && npm install
	@touch workers/node_modules

frontend-install: frontend/node_modules

frontend-build: frontend/node_modules
	@cd frontend && npm run build
	@echo "Frontend built to frontend/dist/"

run: frontend-build workers/node_modules workers/.dev.vars
	cd workers && npx wrangler dev

build: frontend-build workers/node_modules
	cd workers && npx wrangler deploy --dry-run

deploy: frontend-build workers/node_modules
	cd workers && npx wrangler deploy

# One-time resource provisioning. Paste the printed ID into workers/wrangler.jsonc.
d1-create:
	cd workers && npx wrangler d1 create ga5starplumbing

d1-migrate:
	cd workers && npx wrangler d1 migrations apply ga5starplumbing --remote

d1-migrate-local:
	cd workers && npx wrangler d1 migrations apply ga5starplumbing --local

# Push local Worker variables. Production deploys use GitHub Secrets.
secrets-push:
	@test -f workers/.dev.vars || { echo "Create workers/.dev.vars from workers/.dev.vars.example"; exit 1; }
	cd workers && npx wrangler secret bulk .dev.vars

# Hit the admin API by hand. Override either value inline:
#   make admin-appointments WORKER_URL=https://ga5starplumbing.georgia5starplumbing.workers.dev
admin-appointments:
	@test -n "$(ADMIN_TOKEN)" || { echo "ADMIN_TOKEN is unset — see .env.example"; exit 1; }
	@curl -sS "$(WORKER_URL)/api/admin/appointments" -H "authorization: Bearer $(ADMIN_TOKEN)"

test: workers/node_modules
	cd workers && npm run --silent test

# ALWAYS run prep after changes.
prep: workers/node_modules frontend/node_modules
	cd workers && npm run --silent format-check && npm run --silent lint && npm run --silent test
	@echo "Running frontend tests..."
	@cd frontend && npm run --silent test 2>&1 || { echo "Frontend tests failed!"; exit 1; }
	@echo "Building frontend..."
	@cd frontend && npm run --silent build

setup: workers/node_modules frontend/node_modules env
	@echo "Setup complete."

# Meta ads tooling (acquisitions/). Deliberately outside `prep` and outside the
# deploy workflow: it is a local Python CLI that never reaches the Worker, and
# CI should not need a Python toolchain to ship the site.
ads-setup:
	cd acquisitions && uv sync && { test -f .env || cp .env.example .env; }

ads-test:
	cd acquisitions && uv run ruff format --check . && uv run ruff check . && uv run pytest -q

ads-report:
	cd acquisitions && uv run ga5ads report
