// Add only real member quotes with permission to publish their quote and
// attribution. See docs/public-content.md. Keep this empty until approved.
export const testimonials = []

export function approvedTestimonials(entries) {
  return entries.filter((entry) => entry.approved === true && entry.consentToPublish === true
    && entry.quote?.trim() && entry.name?.trim()).slice(0, 3)
}
