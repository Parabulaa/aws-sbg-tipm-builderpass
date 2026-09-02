import { useEffect, useState } from 'react'
import SelectControl from '../../components/SelectControl.jsx'
import { normalizeCourse, TIP_MANILA_COURSES, YEAR_LEVELS } from '../../constants/academics.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../services/supabase/client.js'
import { getDatabaseFeatureMessage } from '../../utils/supabaseCompatibility.js'

const fields = [
  ['AWS SBG Member ID', 'student_number'],
  ['First name', 'first_name'],
  ['Last name', 'last_name'],
  ['Email', 'email'],
  ['Course / Program', 'course'],
  ['Year level', 'year_level'],
  ['Section', 'section'],
  ['Role', 'role'],
]

const emptyForm = { firstName: '', lastName: '', course: '', yearLevel: '', section: '' }

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!profile || isEditing) return

    setForm({
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      course: normalizeCourse(profile.course),
      yearLevel: profile.year_level ? String(profile.year_level) : '',
      section: profile.section || '',
    })
  }, [isEditing, profile])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrorMessage('')
    setSuccessMessage('')
  }

  function cancelEditing() {
    setIsEditing(false)
    setErrorMessage('')
    setForm({
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      course: normalizeCourse(profile?.course),
      yearLevel: profile?.year_level ? String(profile.year_level) : '',
      section: profile?.section || '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.firstName.trim() || !form.lastName.trim() || !form.course || !form.yearLevel) {
      setErrorMessage('First name, last name, course, and year level are required.')
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSaving(true)

    try {
      const { error } = await supabase.rpc('update_own_profile', {
        p_first_name: form.firstName.trim(),
        p_last_name: form.lastName.trim(),
        p_course: form.course,
        p_year_level: Number(form.yearLevel),
        p_section: form.section.trim() || null,
      })

      if (error) throw error

      await refreshProfile()
      setIsEditing(false)
      setSuccessMessage('Your profile was updated successfully.')
    } catch (error) {
      setErrorMessage(getDatabaseFeatureMessage(error, 'We could not update your profile. Please try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 sm:py-20 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[var(--bp-border)] pb-8">
        <div>
          <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Member // Profile</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--bp-text)]">My profile</h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--bp-text-dim)]">Review and maintain your BuilderPass membership details.</p>
        </div>
        {!isEditing && (
          <button
            className="border-2 border-[var(--bp-amber)] px-5 py-2.5 font-bold uppercase tracking-wide text-[var(--bp-amber)] transition-colors hover:bg-[var(--bp-amber)] hover:text-black"
            onClick={() => {
              setIsEditing(true)
              setSuccessMessage('')
            }}
            type="button"
          >
            Edit profile
          </button>
        )}
      </div>

      {errorMessage && <p className="mt-6 border border-[var(--bp-danger)] bg-[var(--bp-danger)]/10 px-4 py-3 text-sm text-[var(--bp-danger)]" role="alert">{errorMessage}</p>}
      {successMessage && <p className="mt-6 border border-[var(--bp-success)] bg-[var(--bp-success)]/10 px-4 py-3 text-sm text-[var(--bp-success)]" role="status">{successMessage}</p>}

      {isEditing ? (
        <form className="bp-panel-outline mt-10 space-y-5 bg-[var(--bp-surface)] p-6 sm:p-8" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="First name" htmlFor="profile-first-name">
              <input className={inputClassName} id="profile-first-name" name="firstName" onChange={handleChange} value={form.firstName} />
            </FormField>
            <FormField label="Last name" htmlFor="profile-last-name">
              <input className={inputClassName} id="profile-last-name" name="lastName" onChange={handleChange} value={form.lastName} />
            </FormField>
          </div>

          <FormField label="Course or program" htmlFor="profile-course">
            <SelectControl className="w-full" id="profile-course" name="course" onChange={handleChange} options={courseOptions} value={form.course} />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Year level" htmlFor="profile-year-level">
              <SelectControl className="w-full" id="profile-year-level" name="yearLevel" onChange={handleChange} options={yearOptions} value={form.yearLevel} />
            </FormField>
            <FormField label="Section (optional)" htmlFor="profile-section">
              <input className={inputClassName} id="profile-section" name="section" onChange={handleChange} value={form.section} />
            </FormField>
          </div>

          <div className="border border-[var(--bp-border)] bg-[var(--bp-bg-soft)] px-4 py-3 text-sm text-[var(--bp-text-dim)]">
            Membership ID, email, and role are protected account fields and cannot be changed here.
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button className="border border-[var(--bp-border)] px-5 py-2.5 font-bold text-[var(--bp-text)] hover:border-[var(--bp-amber)]" disabled={isSaving} onClick={cancelEditing} type="button">Cancel</button>
            <button className="bg-[var(--bp-amber)] px-5 py-2.5 font-bold uppercase tracking-wide text-black hover:bg-[var(--bp-amber-strong)] disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      ) : (
        <dl className="mt-10 divide-y divide-[var(--bp-border)] border border-[var(--bp-border)] bg-[var(--bp-surface)]">
          {fields.map(([label, key]) => (
            <div className="grid gap-1 px-6 py-4 sm:grid-cols-[220px_1fr] sm:items-center sm:gap-4" key={key}>
              <dt className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">{label}</dt>
              <dd className="font-bold text-[var(--bp-text)]">
                {formatProfileValue(profile, key)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

function FormField({ children, htmlFor, label }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--bp-text-muted)]" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}

const inputClassName = 'bp-control w-full bg-[var(--bp-bg-soft)] px-4 py-3 text-[var(--bp-text)] outline-none focus:ring-1 focus:ring-[var(--bp-amber)]'

const courseOptions = [
  { value: '', label: 'Select course or program' },
  ...TIP_MANILA_COURSES.map((course) => ({ value: course, label: course })),
]

const yearOptions = [
  { value: '', label: 'Select year level' },
  ...YEAR_LEVELS.map((year) => ({ value: String(year), label: `Year ${year}` })),
]

function formatProfileValue(profile, key) {
  const value = key === 'course' ? normalizeCourse(profile?.course) : profile?.[key]
  return value !== undefined && value !== null && value !== '' ? String(value) : 'Not set'
}
