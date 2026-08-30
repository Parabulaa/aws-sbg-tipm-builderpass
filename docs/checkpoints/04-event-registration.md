# Event Registration

## What I added
- Member registration for open events.
- Registration confirmation and already-registered state.
- Admin registration list for each event.

## What changed
- Event details now show the correct registration action or closed state.
- Admin event rows link to their registered members.

## Files changed
- `src/App.jsx`
- `src/pages/member/EventDetailPage.jsx`
- `src/pages/admin/AdminEventsPage.jsx`
- `src/pages/admin/EventRegistrationsPage.jsx`
- `docs/checkpoints/04-event-registration.md`

## Database changes
- One real event registration was added through the member flow.
- Existing unique database rule prevents duplicate member/event registrations.

## Packages added
- None.

## Issues fixed
- None.

## What is next
- Add manual attendance recording for registered members.
