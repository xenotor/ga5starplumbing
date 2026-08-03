.PHONY: help setup run build test prep frontend-install frontend-build d1-create d1-migrate d1-migrate-local secrets-push deploy

.DEFAULT_GOAL := help

help:
	@echo "Georgia 5 Star Plumbing - React + Cloudflare Workers (TypeScript)"
	@echo ""
	@echo "Prerequisites:"
	@echo "  - Node.js 22+"
	@echo "  - wrangler authenticated: npx wrangler login (deploy only)"
	@echo ""
	@echo "Available targets:"
	@echo "  make run              - Build frontend + run Worker locally (wrangler dev)"
	@echo "  make test             - Run Worker tests (vitest)"
	@echo "  make prep             - Format check, lint, typecheck, test, build - run after changes"
	@echo "  make build            - Build frontend + dry-run Worker bundle"
	@echo "  make d1-create        - Create the D1 database (one-time)"
	@echo "  make d1-migrate       - Apply migrations to remote D1"
	@echo "  make d1-migrate-local - Apply migrations to the local dev D1"
	@echo "  make secrets-push     - Push workers/.dev.vars to the Worker"
	@echo "  make deploy           - Build + deploy the Worker (CI does this on merge)"
	@echo ""
	@echo "Local dev: http://localhost:8787 (wrangler dev serves API + built SPA)"

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

run: frontend-build workers/node_modules
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

test: workers/node_modules
	cd workers && npm run --silent test

# ALWAYS run prep after changes.
prep: workers/node_modules frontend/node_modules
	cd workers && npm run --silent format-check && npm run --silent lint && npm run --silent test
	@echo "Running frontend tests..."
	@cd frontend && npm run --silent test 2>&1 || { echo "Frontend tests failed!"; exit 1; }
	@echo "Building frontend..."
	@cd frontend && npm run --silent build

setup: workers/node_modules frontend/node_modules
	@echo "Setup complete."
