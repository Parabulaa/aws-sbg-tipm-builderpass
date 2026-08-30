# View Events

## What I added
- Admin event creation.
- Member event list and event details.
- Open and closed registration status display.

## What changed
- Members can open the real upcoming events list from the dashboard or navigation.
- Admins can create real events from the admin area.
- The empty state shows when no upcoming events exist.

## Files changed
- `src/App.jsx`
- `src/components/AppShell.jsx`
- `src/utils/events.js`
- `src/pages/member/MemberDashboardPage.jsx`
- `src/pages/member/EventsPage.jsx`
- `src/pages/member/EventDetailPage.jsx`
- `src/pages/admin/AdminLandingPage.jsx`
- `src/pages/admin/AdminEventsPage.jsx`
- `src/pages/admin/CreateEventPage.jsx`
- `docs/checkpoints/03-view-events.md`

## Database changes
- One real event was added through the admin event form.

## Packages added
- None.

## Issues fixed
- None.

## What is next
- Let members register for open events and let admins view those registrations.
