# Login

## What I added
- Email and password login with Supabase Auth.
- Logout, session loading, protected routes, and role redirects.

## What changed
- Members land on the member area after login.
- Admins land on the admin-only route.
- Members are redirected away from admin-only pages.

## Files changed
- `src/main.jsx`
- `src/App.jsx`
- `src/context/AuthContext.jsx`
- `src/components/AppShell.jsx`
- `src/components/RequireAuth.jsx`
- `src/pages/auth/LoginPage.jsx`
- `src/pages/auth/RegisterPage.jsx`
- `src/pages/member/MemberDashboardPage.jsx`
- `src/pages/admin/AdminLandingPage.jsx`
- `docs/checkpoints/02-login.md`

## Database changes
- One real member profile was promoted to `ADMIN` for admin access.

## Packages added
- None.

## Issues fixed
- Admin access was unavailable until the real profile role was changed to `ADMIN`.

## What is next
- Build event creation, event list, details, and registration status.
