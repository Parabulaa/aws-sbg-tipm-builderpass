import { useState } from 'react'
import { Link } from 'react-router-dom'
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
    <section className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Member registration</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Create your account</h1>
        <p className="mt-3 text-slate-600">Use your own membership details to join BuilderPass.</p>

        {submissionError && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {submissionError}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
            {successMessage}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <Field label="Student number" error={errors.studentNumber}>
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

          <button
            className="w-full rounded-md bg-indigo-700 px-4 py-3 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-indigo-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already registered? <span className="text-slate-500">Sign-in will be available in the next stage.</span>
        </p>
        <Link className="mt-3 inline-block text-sm font-medium text-indigo-700 hover:text-indigo-900" to="/">
          Return home
        </Link>
      </div>
    </section>
  )
}

function Field({ children, error, label }) {
  const inputId = children.props.id

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor={inputId}>
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  )
}

function inputClassName(error) {
  return `w-full rounded-md border bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:ring-2 focus:ring-indigo-500 ${
    error ? 'border-red-400' : 'border-slate-300'
  }`
}
