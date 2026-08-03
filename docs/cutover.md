# Cutover from GitHub Pages

**Done.** `ga5starplumbing.com` is served by the Worker. The GitHub Pages site
is deleted and the legacy `index.html`, `web_files/`, and `CNAME` are gone from
the repo.

## Final state

| Hostname | Behaviour |
| --- | --- |
| `ga5starplumbing.com` | React SPA + `/api`, custom domain on the Worker |
| `www.ga5starplumbing.com` | 301 to the apex, path and query preserved |
| `ga5starplumbing.georgia5starplumbing.workers.dev` | still live, useful for testing |

## What was done

1. Deleted the GitHub Pages web records only — 4 A + 4 AAAA on the apex and the
   `www` CNAME. The zone also holds Mailgun **MX**, **SPF**, and **DKIM**
   records; those were explicitly preserved, since deleting them would break the
   shop's email. Cloudflare replaced the web records with `100::` placeholders
   when the domains attached.
2. Attached both hostnames via `PUT /accounts/{id}/workers/domains`.
3. `gh api -X DELETE repos/xenotor/ga5starplumbing/pages`.
4. Removed the legacy files.

## Keep the routes block

`routes` in `workers/wrangler.jsonc` must stay. Wrangler syncs triggers on every
deploy, so removing it would detach the live domain on the next CI run.

## www redirect

`www` is a custom domain rather than a DNS alias so the Worker owns the
redirect: `src/index.ts` 301s to the apex preserving path and query — an ad
click's `fbclid` has to survive it. Serving both hostnames would split search
ranking and ad-landing analytics.

This is why `run_worker_first` covers page requests and not just `/api/*`: a
request served straight from assets never reaches the redirect.

## Attaching a domain in future

A hostname with pre-existing DNS records fails with code 100117; the override
flag does not help. Delete the conflicting records first. Note that **account**
permissions do not include DNS — the API token needs a **Zone** resource with
DNS:Edit.
