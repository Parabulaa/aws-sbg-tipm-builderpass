# BuilderPass — Comprehensive Platform Documentation

> AWS Student Builder Group · TIP Manila
>
> Application: <https://aws-sbg-tipm-builderpass.vercel.app>
>
> Repository: <https://github.com/Parabulaa/aws-sbg-tipm-builderpass>
>
> Last reviewed: September 2, 2026

## 1. Platform summary

BuilderPass is a responsive membership, event registration, and attendance platform for the AWS Student Builder Group at the Technological Institute of the Philippines — Manila. It replaces separate member lists, RSVP forms, and attendance sheets with one role-aware web application.

The platform supports three user roles:

- **Member** — manages their account information, discovers events, reserves a slot, cancels an eligible reservation, and reviews participation.
- **Officer** — has all member capabilities plus event creation, event editing, registration review, and attendance recording.
- **Admin** — has all officer capabilities plus the organization dashboard, member directory, manual member creation, and bulk member import.

BuilderPass is a React single-page application. Supabase supplies authentication, PostgreSQL data storage, Row Level Security, database functions, and private event-poster storage. Vercel hosts the production frontend and deploys the `main` branch.

## 2. Core workflows

### 2.1 Account registration

1. A guest opens `/register`.
2. They enter their AWS SBG Member ID, name, email, supported program, year level, password, and password confirmation.
3. The form validates required fields, email structure, an eight-character password minimum, and matching passwords.
4. The password area provides independent show/hide controls for both password fields.
5. A live four-level strength meter reports **Weak**, **Fair**, **Good**, or **Strong** and suggests improvements for length, mixed case, numbers, and symbols.
6. `supabase.auth.signUp()` creates the authentication user and sends the membership fields as user metadata.
7. The `handle_new_user()` database trigger either creates a new profile or securely links a pre-imported membership record with the same Member ID and email.
8. If Supabase automatically creates a session, BuilderPass signs it out locally. Registration never logs the new member in automatically.
9. A success dialog explains whether email confirmation is required. The user closes it or deliberately proceeds to `/login`.

### 2.2 Login and session handling

- Login uses Supabase email/password authentication.
- The authentication provider restores existing sessions at application startup and listens for later auth changes.
- Repeated `SIGNED_IN` or token-refresh events for the same user do not force the whole page back into a loading state.
- A member profile is loaded by matching `profiles.auth_user_id` with the authenticated Supabase user ID.
- Unauthenticated users attempting a protected route are redirected to `/login`.
- Logout clears the Supabase session and returns the user to the public landing page (`/`).

### 2.3 Event discovery

Authenticated users can browse all events, including current and ended events. The event directory provides:

- **Time filter:** All events, Current events, Upcoming, or Ended.
- **My activity filter:** All events, Reserved, or Attended.
- **Registration filter:** All statuses, Open, or Closed.
- A status summary showing the number of current reservations and attended events.
- A visible count of filtered events versus all loaded events.
- Cards containing poster, lifecycle/registration badges, title, description, date, start/end time, venue, RSVP count, capacity, and remaining slots.
- A direct link from every card to the complete event detail page.

The default view is intentionally useful without configuration: current events with all activity and registration states. Resetting the filters restores the defaults.

### 2.4 RSVP and cancellation

The event detail page is the authoritative reservation screen.

- Members can RSVP only while registration is open and the event has not ended.
- Capacity is mandatory after the Phase 8 migration and defaults to 50.
- The database locks the event row while processing an RSVP, counts active reservations, and prevents overbooking.
- Repeated RSVP requests are idempotent: an already active reservation is returned instead of duplicated.
- A cancelled reservation can be reactivated if the event is still eligible and has space.
- Members can cancel only an active reservation while registration is open and before the event ends.
- Cancellation is blocked after attendance is finalized as Present or Did Not Attend.
- The UI translates database error codes such as `EVENT_FULL`, `EVENT_ENDED`, and `REGISTRATION_CLOSED` into readable messages.

Ended events remain viewable as history, but they no longer expose RSVP or cancellation actions.

### 2.5 Event management

Officers and admins can:

- Create events with title, description, optional poster, date, start time, end time, venue, capacity, and registration status.
- Open the native system calendar or time picker and still type values manually.
- Use the **Today** and **Now** shortcuts inside the corresponding date/time controls.
- Preview a newly selected poster before saving.
- Edit event information without replacing registrations or attendance records.
- Replace or remove the current poster.
- Open or close registration.
- Review the active registration list.
- Record and revise attendance.

The form requires a positive whole-number capacity and an end time later than the start time. The database also prevents reducing capacity below the number of active reservations.

### 2.6 Attendance

Each registered member has one attendance state per event:

- `NOT_MARKED`
- `PRESENT`
- `DID_NOT_ATTEND`

Officers and admins change the state using three mutually exclusive controls. Marking a member Present records the current timestamp as `check_in_time`; the other states clear it. Summary cards show totals for registered, present, did not attend, and not marked. Updates are reflected in local state without a full page reload.

### 2.7 Member profile maintenance

Every authenticated user can review their profile. A user may edit only their own:

- First name
- Last name
- Course or program
- Year level
- Section

AWS SBG Member ID, email, linked authentication identity, and role are protected. The `update_own_profile` SECURITY DEFINER function validates the request against the authenticated user instead of trusting a profile ID from the browser.

### 2.8 Member administration and imports

Admins can add an individual member or manage the searchable directory. Directory filters cover Member ID/name/email search, course, year, section, and role. The Account column distinguishes linked authentication accounts from membership-only records.

Bulk import accepts CSV and XLSX files. The workflow is:

1. Choose or drag a file.
2. Parse the first worksheet and normalize column names.
3. Preview valid and invalid records.
4. Review precise row-level validation messages.
5. Confirm insertion of valid rows.

Required columns are `student_number`, `first_name`, `last_name`, `email`, `course`, and `year_level`. `section` is optional. Accepted Member ID aliases include `member_id`, `aws_sbg_member_id`, and `aws_sbg_memberid`.

Import validation rejects:

- Missing required values
- Invalid email addresses
- Unsupported programs
- Years outside 1–4
- Duplicate Member IDs or emails in the file
- Member IDs or emails already present in the database

## 3. Academic scope

BuilderPass accepts four college year levels only: **Year 1, Year 2, Year 3, and Year 4**. Senior high school levels are not included.

Supported TIP Manila programs are:

1. BS Electrical Engineering (BS EE)
2. BS Computer Science (BS CS)
3. BS Information Technology (BS IT)
4. BS Information Systems (BS IS)
5. BS Computer Engineering (BS CPE)
6. BS Data Science and Analytics (BS DSA)
7. BS Entertainment and Multimedia Computing (BS EMC)

Legacy abbreviations such as `BSCS`, `BS IT`, and `BSCPE` are normalized to the matching full program label when possible.

## 4. Roles and authorization

| Capability | Member | Officer | Admin |
|---|:---:|:---:|:---:|
| View dashboard and profile | Yes | Yes | Yes |
| Edit own permitted profile fields | Yes | Yes | Yes |
| View events and event details | Yes | Yes | Yes |
| RSVP/cancel eligible RSVP | Yes | Yes | Yes |
| Create and edit events | No | Yes | Yes |
| View event registrations | No | Yes | Yes |
| Record attendance | No | Yes | Yes |
| View admin operations dashboard | No | No | Yes |
| Add/import members | No | No | Yes |
| View the full member directory | No | Limited to event-related records | Yes |

Frontend route guards improve navigation, but they are not the security boundary. PostgreSQL Row Level Security and restricted RPC execution enforce authorization even if a caller bypasses the interface.

## 5. Application routes

| Route | Page | Access | Purpose |
|---|---|---|---|
| `/` | `StartPage` | Public | Landing page, feature summary, responsive photo slideshow |
| `/register` | `RegisterPage` | Public | Account creation and password guidance |
| `/login` | `LoginPage` | Public | Email/password sign-in |
| `/dashboard` | `MemberDashboardPage` | Authenticated | Participation totals and next current event |
| `/events` | `EventsPage` | Authenticated | Search/filter all events and open details |
| `/events/:id` | `EventDetailPage` | Authenticated | Event details, capacity, RSVP/cancellation |
| `/profile` | `ProfilePage` | Authenticated | View and edit permitted personal information |
| `/admin/events` | `AdminEventsPage` | Officer/Admin | Manage the event catalog |
| `/admin/events/new` | `CreateEventPage` | Officer/Admin | Create an event |
| `/admin/events/:id/edit` | `EditEventPage` | Officer/Admin | Edit an event/poster |
| `/admin/events/:id/registrations` | `EventRegistrationsPage` | Officer/Admin | Review active RSVPs |
| `/admin/events/:id/attendance` | `EventAttendancePage` | Officer/Admin | Record attendance |
| `/admin` | `AdminDashboardPage` | Admin | Operational totals and shortcuts |
| `/admin/members` | `MembersPage` | Admin | Add, filter, and review members |
| `/admin/members/import` | `MemberImportPage` | Admin | CSV/XLSX import workflow |
| `*` | `NotFoundPage` | Public | Friendly not-found page |

## 6. Page and interface behavior

### Public landing page

- Presents the BuilderPass value proposition and primary registration call to action.
- Uses three real AWS SBG TIP Manila photos in an autoplay carousel.
- Provides previous/next buttons, slide indicators, captions, and reduced-motion behavior.
- Displays optimized mobile images below the desktop breakpoint so photos load reliably on phones.
- Keeps slideshow controls visible on touch-sized layouts.

### Member dashboard

- Shows a personalized welcome and profile summary.
- Counts attendance records marked Present.
- Counts active RSVPs for events that have not ended.
- Selects the earliest current event as the next event.
- Uses compatibility queries when the connected database has not yet received the `end_time` migration.

### Navigation and logout

- Guests see Home, Register, and Login.
- Signed-in users see Dashboard, Events, and Profile.
- Officers/admins additionally see Manage events.
- Admins additionally see Admin.
- Desktop navigation appears at `md` and above; smaller screens use an accessible menu button.
- Active-route underlines apply only to the exact intended navigation destination.
- Logout redirects to the landing page rather than the login form.

### Dialogs

The shared dialog component supports success, warning/amber, and danger presentations. It:

- Uses an accessible dialog role and labelled heading.
- Closes with Escape, the close button, or a backdrop click.
- Prevents the registration success state from silently logging a user in.
- Keeps modal content within the viewport and available on smaller screens.

### Tables and scrolling

Wide tables remain horizontally scrollable instead of compressing data into unreadable cells. Intentional scroll regions use a branded amber/yellow draggable scrollbar. The thumb has a visible amber outline in Chromium/WebKit, with an amber fallback color in Firefox.

## 7. Technology stack

| Layer | Technology | Version / notes |
|---|---|---|
| UI | React | 19.2.8 |
| Routing | React Router DOM | 7.18.3 |
| Styling | Tailwind CSS | 4.3.3 |
| Icons | Lucide React | 1.37.0 |
| Build | Vite | 8.2.2 |
| Backend client | Supabase JS | 2.112.4 |
| Database | Supabase PostgreSQL | Tables, functions, triggers, RLS |
| Authentication | Supabase Auth | Email/password and browser session |
| Media | Supabase Storage | Private event posters |
| Spreadsheet parsing | SheetJS (`xlsx`) | 0.18.5 |
| Hosting | Vercel | Vite build from GitHub `main` |
| Testing | Node test runner | Pure utility tests |

No separate custom application server is required.

## 8. Architecture

```text
Browser
└── React SPA
    ├── React Router
    │   └── RequireAuth / RequireOfficer / RequireAdmin
    ├── AuthContext
    │   ├── Supabase session
    │   └── current profiles row
    └── Supabase JS client
        ├── Auth API
        ├── PostgREST table queries
        ├── PostgreSQL RPC calls
        └── Storage signed URLs
            ↓
Supabase
├── PostgreSQL tables, constraints, triggers, and functions
├── Row Level Security policies
├── Auth users and JWTs
└── private event-posters bucket
```

Typical request flow:

1. A component responds to a user action.
2. The Supabase client includes the current session token.
3. Supabase validates the JWT.
4. PostgreSQL applies RLS or runs a permitted RPC.
5. The result updates local React state.
6. The page renders success, empty, loading, or error feedback without a full reload.

Pages are lazy-loaded with `React.lazy()` and rendered inside `Suspense`, reducing the initial route bundle.

## 9. Data model

### `public.profiles`

Stores one membership record per person.

| Important column | Purpose |
|---|---|
| `id` | Internal UUID primary key |
| `auth_user_id` | Optional unique link to `auth.users`; imported members may begin unlinked |
| `student_number` | Unique AWS SBG Member ID |
| `first_name`, `last_name` | Display identity |
| `email` | Required; unique case-insensitively |
| `course` | One supported program after Phase 8 |
| `year_level` | 1–4 after Phase 8 |
| `section` | Optional section |
| `role` | `MEMBER`, `OFFICER`, or `ADMIN` |
| `created_at`, `updated_at` | Audit timestamps |

### `public.events`

| Important column | Purpose |
|---|---|
| `id` | Event UUID |
| `title`, `description` | Event content |
| `event_date` | Local calendar date |
| `start_time`, `end_time` | Lifecycle boundaries |
| `venue` | Event location |
| `registration_status` | `OPEN` or `CLOSED` |
| `capacity` | Required positive integer; default 50 after Phase 8 |
| `poster_path` | Private Storage object path |
| `created_by` | Supabase auth user that created the event |
| `created_at`, `updated_at` | Audit timestamps |

`end_time` must be later than `start_time`. Existing events receive a safe capacity during Phase 8: at least 50, or their current active RSVP count if that is higher.

### `public.event_registrations`

| Important column | Purpose |
|---|---|
| `user_id` | Profile UUID |
| `event_id` | Event UUID |
| `status` | `REGISTERED` or `CANCELLED` |
| `registered_at` | Initial/latest activation time |
| `cancelled_at` | Cancellation timestamp when cancelled |

The unique `(user_id, event_id)` constraint ensures one registration history row per member/event combination.

### `public.attendance`

| Important column | Purpose |
|---|---|
| `user_id` | Profile UUID |
| `event_id` | Event UUID |
| `status` | `NOT_MARKED`, `PRESENT`, or `DID_NOT_ATTEND` |
| `check_in_time` | Timestamp used for Present |
| `created_at`, `updated_at` | Audit timestamps |

The unique `(user_id, event_id)` constraint permits safe upserts.

## 10. Database functions and safeguards

| Function | Responsibility |
|---|---|
| `set_updated_at()` | Refreshes `updated_at` before table updates |
| `current_profile_id()` | Resolves the caller's profile UUID from `auth.uid()` |
| `is_admin()` | Checks whether the caller has the Admin role |
| `is_officer_or_admin()` | Checks event-management privileges |
| `handle_new_user()` | Creates or links a profile after Supabase signup |
| `rsvp_to_event(uuid)` | Locks/checks an event and safely creates/reactivates an RSVP |
| `cancel_event_rsvp(uuid)` | Cancels an eligible active RSVP |
| `get_event_rsvp_summary(uuid)` | Returns capacity, active count, remaining slots, and full state |
| `prevent_capacity_below_active_rsvps()` | Rejects an event capacity below its active RSVP count |
| `update_own_profile(...)` | Updates only the authenticated user's permitted profile fields |

The RSVP and cancellation functions compare the event date/time against `Asia/Manila`. If an old row lacks `end_time`, its start time acts as the cutoff.

Database error identifiers intentionally used by the client include:

- `PROFILE_NOT_FOUND`
- `EVENT_NOT_FOUND`
- `EVENT_ENDED`
- `REGISTRATION_CLOSED`
- `EVENT_FULL`
- `NO_ACTIVE_RSVP`
- `CANNOT_CANCEL_ATTENDED_RSVP`
- `AUTHENTICATION_REQUIRED`
- `PROFILE_FIELDS_REQUIRED`
- `INVALID_YEAR_LEVEL`
- `INVALID_COURSE`

## 11. Row Level Security

All four public application tables have RLS enabled.

- Authenticated users can read events.
- A member can read their own profile, registration records, and attendance.
- Officers/admins receive the event-related visibility required to review registrants and attendance.
- Only admins can manage the complete member directory.
- Officers/admins can create and update events and attendance according to the applied migrations.
- RSVP writes are performed through the restricted RPCs rather than trusting a browser-side capacity check.
- Poster Storage policies allow authenticated reads and officer/admin uploads or removals.
- Sensitive helper functions revoke general `public` execution and grant only the required authenticated access.

The browser uses only the Supabase anonymous key. A service-role key must never be placed in `.env`, Vercel frontend variables, or committed code because it bypasses RLS.

## 12. Event poster storage

The private bucket is named `event-posters`.

| Rule | Value |
|---|---|
| Maximum size | 5 MB |
| Accepted MIME types | JPEG, PNG, WebP |
| Object path | `events/<event-id>/<random-id>.<extension>` |
| Read method | Signed URL |
| Signed URL duration | 1 hour |

Create and edit forms use an object URL for immediate local preview. The code revokes that URL when it is no longer needed. Saved posters are displayed through signed URLs; batch signing avoids requesting each event poster individually.

## 13. UI system, responsiveness, and accessibility

### Visual identity

The interface uses near-black backgrounds, warm off-white text, and amber as its primary accent. The core variables are defined in `src/index.css`:

| Variable | Value | Purpose |
|---|---|---|
| `--bp-bg` | `#0b0c0c` | Main background |
| `--bp-bg-soft` | `#111212` | Inputs/subtle surfaces |
| `--bp-surface` | `#151616` | Cards and panels |
| `--bp-text` | `#f2eee6` | Main text |
| `--bp-text-muted` | `#aaa49a` | Labels/supporting text |
| `--bp-amber` | `#ffb31a` | Primary action/accent |
| `--bp-success` | `#42b96b` | Success/present states |
| `--bp-danger` | `#d96767` | Errors/danger states |

### Responsive behavior

- The minimum supported viewport is 320px.
- Forms collapse from multi-column layouts to one column.
- Header navigation changes to a mobile menu below 768px.
- The landing slideshow is present on mobile and loads compressed mobile-specific photos.
- Event cards use responsive widths and centered grid alignment.
- Wide administrative tables scroll horizontally.
- Dialogs and field controls remain usable on small screens.

### Accessibility

- Visible amber `:focus-visible` outlines are applied app-wide.
- Forms use explicit labels and readable error/status regions.
- Password visibility buttons report Show/Hide state and use `aria-pressed`.
- The password-strength UI exposes a semantic `meter` and live text guidance.
- Custom selects support keyboard focus and accessible combobox semantics.
- Dialogs support keyboard dismissal.
- Slideshow buttons have descriptive labels and images have meaningful alt text.
- Decorative grid layers are hidden from assistive technology and never intercept pointer events.
- Motion-heavy effects honor `prefers-reduced-motion`.

## 14. Shared components and utilities

### Components

| Component | Purpose |
|---|---|
| `AppShell` | Shared header, role-aware navigation, footer, logout, background |
| `RequireAuth` | Protects member routes |
| `RequireOfficer` | Protects officer/admin event tools |
| `RequireAdmin` | Protects admin-only operations |
| `Dialog` | Accessible reusable modal |
| `SelectControl` | Branded custom dropdown/combobox |
| `EventDateTimeField` | Native date/time input plus embedded Today/Now shortcut |
| `GridBackground` | Decorative animated amber grid |
| `PageTransition` | Route entrance animation |
| `ScrollReveal` | Intersection-based content reveal |
| `BackLink` | Consistent return navigation |
| `Logo` | Organization mark |

### Utilities

| File | Responsibility |
|---|---|
| `src/utils/events.js` | Formatting, validation, lifecycle calculation, event filtering |
| `src/utils/eventPosters.js` | Poster validation, upload/removal, signed URLs |
| `src/utils/memberImport.js` | Spreadsheet parsing, normalization, duplicate validation |
| `src/utils/passwordStrength.js` | Strength score, label, and targeted password suggestions |
| `src/utils/supabaseCompatibility.js` | Detects old schemas and produces migration guidance |
| `src/hooks/useObjectUrl.js` | Creates and revokes temporary file-preview URLs |

## 15. Repository structure

```text
public/images/                 Logo, landing photos, optimized mobile photos
src/components/               Shared layout and interaction components
src/constants/                Supported academic programs and years
src/context/                  Authentication/session provider
src/hooks/                    Reusable React hooks
src/pages/auth/               Login and registration
src/pages/member/             Dashboard, events, details, profile
src/pages/admin/              Member, event, RSVP, and attendance tools
src/services/supabase/        Browser Supabase client
src/utils/                    Pure rules and Supabase helper functions
supabase/schema.sql           Baseline database schema
supabase/migrations/          Incremental production database changes
test/                         Node-based unit tests
docs/checkpoints/             Historical MVP checkpoint notes
README.md                     Concise setup and deployment guide
BUILDERPASS_PROJECT_DOCUMENTATION.md  This comprehensive reference
```

## 16. Database installation and migrations

For a new Supabase project, run these files in the SQL Editor in order:

1. `supabase/schema.sql`
2. `supabase/migrations/phase-3-officer-role.sql`
3. `supabase/migrations/phase-5-rsvp-capacity.sql`
4. `supabase/migrations/phase-6-event-posters.sql`
5. `supabase/migrations/phase-7-attendance-workflow.sql`
6. `supabase/migrations/phase-8-event-lifecycle-member-profile.sql`

Migration purposes:

| Migration | Adds or changes |
|---|---|
| Phase 3 | Officer role and officer/admin authorization policies |
| Phase 5 | Capacity, cancellable registrations, RSVP summary and safe RSVP RPCs |
| Phase 6 | Private poster bucket, poster path, Storage policies |
| Phase 7 | Optional section and three-state attendance workflow |
| Phase 8 | End time, required capacity, four-year/seven-program scope, ended-event enforcement, self-service profile RPC |

The frontend includes limited compatibility handling for a database missing Phase 8 so older data can still be displayed. Features that require missing columns/functions show a migration message. Compatibility behavior is temporary; applying every migration is the supported configuration.

## 17. Local development

Requirements:

- Node.js 20.19+ or 22.12+
- npm
- A Supabase project with the complete schema/migrations

Install and run:

```powershell
npm install
npm run dev
```

Vite normally serves <http://localhost:5173>.

Create `.env` from `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both variables are intentionally prefixed with `VITE_` because the browser bundle needs them. Do not place privileged backend credentials in this project.

## 18. Testing and verification

Run the automated utility tests:

```powershell
npm test
```

Current coverage includes:

- Academic program normalization
- Local date/time formatting and manual value validation
- Event lifecycle and filters
- RSVP-facing labels
- Spreadsheet header/row normalization
- Import validation and duplicate detection
- Password-strength scoring and suggestions
- Missing-schema compatibility detection

Create a production build:

```powershell
npm run build
```

Optionally serve the built files locally:

```powershell
npm run preview
```

Recommended manual verification:

### Guest

- Landing slideshow loads and changes slides on desktop and phone.
- Registration program/year selectors contain only supported values.
- Password visibility controls work independently.
- Strength meter and suggestions change while typing.
- Registration closes with a success dialog and does not auto-login.

### Member

- Dashboard stats and next event are accurate.
- Event filters combine correctly.
- Every event card opens its details.
- RSVP totals and remaining capacity update after reserve/cancel.
- Ended events do not allow registration changes.
- Profile edits refresh the displayed profile.
- Logout returns to the landing page.

### Officer

- Native calendar/time pickers open and Today/Now shortcuts populate fields.
- Event poster previews before upload and displays after save.
- Capacity and end-time rules produce readable errors.
- Registrations and attendance tables scroll correctly on narrow screens.
- Attendance states and totals update without a page refresh.

### Admin

- Dashboard metric counts load.
- Member filters and amber scrollbars work.
- Single-member creation accepts only supported academic values.
- CSV/XLSX preview separates valid and invalid rows.

## 19. Production deployment

The expected deployment flow is:

```text
local change → commit → push to GitHub main → Vercel build → production deployment
```

Vercel settings:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

`vercel.json` rewrites every application route to `/index.html`, allowing direct visits to client-side paths such as `/events/<id>`.

Supabase Authentication URL Configuration should contain the production site URL and appropriate local/production redirect URLs.

## 20. Operational notes and troubleshooting

### A new GitHub commit is not visible on the deployed site

1. Confirm the commit exists on `origin/main`.
2. Check the latest Vercel deployment status.
3. Confirm Vercel is connected to the correct repository and branch.
4. Hard-refresh the browser after deployment completes.
5. On mobile, close/reopen the tab or clear cached site data if an old bundle remains.

### The app reports a missing `end_time` column or `update_own_profile` function

Apply `phase-8-event-lifecycle-member-profile.sql` in Supabase. Frontend code cannot add database columns or functions by itself.

### An event poster does not appear

- Confirm Phase 6 was applied.
- Confirm the `event-posters` bucket exists and remains private.
- Verify the saved `poster_path` matches the Storage object.
- Confirm the signed-URL request is permitted by Storage policies.
- Re-selecting a local file should show an immediate preview before save.

### RSVP fails

Check event end time, registration status, required capacity, active RSVP count, member profile linkage, and whether attendance was already finalized.

### Member cannot access staff pages

Confirm the `profiles.role` value is exactly `OFFICER` or `ADMIN` and that Phase 3 policies were applied. Roles are protected account data and should be assigned administratively.

## 21. Current product boundaries

BuilderPass currently focuses on membership and event operations. The repository does not include:

- Payments or ticket sales
- Public event registration without a BuilderPass account
- Email campaign management
- QR-code attendance scanning
- Push notifications
- Multi-organization tenancy
- A custom server outside Supabase

These are possible future extensions, not present platform behavior.

---

This document describes the BuilderPass codebase and database workflow through commit `c6aaf0c`, immediately before this documentation revision.
