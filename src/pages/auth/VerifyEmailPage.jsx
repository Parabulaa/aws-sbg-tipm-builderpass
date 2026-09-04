import { CheckCircle2, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../services/supabase/client.js'
import { getAuthErrorMessage } from '../../utils/authErrors.js'

const pendingEmailKey = 'builderpass.pendingVerificationEmail'

export default function VerifyEmailPage() {
  const location = useLocation()
  const email = location.state?.email || sessionStorage.getItem(pendingEmailKey) || ''
  const [errorMessage, setErrorMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendComplete, setResendComplete] = useState(false)

  async function handleResend() {
    if (!email || isResending) return

    setErrorMessage('')
    setResendComplete(false)
    setIsResending(true)

    try {
      const { error } = await supabase.auth.resend({
        email,
        options: { emailRedirectTo: `${window.location.origin}/login` },
        type: 'signup',
      })

      if (error) throw error
      setResendComplete(true)
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'verification'))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <section className="mx-auto max-w-lg px-5 py-12 sm:py-20">
      <div className="border border-[var(--bp-card-border)] bg-[var(--bp-surface)] p-6 sm:p-10">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Email verification</p>
        <div className="mt-6 grid h-12 w-12 place-items-center border border-[var(--bp-amber)] bg-[var(--bp-amber)]/10 text-[var(--bp-amber)]">
          <Mail aria-hidden="true" size={23} />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-[var(--bp-text)]">Check your inbox</h1>
        <p className="mt-4 leading-relaxed text-[var(--bp-text-dim)]">
          Open the verification link sent to {email ? <strong className="text-[var(--bp-text-muted)]">{email}</strong> : 'your email address'} before signing in.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--bp-text-dim)]">
          The message may take a few minutes. Check your spam folder if it does not appear.
        </p>

        {resendComplete && (
          <p className="mt-6 flex items-center gap-2 border border-[var(--bp-success)]/40 bg-[var(--bp-success)]/10 px-4 py-3 text-sm text-[var(--bp-success)]" role="status">
            <CheckCircle2 aria-hidden="true" size={18} /> A new verification email was sent.
          </p>
        )}
        {errorMessage && (
          <p className="mt-6 border border-[var(--bp-danger)]/40 bg-[var(--bp-danger)]/10 px-4 py-3 text-sm text-[var(--bp-danger)]" role="alert">
            {errorMessage}
          </p>
        )}

        {email ? (
          <button
            className="mt-7 w-full border border-[var(--bp-amber)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-[var(--bp-amber)] transition-colors hover:bg-[var(--bp-amber)]/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isResending}
            onClick={handleResend}
            type="button"
          >
            {isResending ? 'Resending...' : 'Resend verification email'}
          </button>
        ) : (
          <Link className="mt-7 inline-block font-bold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]" to="/register">
            Return to registration →
          </Link>
        )}

        <p className="mt-6 text-sm text-[var(--bp-text-dim)]">
          Already verified? <Link className="font-semibold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]" to="/login">Sign in</Link>.
        </p>
      </div>
    </section>
  )
}
