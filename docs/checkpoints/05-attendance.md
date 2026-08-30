# Attendance

## What I added
- Manual attendance page for each event.
- Present and absent actions for registered members.
- Stored present check-in timestamp.

## What changed
- Admin event rows now link to attendance.
- Attendance actions update the same member/event record.

## Files changed
- `src/App.jsx`
- `src/pages/admin/AdminEventsPage.jsx`
- `src/pages/admin/EventAttendancePage.jsx`
- `docs/checkpoints/05-attendance.md`

## Database changes
- One real attendance record was created and updated through the admin page.
- Existing unique member/event rule prevents duplicate attendance records.

## Packages added
- None.

## Issues fixed
- None.

## What is next
- Build the admin dashboard, member management, and Excel/CSV import.
