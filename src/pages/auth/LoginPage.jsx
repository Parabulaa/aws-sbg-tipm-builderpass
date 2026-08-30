import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../services/supabase/client.js'

export default function LoginPage() {
  const { isLoading, profile, session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading || !session || !profile) return

    const requestedPath = location.state?.from?.pathname
    const destination = profile.role === 'ADMIN' ? '/admin' : requestedPath || '/dashboard'

    navigate(destination, { replace: true })
  }, [isLoading, location.state, navigate, profile, session])

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password) {
      setErrorMessage('Enter your email and password.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) throw error
    } catch (error) {
      setErrorMessage(error.message || 'We could not sign you in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-5 py-12 sm:py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Member login</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1>
        <p className="mt-3 text-slate-600">Sign in with the email and password you used to register.</p>

        {errorMessage && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {errorMessage}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:ring-2 focus:ring-indigo-500"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:ring-2 focus:ring-indigo-500"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </div>

          <button
            className="w-full rounded-md bg-indigo-700 px-4 py-3 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-indigo-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Need an account?{' '}
          <Link className="font-medium text-indigo-700 hover:text-indigo-900" to="/register">
            Register here
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
