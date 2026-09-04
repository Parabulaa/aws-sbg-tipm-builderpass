import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthField from '../../components/auth/AuthField.jsx'
import PasswordInput from '../../components/auth/PasswordInput.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../services/supabase/client.js'
import { getPasswordStrength, PASSWORD_REQUIREMENTS } from '../../utils/passwordStrength.js'
import { getAuthErrorMessage } from '../../utils/authErrors.js'
import { getRecoveryLinkError } from '../../utils/authRecovery.js'

export default function ResetPasswordPage() {
  const { clearPasswordRecovery, isLoading, isPasswordRecovery, session } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const recoveryLinkError = getRecoveryLinkError(location.search, location.hash)
  const canResetPassword = Boolean(session && isPasswordRecovery && !recoveryLinkError)

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

      clearPasswordRecovery()
      await supabase.auth.signOut({ scope: 'local' })
      navigate('/login', {
        replace: true,
        state: { notice: 'Your password was updated. Sign in with your new password.' },
      })
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'reset'))
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

        {!canResetPassword ? (
          <div className="mt-7">
            <p className="text-sm leading-relaxed text-[var(--bp-danger)]">
              {recoveryLinkError || 'This password-reset session is invalid or has already been used.'}
            </p>
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
              <AuthField htmlFor="new-password" label="New password">
                <PasswordInput
                  id="new-password"
                  isVisible={showPassword}
                  label="new password"
                  onChange={(event) => setPassword(event.target.value)}
                  onToggleVisibility={() => setShowPassword((current) => !current)}
                  value={password}
                />
              </AuthField>
              <p className="-mt-3 text-xs leading-relaxed text-[var(--bp-text-dim)]">{PASSWORD_REQUIREMENTS}</p>
              <AuthField htmlFor="confirm-new-password" label="Confirm new password">
                <PasswordInput
                  id="confirm-new-password"
                  isVisible={showConfirmation}
                  label="new password confirmation"
                  onChange={(event) => setConfirmation(event.target.value)}
                  onToggleVisibility={() => setShowConfirmation((current) => !current)}
                  value={confirmation}
                />
              </AuthField>
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
