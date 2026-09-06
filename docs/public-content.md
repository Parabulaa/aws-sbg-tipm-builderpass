# Public content maintenance

## Events and recaps

Officers and admins use **Manage events → Create/Edit event → Publication & audience**.
New events default to Draft and Members only. Existing events remain Published and
Members only when Phase 10 runs. Set both Published and Public to make an event
discoverable to guests. Closed registration does not hide an announcement.

Use real event titles, dates, venues, descriptions, and approved posters. After an
event ends, fill in its optional recap (up to 1,500 characters). The homepage shows
up to three upcoming/live events and three most recent previous events, using
Manila time. Empty lists show an honest empty state; no sample events are seeded.

## Testimonials

The section is implemented but hidden until approved quotes exist. Add real quotes
to `src/content/testimonials.js` only after obtaining permission to publish the
quote and attribution. Keep consent evidence privately with the organizers; do
not commit private correspondence. Each entry has this shape:

```js
{
  id: 'unique-editorial-id',
  quote: 'The exact approved member quote',
  name: 'Approved display name',
  attribution: 'Optional approved course or year',
  approved: true,
  consentToPublish: true,
}
```

Only approved entries with consent, a quote, and a name are displayed (maximum
three). Remove an entry or set `approved: false` when permission is withdrawn.
The sample shape above is documentation, not a testimonial to publish.

## Membership questions

The FAQ distinguishes an app account from official organization membership and
directs fee/eligibility questions to the group's existing contact address. No
unverified promises of free membership, certificates, reminders, or job outcomes
are made. Update answers in `src/components/LandingSections.jsx` when the group
provides confirmed policies.

## Release verification

1. Apply pending migrations through Phase 10 before deploying the frontend.
2. Run `npm test`, `npm run build`, and `npm run test:e2e`.
3. In Supabase Auth URL Configuration, permit the deployed `/login` redirect with
   its `next` query parameter for signup verification links. Verify the actual
   emailed link in the target environment, including opening it in another tab.
4. Confirm a guest sees published public events and referenced posters only.
5. Confirm a member cannot read drafts or retrieve their RSVP totals; verify a
   draft cannot accept a new RSVP even through the RPC.
6. Confirm typing in guest/member/officer event searches retains focus, caret,
   scroll position, and existing event data across URL filter updates.

The automated database tests use an isolated PostgreSQL-compatible runtime with
stubbed Supabase auth/storage schemas. Browser tests use mocked API responses.
They do not replace a deployment smoke check against actual Supabase Storage and
email delivery.
