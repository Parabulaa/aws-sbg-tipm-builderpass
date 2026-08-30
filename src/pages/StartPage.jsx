import { Link } from 'react-router-dom'

export default function StartPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center px-5 py-16">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Student Builder Group</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">BuilderPass</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          A simple place for group members, events, and attendance.
        </p>
        <p className="mt-8 text-sm text-slate-500">Start by creating your member account.</p>
        <Link
          className="mt-5 inline-flex rounded-md bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800"
          to="/register"
        >
          Register now
        </Link>
      </div>
    </section>
  )
}
