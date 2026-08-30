import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase/client.js'

const cards = [
  ['Total members', 'members', '/admin/members'],
  ['Total events', 'events', '/admin/events'],
  ['Upcoming events', 'upcoming', '/admin/events'],
  ['Active RSVPs', 'registrations', '/admin/events'],
  ['Attendance records', 'attendance', '/admin/events'],
]

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCounts() {
      const today = new Date().toISOString().slice(0, 10)
      const results = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).gte('event_date', today),
        supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('status', 'REGISTERED'),
        supabase.from('attendance').select('*', { count: 'exact', head: true }),
      ])
      const failed = results.find((result) => result.error)
      if (failed) {
        setError(failed.error.message || 'Could not load dashboard statistics.')
      } else {
        setCounts({
          members: results[0].count,
          events: results[1].count,
          upcoming: results[2].count,
          registrations: results[3].count,
          attendance: results[4].count,
        })
      }
    }
    loadCounts()
  }, [])

  return (
    <section className="mx-auto max-w-[90rem] px-6 py-12 sm:py-20 lg:px-10">
      <div className="border-b border-[var(--bp-border)] pb-8">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Admin // Dashboard</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--bp-text)]">Operations console</h1>
        <p className="mt-4 text-base text-[var(--bp-text-dim)]">
          BuilderPass member, event, and attendance overview.
        </p>
      </div>

      {error && <p className="mt-8 text-sm text-[var(--bp-danger)]">{error}</p>}

      {!counts ? (
        !error && <p className="mt-8 text-[var(--bp-text-dim)]">Loading dashboard...</p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map(([label, key, to]) => (
            <Link
              className="group border border-[var(--bp-border)] bg-[var(--bp-surface)] p-5 transition-colors duration-150 hover:border-[var(--bp-amber)]"
              key={key}
              to={to}
            >
              <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">{label}</p>
              <p className="mt-3 text-4xl font-black text-[var(--bp-text)] group-hover:text-[var(--bp-amber)]">
                {String(counts[key]).padStart(2, '0')}
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 border-t border-[var(--bp-border)] pt-10">
        <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">Quick actions</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center gap-2 border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-5 py-3 font-bold uppercase tracking-wide text-black transition-colors duration-150 hover:bg-[var(--bp-amber-strong)]"
            to="/admin/members"
          >
            Members
            <ArrowRight size={16} />
          </Link>
          <Link
            className="inline-flex items-center gap-2 border border-[var(--bp-border)] bg-[var(--bp-surface)] px-5 py-3 font-bold uppercase tracking-wide text-[var(--bp-text)] transition-colors duration-150 hover:border-[var(--bp-amber)] hover:text-[var(--bp-amber)]"
            to="/admin/members/import"
          >
            Import members
            <ArrowRight size={16} />
          </Link>
          <Link
            className="inline-flex items-center gap-2 border border-[var(--bp-border)] bg-[var(--bp-surface)] px-5 py-3 font-bold uppercase tracking-wide text-[var(--bp-text)] transition-colors duration-150 hover:border-[var(--bp-amber)] hover:text-[var(--bp-amber)]"
            to="/admin/events"
          >
            Events
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
