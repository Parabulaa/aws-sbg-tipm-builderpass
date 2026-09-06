# BuilderPass

BuilderPass is the membership and event operations app for the AWS Student Builder Group at TIP Manila. Members can discover events, manage RSVPs, and review their activity. Officers manage events and attendance; administrators also manage the member directory and bulk imports.

## What is included

- Supabase email/password authentication and member-profile linking
- Member, Officer, and Admin route protection backed by PostgreSQL RLS
- Event discovery, capacity-aware RSVP, cancellation, and private poster images
- Event creation, editing, registration lists, and three-state attendance
- Searchable member directory plus CSV/XLSX import preview and validation
- Responsive React interface with accessible dialogs and reduced-motion support

## Local setup

Requirements: Node.js 20.19+ or 22.12+, npm, and a Supabase project.

1. Install dependencies.

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env` and add the browser-safe Supabase values.

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   Never add a Supabase service-role key to this frontend project. It bypasses Row Level Security and is not safe in a browser bundle.

3. In the Supabase SQL editor, apply the database files in this order:

   1. `supabase/schema.sql`
   2. `supabase/migrations/phase-3-officer-role.sql`
   3. `supabase/migrations/phase-5-rsvp-capacity.sql`
   4. `supabase/migrations/phase-6-event-posters.sql`
   5. `supabase/migrations/phase-7-attendance-workflow.sql`
   6. `supabase/migrations/phase-8-event-lifecycle-member-profile.sql`
   7. `supabase/migrations/phase-9-batch-rsvp-summaries.sql`
   8. `supabase/migrations/phase-10-public-events.sql`

   For an existing database, apply only pending migrations in this order. Phase 10
   preserves existing events as published to members only; new events default to
   draft and members only. An officer or admin must explicitly select **Published**
   and **Public** in the event editor for a guest announcement to appear.

4. Start the development server.

   ```powershell
   npm run dev
   ```

Vite serves the app at `http://localhost:5173` by default.

## Quality checks

```powershell
npm test
npm run build
```

The test command covers authentication, filtering, event dates, imports, public
content, and database publication permissions. Browser checks run with
`npm run test:e2e` (install Chromium first with `npx playwright install chromium`).
Browser checks use stubbed API data, never a live member database. The production
build writes deployable files to `dist/`.

## Public homepage and event announcements

The homepage groups benefits and joining steps under Why Join, community photos under Events, and membership questions under FAQ. The landing navbar
scrolls to these sections; Login opens the login page. The hero's Join BuilderPass
button opens signup, and Explore Events scrolls to the Events section.
Guests can browse `/events` and
`/events/:id`; reservations and member activity still require sign-in. Search
updates the URL without remounting the page or interrupting typing.

Publication, audience, and registration status are independent. Drafts are visible
only to officers/admins. Public poster access is restricted by Storage policies
to published public events; the bucket remains private. Guest poster URLs expire
after five minutes, although images already downloaded cannot be recalled.

See [public content maintenance](docs/public-content.md) for recaps, testimonials,
membership-policy copy, and the release checklist. Apply the database migrations
before releasing this frontend. A Git push does not apply Supabase migrations.

## Roles

New accounts are members by default. Promote test accounts from the Supabase SQL editor after registration:

```sql
update public.profiles
set role = 'OFFICER'
where lower(email) = lower('officer@example.com');

update public.profiles
set role = 'ADMIN'
where lower(email) = lower('admin@example.com');
```

Frontend route guards improve navigation, while Supabase RLS policies remain the actual authorization boundary.

## Deployment

The repository includes a Vercel SPA rewrite in `vercel.json`, so direct navigation to client-side routes resolves to `index.html`. Configure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Preview and Production deployments, then add the deployed URL to Supabase Authentication URL Configuration.

## Project map

```text
src/components/          Shared layout, navigation, dialogs, and route guards
src/context/             Authentication session and profile provider
src/pages/               Public, member, officer, and admin screens
src/services/supabase/   Browser Supabase client
src/utils/               Event, poster, and import helpers
supabase/                Baseline schema and incremental migrations
test/                    Node-based unit tests
docs/checkpoints/        MVP milestone notes
```
