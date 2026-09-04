import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthField from '../../components/auth/AuthField.jsx'
import AuthInput from '../../components/auth/AuthInput.jsx'
import { supabase } from '../../services/supabase/client.js'
import { getAuthErrorMessage } from '../../utils/authErrors.js'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrorMessage('Enter a valid email address.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      setIsSent(true)
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'recovery'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-lg px-5 py-12 sm:py-20">
      <div className="border border-[var(--bp-card-border)] bg-[var(--bp-surface)] p-6 sm:p-10">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Account recovery</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--bp-text)]">Reset your password</h1>
        <div className="mt-4 h-px w-16 bg-[var(--bp-border-strong)]" />

        {isSent ? (
          <div className="mt-7" role="status">
            <CheckCircle2 className="text-[var(--bp-success)]" size={30} />
            <p className="mt-4 font-bold text-[var(--bp-text)]">Check your email</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--bp-text-dim)]">
              If a BuilderPass account exists for that address, a password-reset link has been sent.
            </p>
            <button
              className="mt-6 text-sm font-bold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]"
              onClick={() => setIsSent(false)}
              type="button"
            >
              Send another link
            </button>
          </div>
        ) : (
          <>
            <p className="mt-5 text-[var(--bp-text-dim)]">Enter the email connected to your account.</p>

            {errorMessage && (
              <p className="mt-6 border border-[var(--bp-danger)]/40 bg-[var(--bp-danger)]/10 px-4 py-3 text-sm text-[var(--bp-danger)]" role="alert">
                {errorMessage}
              </p>
            )}

            <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
              <AuthField htmlFor="reset-email" label="Email">
                <AuthInput
                  autoComplete="email"
                  autoFocus
                  id="reset-email"
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  value={email}
                />
              </AuthField>
              <button
                className="w-full border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-4 py-3.5 font-bold uppercase tracking-wide text-black hover:bg-[var(--bp-amber-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-sm text-[var(--bp-text-dim)]">
          Remembered your password? <Link className="font-semibold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]" to="/login">Sign in</Link>.
        </p>
      </div>
    </section>
  )
}
