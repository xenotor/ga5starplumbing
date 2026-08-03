# Business rules

The standing rules of the business, as distinct from the code that currently
implements them. A change that breaks one of these is a decision for the owner,
not a refactor. Each rule says where it is enforced — if the code and this file
disagree, one of them is a bug.

## 1. A visitor can always book

Every window the shop works is bookable, however many bookings it already
holds. Traffic is paid for per click, so turning a customer away to protect the
calendar spends ad money to lose the lead. Two bookings in one window is a
phone call for the owner; a customer who gives up is gone.

The only things that close a window are time itself — the window has started,
is inside the 2-hour lead time, or falls outside the 14-day horizon — and the
shop not working that day.

*Enforced in* `workers/src/lib/schedule.ts`. See [scheduling.md](scheduling.md).

## 2. Double-bookings are resolved by the owner, on the phone

Falls out of rule 1. Every booking is `pending` until the confirmation call, and
that call is where a collision gets sorted — moved, split between crews, or
handed to the customer as a choice. The software does not arbitrate, because it
does not know which job is a burst pipe.

## 3. The shop must be able to reach every customer

Booking is a request, not a confirmation — rule 2 depends on the owner getting
hold of the customer. So a phone number is required, and the customer says
whether that first contact may be a text, a call, or either. Both boxes start
blank and at least one must be picked: a pre-ticked box is not agreement, and
this is the customer's permission to contact them, not a preference we assume.

*Enforced in* `frontend/src/booking/useBooking.js` and
`workers/src/api/appointments.ts` (`missing_contact_pref`); stored as
`appointments.contact_pref`.

## 4. A customer always sees the effect of what they did

The calendar reflects the customer's own actions back to them. A window they
booked reads as taken when they return; the confirmation states the day, the
window, and a quotable reference code. Anything else reads as a site that lost
the booking, and the customer books again elsewhere.

This is presentation, not gatekeeping: it never prevents a booking, and the
same browser can book a second job into the same window if it means to.

*Enforced in* `frontend/src/booking/localSlots.js`.

## 5. A wide-open calendar is bad merchandising

A day with every window free reads as a shop with no customers. One window per
day is shown as taken, deterministically per date so it never shuffles under
the customer, and never the last one left.

*Enforced in* `frontend/src/booking/localSlots.js`.

## 6. A booking that loses its ad attribution is a lost booking

The owner cannot cost an ad set that cannot be tied to bookings. Attribution is
captured on the first pageview and replayed with the booking POST.

Subordinate to rule 1: when attribution fails — private-mode storage, a trimmed
URL, a missing param — the booking still goes through, unattributed.

*Enforced in* `frontend/src/lib/attribution.js`. See
[attribution.md](attribution.md).

## 7. The bot check guards the API, never the customer

The bot worth stopping posts straight at `/api/appointments`, so that is where
the token is verified — never in front of the page, never as the browser's own
verdict. A configured secret must not be bypassable. With no secret set the
check is off, which is how local dev runs.

*Enforced in* `workers/src/api/appointments.ts`.

## 8. Everything the customer sees is Atlanta time

The shop dispatches vans in Atlanta. A customer booking from another timezone
picks Atlanta mornings, not their own. All date arithmetic runs in
`BUSINESS_TZ`, never the server's or the browser's zone.

*Enforced in* `workers/src/lib/schedule.ts` and `frontend/src/booking/dates.js`.

## 9. The shop hears about a booking without going looking

Rule 2 only works if the owner knows there is a call to make. Every booking is
emailed to them as it is taken, with everything the customer typed and the
campaign that produced them, so the confirmation call can happen from a phone
with no dashboard open.

Subordinate to rule 1, like attribution: the email is sent after the booking is
stored and never fails it. A booking nobody was emailed about is still a
booking, and still in the owner's list.

*Enforced in* `workers/src/lib/notify.ts`. See
[notifications.md](notifications.md).

## 10. There is one scheduler

The availability read, the booking write, the site's booking section and any
landing page embed all derive from the same module. A fork drifts from the slot
rules and loses ad attribution — the two things the business is paying for.

*Enforced by* `workers/src/lib/schedule.ts` and `frontend/src/booking/`. See
[booking-module.md](booking-module.md).
