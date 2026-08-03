# Scheduling

`workers/src/lib/schedule.ts` is the single source of truth. Both the
availability read and the booking write derive from it; never reimplement slot
logic in a route handler.

## Rules

- **Two-hour arrival windows**, not exact appointments — that is how the shop
  dispatches, and it keeps travel time out of the model.
- Monday–Saturday 6am–10pm (eight windows), Sunday closed.
- **No capacity limit — bookings never close a window.** Traffic is paid for
  per click, so a customer who wants 2pm gets 2pm; the owner untangles a real
  double-booking on the confirmation call. Only time closes a window.
- 2-hour lead time: a window closes to online booking before it starts.
- 14-day horizon.

## Timezone

Every calculation runs in `BUSINESS_TZ` (`America/New_York`), never the
server's zone — a customer booking from another timezone must still see Atlanta
mornings. `zonedParts()` reads wall-clock time in that zone; date keys are plain
`YYYY-MM-DD` with no zone of their own.

## Greyed-out slots are a front-end illusion

The Worker returns a fully open calendar, which reads as a shop with no
customers, and it has no memory of what *this* browser booked. Both are patched
in `frontend/src/booking/localSlots.js`, presentation only:

- slots booked from this browser are remembered in `localStorage` and shown as
  taken if the customer books again;
- one further window per day is greyed out, picked deterministically from the
  date key so it does not shuffle mid-visit, and never the last open one.

Nothing there gates the POST — a customer who works around it still books.

## Changing the rules

Edit `DAY_WINDOWS`, the `WINDOWS` map, or the constants at the top of the file. The tests in
`workers/test/schedule.test.ts` assert the shape of the week, so a rule change
should show up there as an intentional edit.
