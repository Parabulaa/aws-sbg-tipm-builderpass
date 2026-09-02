import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Dialog from '../../components/Dialog.jsx'
import SelectControl from '../../components/SelectControl.jsx'
import { TIP_MANILA_COURSES, YEAR_LEVELS } from '../../constants/academics.js'
import { supabase } from '../../services/supabase/client.js'
import { getPasswordStrength, PASSWORD_REQUIREMENTS } from '../../utils/passwordStrength.js'

const initialForm = {
  studentNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  course: '',
  yearLevel: '',
  password: '',
  confirmPassword: '',
}

function validateForm(form) {
  const errors = {}
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!form.studentNumber.trim()) errors.studentNumber = 'Student number is required.'
  if (!form.firstName.trim()) errors.firstName = 'First name is required.'
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.'
  if (!emailPattern.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (!form.course.trim()) errors.course = 'Course or program is required.'
  if (!form.yearLevel) errors.yearLevel = 'Select a year level.'
  if (getPasswordStrength(form.password).score < 4) errors.password = 'Password must meet every requirement below.'
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.'

  return errors
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submissionError, setSubmissionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const passwordError = form.password ? errors.password : ''
  const hasConfirmPassword = Boolean(form.confirmPassword)
  const passwordsMatch = hasConfirmPassword && form.password === form.confirmPassword

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmissionError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    setSubmissionError('')
    setSuccessMessage('')

    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            student_number: form.studentNumber.trim(),
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            course: form.course.trim(),
            year_level: Number(form.yearLevel),
          },
        },
      })

      if (error) throw error

      if (!data.user || data.user.identities?.length === 0) {
        setSubmissionError('An account may already exist for this email. Try signing in instead.')
        return
      }

      const requiresEmailConfirmation = !data.session

      // Supabase creates an active session immediately when email confirmation
      // is disabled. End that session so registration never signs the new member
      // in automatically; they can enter their credentials on the login page.
      if (data.session) {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
        if (signOutError) throw signOutError
      }

      setForm(initialForm)
      setSuccessMessage(
        requiresEmailConfirmation
          ? 'Your account was created. Check your email to confirm it before signing in.'
          : 'Your BuilderPass account was created successfully. Sign in manually to continue.',
      )
    } catch (error) {
      setSubmissionError(error.message || 'We could not create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
      <div className="bp-panel-outline bg-[var(--bp-surface)] p-6 sm:p-10">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">
          Member registration
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--bp-text)]">Create your account</h1>
        <div className="mt-4 h-[1px] w-16 bg-[var(--bp-border-strong)]" />
        <p className="mt-5 text-[var(--bp-text-dim)]">Use your own membership details to join BuilderPass.</p>

        {submissionError && (
          <div
            className="mt-6 border border-[var(--bp-danger)]/30 bg-[var(--bp-danger)]/10 px-4 py-3 text-sm text-[var(--bp-danger)] animate-[bp-page-in_220ms_ease-out_both]"
            role="alert"
          >
            {submissionError}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-muted)]">
              Student info
            </p>

            <Field label="AWS SBG Member ID" error={errors.studentNumber}>
              <input
                autoComplete="off"
                className={inputClassName(errors.studentNumber)}
                id="studentNumber"
                name="studentNumber"
                onChange={handleChange}
                value={form.studentNumber}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" error={errors.firstName}>
                <input
                  autoComplete="given-name"
                  className={inputClassName(errors.firstName)}
                  id="firstName"
                  name="firstName"
                  onChange={handleChange}
                  value={form.firstName}
                />
              </Field>
              <Field label="Last name" error={errors.lastName}>
                <input
                  autoComplete="family-name"
                  className={inputClassName(errors.lastName)}
                  id="lastName"
                  name="lastName"
                  onChange={handleChange}
                  value={form.lastName}
                />
              </Field>
            </div>

            <Field label="Email" error={errors.email}>
              <input
                autoComplete="email"
                className={inputClassName(errors.email)}
                id="email"
                name="email"
                onChange={handleChange}
                type="email"
                value={form.email}
              />
            </Field>
          </div>

          <div className="space-y-5 border-t border-[var(--bp-border)] pt-6">
            <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-muted)]">
              Academic details
            </p>

            <Field label="Course or program" error={errors.course}>
              <SelectControl
                className="w-full"
                id="course"
                name="course"
                onChange={handleChange}
                options={courseOptions}
                value={form.course}
              />
            </Field>

            <Field label="Year level" error={errors.yearLevel}>
              <SelectControl
                className="w-full"
                id="yearLevel"
                name="yearLevel"
                onChange={handleChange}
                options={yearOptions}
                value={form.yearLevel}
              />
            </Field>
          </div>

          <div className="space-y-5 border-t border-[var(--bp-border)] pt-6">
            <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-muted)]">Password</p>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Password" error={passwordError} htmlFor="password">
                <div>
                  <PasswordInput
                    describedBy="password-requirements"
                    error={passwordError}
                    id="password"
                    isVisible={showPassword}
                    name="password"
                    onChange={handleChange}
                    onToggleVisibility={() => setShowPassword((current) => !current)}
                    value={form.password}
                  />
                  <PasswordStrength password={form.password} />
                </div>
              </Field>
              <Field label="Confirm password" htmlFor="confirmPassword">
                <div>
                  <PasswordInput
                    describedBy={hasConfirmPassword ? 'confirm-password-status' : undefined}
                    error={hasConfirmPassword && !passwordsMatch}
                    id="confirmPassword"
                    isVisible={showConfirmPassword}
                    name="confirmPassword"
                    onChange={handleChange}
                    onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
                    value={form.confirmPassword}
                  />
                  <PasswordMatchStatus confirmPassword={form.confirmPassword} password={form.password} />
                </div>
              </Field>
            </div>
          </div>

          <button
            className="w-full border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-4 py-3.5 font-bold uppercase tracking-wide text-black transition-colors duration-150 hover:bg-[var(--bp-amber-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--bp-text-dim)]">
          Already registered?{' '}
          <Link className="font-semibold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]" to="/login">
            Sign in
          </Link>
          .
        </p>
        <Link
          className="mt-3 inline-block text-sm font-semibold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]"
          to="/"
        >
          Return home →
        </Link>
      </div>

      <Dialog
        icon={CheckCircle2}
        isOpen={Boolean(successMessage)}
        onClose={() => setSuccessMessage('')}
        titleId="register-success-title"
        tone="success"
      >
        <h2 className="text-xl font-black tracking-tight text-[var(--bp-text)]" id="register-success-title">
          Registration successful
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--bp-text-dim)]">{successMessage}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-black transition-colors duration-150 hover:bg-[var(--bp-amber-strong)]"
            onClick={() => {
              setSuccessMessage('')
              navigate('/login')
            }}
            type="button"
          >
            Go to Login
          </button>
          <button
            className="border border-[var(--bp-border)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--bp-text-dim)] transition-colors duration-150 hover:border-[var(--bp-amber)] hover:text-[var(--bp-amber)]"
            onClick={() => setSuccessMessage('')}
            type="button"
          >
            Close
          </button>
        </div>
      </Dialog>
    </section>
  )
}

function Field({ children, error, htmlFor, label }) {
  const inputId = htmlFor || children.props.id

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--bp-text-muted)]" htmlFor={inputId}>
        {label}
      </label>
      {children}
      {error && <p className="mt-2 text-sm text-[var(--bp-danger)]">{error}</p>}
    </div>
  )
}

function PasswordInput({ describedBy, error, id, isVisible, name, onChange, onToggleVisibility, value }) {
  const VisibilityIcon = isVisible ? EyeOff : Eye

  return (
    <div className="relative">
      <input
        aria-describedby={describedBy}
        autoComplete="new-password"
        className={`${inputClassName(error)} pr-12`}
        id={id}
        name={name}
        onChange={onChange}
        type={isVisible ? 'text' : 'password'}
        value={value}
      />
      <button
        aria-label={`${isVisible ? 'Hide' : 'Show'} ${name === 'confirmPassword' ? 'confirmation password' : 'password'}`}
        aria-pressed={isVisible}
        className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-[var(--bp-text-dim)] transition-colors hover:text-[var(--bp-amber)]"
        onClick={onToggleVisibility}
        type="button"
      >
        <VisibilityIcon aria-hidden="true" size={19} />
      </button>
    </div>
  )
}

function PasswordStrength({ password }) {
  if (!password) {
    return <p className="mt-2 text-xs leading-relaxed text-[var(--bp-text-dim)]" id="password-requirements">{PASSWORD_REQUIREMENTS}</p>
  }

  const strength = getPasswordStrength(password)
  const visibleScore = Math.max(1, strength.score)
  const meterColor = {
    Weak: 'var(--bp-danger)',
    Fair: '#d98e45',
    Good: 'var(--bp-amber)',
    Strong: 'var(--bp-success)',
  }[strength.label]

  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-[var(--bp-text-muted)]">Password strength</span>
        <span className="mono font-bold uppercase tracking-[.08em]" style={{ color: meterColor }}>
          {strength.label}
        </span>
      </div>
      <div
        aria-label={`Password strength: ${strength.label}`}
        aria-valuemax="4"
        aria-valuemin="0"
        aria-valuenow={strength.score}
        className="mt-2 grid grid-cols-4 gap-1"
        role="meter"
      >
        {[1, 2, 3, 4].map((segment) => (
          <span
            className="h-1.5 bg-[var(--bp-border)] transition-colors"
            key={segment}
            style={segment <= visibleScore ? { backgroundColor: meterColor } : undefined}
          />
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[var(--bp-text-dim)]" id="password-requirements">{PASSWORD_REQUIREMENTS}</p>
    </div>
  )
}

function PasswordMatchStatus({ confirmPassword, password }) {
  if (!confirmPassword) return null

  const matches = password === confirmPassword

  return (
    <p
      className={`mt-2 text-xs font-semibold ${matches ? 'text-[var(--bp-success)]' : 'text-[var(--bp-danger)]'}`}
      id="confirm-password-status"
      role="status"
    >
      {matches ? '✓ Passwords match' : 'Passwords do not match'}
    </p>
  )
}

function inputClassName(error) {
  return `bp-control w-full bg-[var(--bp-bg-soft)] px-4 py-3 text-[var(--bp-text)] outline-none transition-colors focus:ring-1 focus:ring-[var(--bp-amber)] ${
    error ? 'bp-control-error' : ''
  }`
}

const courseOptions = [
  { value: '', label: 'Select course or program' },
  ...TIP_MANILA_COURSES.map((course) => ({ value: course, label: course })),
]

const yearOptions = [
  { value: '', label: 'Select year level' },
  ...YEAR_LEVELS.map((year) => ({ value: String(year), label: `Year ${year}` })),
]
