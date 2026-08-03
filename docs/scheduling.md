# Scheduling

`workers/src/lib/schedule.ts` is the single source of truth. Both the
availability read and the booking write derive from it; never reimplement slot
logic in a route handler.

## Rules

- **Two-hour arrival windows**, not exact appointments — that is how the shop
  dispatches, and it keeps travel time out of the model.
- Weekdays 8am–6pm (five windows), Saturday 9am–1pm (two), Sunday closed.
- `SLOT_CAPACITY = 2` crews per window.
- 2-hour lead time: a window closes to online booking before it starts.
- 14-day horizon.

## Timezone

Every calculation runs in `BUSINESS_TZ` (`America/New_York`), never the
server's zone — a customer booking from another timezone must still see Atlanta
mornings. `zonedParts()` reads wall-clock time in that zone; date keys are plain
`YYYY-MM-DD` with no zone of their own.

## Races

Availability is derived from D1 at read time, and `POST /api/appointments`
re-derives it before inserting. Two people racing for the last slot cannot both
win — the loser gets 409 `slot_unavailable`.

## Changing the rules

Edit the `WINDOWS` map or the constants at the top of the file. The tests in
`workers/test/schedule.test.ts` assert the shape of the week, so a rule change
should show up there as an intentional edit.
