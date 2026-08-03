# New-booking notification

The owner works from a phone and does not watch a dashboard, so every booking is
emailed to them the moment it is written: all the customer's fields, plus the ad
attribution that makes the job costable. Cloudflare Email Sending, via the
`EMAIL` binding in `workers/wrangler.jsonc` — no third-party mail provider and
no API key in the Worker.

Formatting and sending live in `workers/src/lib/notify.ts`;
`POST /api/appointments` calls it once the D1 insert has committed.

## Rules the code holds to

- **The send never fails a booking.** It runs after the commit, inside
  `waitUntil`, and swallows errors. A row in D1 is a real booking; the owner's
  list (`GET /api/admin/appointments`) is the source of truth, the email is a
  convenience on top of it.
- **Unset `NOTIFY_EMAIL_TO` disables notification**, as does an absent binding.
  That is how local dev and the test suite run.
- **Reply-To is the customer** when they left an email, so replying reaches
  them rather than the Worker.
- Customer text is HTML-escaped — a booking field must not be able to inject
  markup into the owner's inbox.

## Configuration

| Secret | Value |
| --- | --- |
| `NOTIFY_EMAIL_TO` | `ivan@mobileblobs.com` (change when the shop takes it over) |
| `NOTIFY_EMAIL_FROM` | optional; defaults to `bookings@ga5starplumbing.com` |

Set through the GitHub `production` environment like every other secret — see
[deployment.md](deployment.md).

## Domain onboarding — done

`ga5starplumbing.com` is onboarded to Email Sending (2026-08-03), so
`bookings@ga5starplumbing.com` is a verified sender. Verified end to end with:

```bash
npx wrangler email sending send --from bookings@ga5starplumbing.com \
  --to <you> --subject test --text test
```

Onboarding put Cloudflare's own SPF and DKIM on a `cf-bounce` subdomain rather
than the apex, so **the shop's Mailgun records were untouched** — apex SPF is
still `v=spf1 include:mailgun.org ~all`, and the Mailgun MX and `mx._domainkey`
DKIM are as they were. Records it added: `cf-bounce` MX (three
`route*.mx.cloudflare.net`), `cf-bounce` SPF TXT,
`cf-bounce._domainkey` DKIM TXT, and `_dmarc`.

**The `_dmarc` record is new and applies to the whole domain**, Mailgun mail
included: `v=DMARC1; p=reject;`. The shop's Mailgun mail signs DKIM as
`d=ga5starplumbing.com`, so it is aligned and should pass — but a `p=reject`
policy with no `rua=` address means a future misconfiguration bounces the
shop's mail silently. Loosening it to `p=quarantine` with a reporting address
is the safer setting for a business that sends real mail through two providers.

Both the account token in `.env` and, separately, the Email Sending *zone*
endpoints need `Email Sending Write`. Account-level calls succeeding while
`zones/<id>/email/sending/*` returns `Unauthorized [code: 2036]` means the
grant did not reach zone scope — onboarding from the dashboard sidesteps it.

## Locally

`wrangler dev` does not deliver mail. It writes each message to a file under the
miniflare temp directory and prints the path, which is enough to check wording.
