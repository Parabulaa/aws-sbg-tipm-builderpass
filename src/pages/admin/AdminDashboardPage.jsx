import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase/client.js'

const cards = [
  ['Total members', 'members', '/admin/members'],
  ['Total events', 'events', '/admin/events'],
  ['Upcoming events', 'upcoming', '/admin/events'],
  ['Event registrations', 'registrations', '/admin/events'],
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
        supabase.from('event_registrations').select('*', { count: 'exact', head: true }),
        supabase.from('attendance').select('*', { count: 'exact', head: true }),
      ])
      const failed = results.find((result) => result.error)
      if (failed) setError(failed.error.message || 'Could not load dashboard statistics.')
      else setCounts({ members: results[0].count, events: results[1].count, upcoming: results[2].count, registrations: results[3].count, attendance: results[4].count })
    }
    loadCounts()
  }, [])

  return <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Admin dashboard</p>
    <h1 className="mt-3 text-3xl font-bold tracking-tight">BuilderPass overview</h1>
    {error && <p className="mt-6 text-sm text-red-700">{error}</p>}
    {!counts ? !error && <p className="mt-6 text-slate-600">Loading dashboard...</p> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label, key, to]) => <Link className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300" key={key} to={to}><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold">{counts[key]}</p></Link>)}</div>}
    <div className="mt-10 flex flex-wrap gap-3">
      <Link className="rounded-md bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800" to="/admin/members">Members</Link>
      <Link className="rounded-md border border-slate-300 px-4 py-2.5 font-semibold hover:bg-slate-100" to="/admin/members/import">Import members</Link>
      <Link className="rounded-md border border-slate-300 px-4 py-2.5 font-semibold hover:bg-slate-100" to="/admin/events">Events</Link>
    </div>
  </section>
}
