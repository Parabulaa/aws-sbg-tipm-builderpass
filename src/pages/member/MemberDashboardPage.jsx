import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function MemberDashboardPage() {
  const { profile } = useAuth()

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Member area</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}.
      </h1>
      <p className="mt-4 text-slate-600">You are signed in to BuilderPass. See the latest available events.</p>
      <Link
        className="mt-6 inline-flex rounded-md bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800"
        to="/events"
      >
        View events
      </Link>
    </section>
  )
}
