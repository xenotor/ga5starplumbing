# Cutover from GitHub Pages

**Status: blocked on token permissions.** `ga5starplumbing.com` still serves the
old GitHub Pages site.

The root `index.html`, `web_files/`, and `CNAME` are kept on purpose — deleting
them takes the business's website down. They go **after** the Worker serves the
domain, not before.

## Where it stopped

Attaching the custom domains fails:

```
Hostname 'ga5starplumbing.com' already has externally managed DNS records
(A, CNAME, etc). Delete them first or try a different hostname. [code: 100117]
```

The apex A records still point at GitHub Pages, and the deploy token cannot read
or edit DNS (`Zone:DNS` and `Workers Routes` both return `Authentication error`).

## Unblocking

Add **Zone → DNS → Edit** and **Zone → Workers Routes → Edit** to the API token
for the `ga5starplumbing.com` zone, or delete the apex/`www` records by hand in
the dashboard first.

## Steps

1. Uncomment the `routes` block in `workers/wrangler.jsonc`.
2. `make deploy` — this deletes the GitHub Pages DNS records and attaches
   `ga5starplumbing.com` and `www.ga5starplumbing.com` to the Worker.
3. Verify: apex serves the React app, `www` 301s to the apex, `/api/health`
   answers on the apex.
4. Disable GitHub Pages:
   `gh api -X DELETE repos/xenotor/ga5starplumbing/pages`
5. Delete `index.html`, `web_files/`, and `CNAME`; drop the note from
   `CLAUDE.md`.

## www redirect

`www` is attached as a custom domain rather than left as a DNS alias so the
Worker owns the redirect: `src/index.ts` 301s `www` to the apex, preserving path
and query (an ad click's `fbclid` must survive it). Serving both hostnames would
split search ranking and ad-landing analytics.

This is why `run_worker_first` covers page requests and not just `/api/*` — a
request served straight from assets never reaches the redirect.
