import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Dialog from '../../components/Dialog.jsx'
import { supabase } from '../../services/supabase/client.js'

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
  if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.'
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.'

  return errors
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submissionError, setSubmissionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

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

      setForm(initialForm)
      setSuccessMessage(
        data.session
          ? 'Your BuilderPass account was created successfully.'
          : 'Your account was created. Check your email to confirm it before signing in.',
      )
    } catch (error) {
      setSubmissionError(error.message || 'We could not create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
      <div className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 sm:p-10">
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
              <input
                autoComplete="organization-title"
                className={inputClassName(errors.course)}
                id="course"
                name="course"
                onChange={handleChange}
                value={form.course}
              />
            </Field>

            <Field label="Year level" error={errors.yearLevel}>
              <select
                className={inputClassName(errors.yearLevel)}
                id="yearLevel"
                name="yearLevel"
                onChange={handleChange}
                value={form.yearLevel}
              >
                <option value="">Select year level</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </Field>
          </div>

          <div className="space-y-5 border-t border-[var(--bp-border)] pt-6">
            <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-muted)]">Password</p>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Password" error={errors.password}>
                <input
                  autoComplete="new-password"
                  className={inputClassName(errors.password)}
                  id="password"
                  name="password"
                  onChange={handleChange}
                  type="password"
                  value={form.password}
                />
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword}>
                <input
                  autoComplete="new-password"
                  className={inputClassName(errors.confirmPassword)}
                  id="confirmPassword"
                  name="confirmPassword"
                  onChange={handleChange}
                  type="password"
                  value={form.confirmPassword}
                />
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
            onClick={() => navigate('/login')}
            type="button"
          >
            Continue to Login
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

function Field({ children, error, label }) {
  const inputId = children.props.id

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

function inputClassName(error) {
  return `w-full border bg-[var(--bp-bg-soft)] px-4 py-3 text-[var(--bp-text)] outline-none transition-colors focus:border-[var(--bp-amber)] focus:ring-1 focus:ring-[var(--bp-amber)] ${
    error ? 'border-[var(--bp-danger)]' : 'border-[var(--bp-border)]'
  }`
}
