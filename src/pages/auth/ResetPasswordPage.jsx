import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../services/supabase/client.js'
import { getPasswordStrength, PASSWORD_REQUIREMENTS } from '../../utils/passwordStrength.js'

export default function ResetPasswordPage() {
  const { isLoading, session } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (getPasswordStrength(password).score < 4) {
      setErrorMessage('Your new password must meet every requirement below.')
      return
    }

    if (password !== confirmation) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      await supabase.auth.signOut({ scope: 'local' })
      navigate('/login', {
        replace: true,
        state: { notice: 'Your password was updated. Sign in with your new password.' },
      })
    } catch (error) {
      setErrorMessage(error.message || 'We could not update your password. Request a new reset link and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <section className="mx-auto max-w-lg px-5 py-16 text-[var(--bp-text-dim)]">Checking reset link...</section>
  }

  return (
    <section className="mx-auto max-w-lg px-5 py-12 sm:py-20">
      <div className="border border-[var(--bp-card-border)] bg-[var(--bp-surface)] p-6 sm:p-10">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Account recovery</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--bp-text)]">Choose a new password</h1>
        <div className="mt-4 h-px w-16 bg-[var(--bp-border-strong)]" />

        {!session ? (
          <div className="mt-7">
            <p className="text-sm leading-relaxed text-[var(--bp-danger)]">This reset link is invalid or has expired.</p>
            <Link className="mt-5 inline-block font-bold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]" to="/forgot-password">
              Request a new link →
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <p className="mt-6 border border-[var(--bp-danger)]/40 bg-[var(--bp-danger)]/10 px-4 py-3 text-sm text-[var(--bp-danger)]" role="alert">
                {errorMessage}
              </p>
            )}
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <PasswordField
                autoComplete="new-password"
                id="new-password"
                isVisible={showPassword}
                label="New password"
                onChange={setPassword}
                onToggle={() => setShowPassword((current) => !current)}
                value={password}
              />
              <p className="-mt-3 text-xs leading-relaxed text-[var(--bp-text-dim)]">{PASSWORD_REQUIREMENTS}</p>
              <PasswordField
                autoComplete="new-password"
                id="confirm-new-password"
                isVisible={showConfirmation}
                label="Confirm new password"
                onChange={setConfirmation}
                onToggle={() => setShowConfirmation((current) => !current)}
                value={confirmation}
              />
              <button
                className="w-full border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-4 py-3.5 font-bold uppercase tracking-wide text-black hover:bg-[var(--bp-amber-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  )
}

function PasswordField({ autoComplete, id, isVisible, label, onChange, onToggle, value }) {
  const VisibilityIcon = isVisible ? EyeOff : Eye

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--bp-text-muted)]" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          autoComplete={autoComplete}
          className="bp-control h-12 w-full bg-[var(--bp-bg-soft)] px-4 pr-12 text-[var(--bp-text)] outline-none transition-colors"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          type={isVisible ? 'text' : 'password'}
          value={value}
        />
        <button
          aria-label={`${isVisible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          className="bp-password-visibility-toggle absolute right-0 top-0 flex h-full w-12 items-center justify-center text-[var(--bp-text-dim)] transition-colors hover:text-[var(--bp-text-muted)]"
          onClick={onToggle}
          type="button"
        >
          <VisibilityIcon aria-hidden="true" size={19} />
        </button>
      </div>
    </div>
  )
}
