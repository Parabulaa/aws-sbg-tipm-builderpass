import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Shared secondary "back" control. Replaces inconsistent plain-text links
 * (some pages used indigo text, others amber, with/without an icon) with a
 * single dark/transparent, amber-bordered secondary button used everywhere.
 */
export default function BackLink({ children, to }) {
  return (
    <Link
      className="mono inline-flex items-center gap-2 border border-[var(--bp-border-strong)] px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-[var(--bp-text-dim)] transition-colors duration-150 hover:border-[var(--bp-amber)] hover:text-[var(--bp-amber)]"
      to={to}
    >
      <ArrowLeft size={15} />
      {children}
    </Link>
  )
}
