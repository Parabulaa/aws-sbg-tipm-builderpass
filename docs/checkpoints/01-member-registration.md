# Member Registration

## What I added
- Member registration form with Supabase Auth signup.
- Profile creation or safe matching to an imported member record.

## What changed
- Added client-side field, email, password, and password-match checks.
- Added the registration route and navigation link.

## Files changed
- `src/App.jsx`
- `src/components/AppShell.jsx`
- `src/pages/StartPage.jsx`
- `src/pages/auth/RegisterPage.jsx`
- `docs/checkpoints/01-member-registration.md`

## Database changes
- None in this feature. It uses the existing Supabase Auth trigger and `profiles` table.

## Packages added
- None.

## Issues fixed
- None.

## What is next
- Build login, logout, session handling, and protected routes.
