import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function MemberDashboardPage() {
  const { profile } = useAuth()

  return (
    <section className="mx-auto max-w-[90rem] px-6 py-12 sm:py-20 lg:px-10">
      <div className="border-b border-[var(--bp-border)] pb-8">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Dashboard // Member</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--bp-text)]">
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--bp-text-dim)]">
          You are signed in to BuilderPass. See the latest available events and register for upcoming sessions.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6">
          <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">Member</p>
          <p className="mt-3 text-xl font-black text-[var(--bp-text)]">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="mt-2 text-sm text-[var(--bp-text-dim)]">{profile?.email}</p>
        </div>

        <div className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6">
          <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">Course</p>
          <p className="mt-3 text-xl font-black text-[var(--bp-text)]">{profile?.course || 'Not set'}</p>
          <p className="mt-2 text-sm text-[var(--bp-text-dim)]">
            Year {profile?.year_level || 'Not set'}
          </p>
        </div>

        <div className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6">
          <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">
            AWS SBG Member ID
          </p>
          <p className="mt-3 text-xl font-black text-[var(--bp-text)]">
            {profile?.student_number || 'Not set'}
          </p>
        </div>
      </div>

      <div className="mt-12 border-t border-[var(--bp-border)] pt-10">
        <h2 className="text-2xl font-black text-[var(--bp-text)]">Ready to join an event?</h2>
        <p className="mt-3 max-w-2xl text-base text-[var(--bp-text-dim)]">
          Check out upcoming community sessions and register to attend.
        </p>
        <Link
          className="mt-6 inline-flex items-center gap-2 border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-6 py-3 font-bold uppercase tracking-wide text-black transition-transform hover:translate-y-[-1px]"
          to="/events"
        >
          View events
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  )
}
