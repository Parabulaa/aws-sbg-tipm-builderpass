import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProfileRecoveryPage() {
  const { isLoading, profile, profileError, refreshProfile, session, signOut } = useAuth()
  const [actionError, setActionError] = useState('')
  const [isRetrying, setIsRetrying] = useState(false)
  const navigate = useNavigate()

  if (isLoading) {
    return <section className="mx-auto max-w-lg px-5 py-16 text-[var(--bp-text-dim)]">Checking your member profile...</section>
  }

  if (!session) return <Navigate replace to="/login" />
  if (profile) return <Navigate replace to={profile.role === 'ADMIN' ? '/admin' : '/dashboard'} />

  async function retryProfile() {
    setActionError('')
    setIsRetrying(true)
    try {
      const nextProfile = await refreshProfile()
      if (nextProfile) navigate(nextProfile.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true })
    } catch {
      setActionError('BuilderPass still cannot load your member profile. Try again or sign out.')
    } finally {
      setIsRetrying(false)
    }
  }

  async function handleSignOut() {
    setActionError('')
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      setActionError('We could not sign you out. Please try again.')
    }
  }

  return (
    <section className="mx-auto max-w-lg px-5 py-12 sm:py-20">
      <div className="border border-[var(--bp-card-border)] bg-[var(--bp-surface)] p-6 sm:p-10">
        <div className="grid h-12 w-12 place-items-center border border-[var(--bp-amber)] bg-[var(--bp-amber)]/10 text-[var(--bp-amber)]">
          <AlertTriangle aria-hidden="true" size={23} />
        </div>
        <p className="mono mt-5 text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Account recovery</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--bp-text)]">Member profile unavailable</h1>
        <p className="mt-4 leading-relaxed text-[var(--bp-text-dim)]">
          {profileError
            ? 'Your account is signed in, but BuilderPass could not load its member profile.'
            : 'Your account is signed in, but it is not connected to a BuilderPass member profile. Ask an administrator to verify your membership record.'}
        </p>
        {actionError && <p className="mt-5 text-sm text-[var(--bp-danger)]" role="alert">{actionError}</p>}
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--bp-amber)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-black hover:bg-[var(--bp-amber-strong)] disabled:opacity-60"
            disabled={isRetrying}
            onClick={retryProfile}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={17} /> {isRetrying ? 'Retrying...' : 'Try again'}
          </button>
          <button className="min-h-12 border border-[var(--bp-border)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-[var(--bp-text-muted)] hover:border-[var(--bp-amber)]" onClick={handleSignOut} type="button">
            Sign out
          </button>
        </div>
      </div>
    </section>
  )
}
