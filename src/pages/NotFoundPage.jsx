import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Page not found</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">That page is not available.</h1>
      <Link className="mt-6 inline-block font-medium text-indigo-700 hover:text-indigo-900" to="/">
        Return home
      </Link>
    </section>
  )
}
