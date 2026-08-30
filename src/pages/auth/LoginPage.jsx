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
    <section className="mx-auto max-w-lg px-5 py-12 sm:py-20">
      <div className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 sm:p-10">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Member login</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--bp-text)]">Welcome back</h1>
        <div className="mt-4 h-[1px] w-16 bg-[var(--bp-border-strong)]" />
        <p className="mt-5 text-[var(--bp-text-dim)]">
          Sign in with the email and password you used to register.
        </p>

        {errorMessage && (
          <div
            className="mt-6 animate-[bp-page-in_220ms_ease-out_both] border border-[var(--bp-danger)]/30 bg-[var(--bp-danger)]/10 px-4 py-3 text-sm text-[var(--bp-danger)]"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--bp-text-muted)]" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="w-full border border-[var(--bp-border)] bg-[var(--bp-bg-soft)] px-4 py-3 text-[var(--bp-text)] outline-none transition-colors focus:border-[var(--bp-amber)] focus:ring-1 focus:ring-[var(--bp-amber)]"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--bp-text-muted)]" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="w-full border border-[var(--bp-border)] bg-[var(--bp-bg-soft)] px-4 py-3 text-[var(--bp-text)] outline-none transition-colors focus:border-[var(--bp-amber)] focus:ring-1 focus:ring-[var(--bp-amber)]"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </div>

          <button
            className="w-full border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-4 py-3.5 font-bold uppercase tracking-wide text-black transition-colors duration-150 hover:bg-[var(--bp-amber-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--bp-text-dim)]">
          Need an account?{' '}
          <Link className="font-semibold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]" to="/register">
            Register here
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
