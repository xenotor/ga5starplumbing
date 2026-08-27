# Search indexing

`frontend/public/robots.txt` advertises `sitemap.xml`; sitemap lists canonical public pages. `frontend/scripts/generate-seo.mjs` creates crawlable city pages with unique titles, descriptions, canonicals, fallback copy and `Plumber` structured data during every build. React renders matching city copy from `frontend/src/content.js`.

Keep city ZIP lists and actual service coverage accurate. Do not create doorway pages, hidden keyword lists, fake addresses or review schema. After deploy, submit sitemap in Google Search Console and request validation/indexing there. Rankings are not guaranteed by markup.
