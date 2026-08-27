# Search indexing

`frontend/public/robots.txt` advertises `sitemap.xml`; sitemap lists canonical public pages. `frontend/scripts/generate-seo.mjs` creates crawlable city pages with unique titles, descriptions, canonicals, fallback copy and `Plumber` structured data during every build. React renders matching city copy from `frontend/src/content.js`.

`llms.txt`, discovery `Link` headers and explicit `Content-Signal`/AI crawler rules expose public content to answer engines while denying model training by policy. Page routes also support `Accept: text/markdown`. Unknown routes return `404` plus `X-Robots-Tag: noindex` instead of SPA soft 404s.

Keep city ZIP lists and actual service coverage accurate. Do not create doorway pages, hidden keyword lists, fake addresses or review schema. After deploy, submit sitemap in Google Search Console and request validation/indexing there. Rankings are not guaranteed by markup. DNS-AID is intentionally omitted: it is an emerging protocol for advertising agent endpoints, and this brochure/booking site has no public agent service to advertise.
