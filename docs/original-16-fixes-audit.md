# Original 16 fixes: implementation and overlap audit

Reviewed against the repository on September 7, 2026. “Implemented” describes
code in this repository; it does not imply the live Supabase database has been
migrated or that new photos/testimonials have been supplied.

| # | Original fix | Current status | Overlap with the latest request |
|---|---|---|---|
| 1 | Repair Phase 8 migration | Restored the locally damaged file from its complete committed version. The migration chain passes isolated database tests. | None. The restored content was already in Git, so the repair itself did not create a new remote diff. |
| 2 | Clearer hero and CTAs | Implemented. Join BuilderPass opens signup; Explore Events scrolls to the homepage Events section. | Preserved. |
| 3 | Why Join section | Implemented with AWS SBG TIP Manila context and eligibility guidance. | FAQ now explicitly emphasizes that BuilderPass is dedicated to AWS SBG TIPM. |
| 4 | Student-focused benefits | Implemented: discover events, reserve a spot, and review participation. | The optional “For officers” marketing paragraph is removed. Officer tools remain available in the app. |
| 5 | Previous Events on homepage | Implemented previously, then replaced by the requested photo gallery. Past event browsing remains in the separate `/events` directory. | Superseded on the homepage, intentionally. |
| 6 | Upcoming Events on homepage | Implemented previously, then replaced by the requested photo gallery. Upcoming event browsing remains in `/events`. | Superseded on the homepage, intentionally. |
| 7 | Public event previews | Implemented at `/events` and `/events/:id`; RSVP still requires sign-in. | Homepage photo content no longer depends on event queries. Live public access still requires Phase 10. |
| 8 | Publication and visibility controls | Implemented: Draft/Published and Members/Public are independent of registration status. | Preserved. The live migration remains unverified. |
| 9 | Public poster access | Implemented with scoped Storage policies and expiring guest URLs; the bucket stays private. | Preserved for the event directory. Gallery images are separate public site assets. Live Storage behavior remains unverified. |
| 10 | Genuine testimonials | Rendering and approval/consent checks are implemented. No quotes have been supplied; the section stays hidden. | Still awaiting approved member quotes. |
| 11 | FAQ | Implemented: membership, fees, experience, account creation, reservations, cancellation, capacity, and attendance. | Updated with explicit AWS SBG TIPM dedication and a clickable Facebook concerns link. Unconfirmed fee/eligibility policies are not invented. |
| 12 | Joining steps | Implemented: create account, verify email, find an event and reserve. | Preserved inside Why Join. |
| 13 | Return to event after signup/login | Implemented, including verification redirect URLs and permitted local destinations. Browser checks cover the flow with mocked auth. | Preserved. Real email delivery/redirect configuration still needs a deployment smoke check. |
| 14 | Accessible slideshow behavior | Originally added pause/reduced-motion handling and larger dot controls. Now manual-only: arrows/dots change photos; no autoplay or pause button. Reduced-motion handling remains. | Revised to remove the unwanted pause control without leaving unpausable animation. |
| 15 | Complete setup documentation | README includes Phase 9 and Phase 10, public content maintenance, and tests. | Added gallery-image instructions and this audit. |
| 16 | Uninterrupted event search | Implemented: query changes no longer remount the page; debounce preserves newer input, focus, caret, and scroll. Browser checks cover guest/member/officer searches. | Preserved. Removing homepage event lists does not remove directory search. |

## Remaining content and deployment work

- Add real event photos to `public/images/community/` and register them in
  `src/content/communityImages.js`. The gallery is ready; it currently shows an
  honest placeholder. This is repository-based editing, not an in-app uploader.
- Supply approved member quotes to activate testimonials.
- Apply pending Supabase migrations through Phase 10, if not already applied.
  No live migration execution has been verified in this task.
- Verify actual signup emails and Storage access in the deployed environment.

## Commit grouping for this request

Four functional/documentation groups, each committed and pushed separately:

1. Homepage photo gallery replacing scheduled event subsections.
2. Manual slideshow without the pause button.
3. AWS SBG TIPM FAQ, clickable Facebook concerns link, and removal of officer copy.
4. This original-16 status and overlap audit.

See [public content maintenance](public-content.md) for photo and testimonial setup.
