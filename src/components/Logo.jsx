/**
 * AWS Student Builder Group - TIP Manila org mark. Replaces the previous
 * decorative amber square placeholder in the header and footer.
 */
export default function Logo({ className = 'h-9 w-9' }) {
  return (
    <img
      alt="AWS Student Builder Group - TIP Manila logo"
      className={`shrink-0 object-contain ${className}`}
      src="/images/logo/aws-sbg-tipm-logo.png"
    />
  )
}
