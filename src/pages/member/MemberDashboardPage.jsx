import { useAuth } from '../../context/AuthContext.jsx'

export default function MemberDashboardPage() {
  const { profile } = useAuth()

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Member area</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}.
      </h1>
      <p className="mt-4 text-slate-600">You are signed in to BuilderPass. Event viewing will be added in the next feature.</p>
    </section>
  )
}
