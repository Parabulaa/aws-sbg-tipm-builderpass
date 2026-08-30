import { useAuth } from '../../context/AuthContext.jsx'

const fields = [
  ['AWS SBG Member ID', 'student_number'],
  ['First name', 'first_name'],
  ['Last name', 'last_name'],
  ['Email', 'email'],
  ['Course / Program', 'course'],
  ['Year level', 'year_level'],
  ['Role', 'role'],
]

export default function ProfilePage() {
  const { profile } = useAuth()

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 sm:py-20 lg:px-10">
      <div className="border-b border-[var(--bp-border)] pb-8">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Member // Profile</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--bp-text)]">My profile</h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--bp-text-dim)]">
          Your BuilderPass membership details, as recorded by AWS Student Builder Group - TIP Manila.
        </p>
      </div>

      <dl className="mt-10 divide-y divide-[var(--bp-border)] border border-[var(--bp-border)] bg-[var(--bp-surface)]">
        {fields.map(([label, key]) => (
          <div className="grid gap-1 px-6 py-4 sm:grid-cols-[220px_1fr] sm:items-center sm:gap-4" key={key}>
            <dt className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">{label}</dt>
            <dd className="font-bold text-[var(--bp-text)]">
              {profile?.[key] !== undefined && profile?.[key] !== null && profile?.[key] !== ''
                ? String(profile[key])
                : 'Not set'}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mono mt-6 text-xs font-bold uppercase tracking-[.12em] text-[var(--bp-text-dim)]">
        Profile editing is not available yet. Contact an AWS SBG TIP Manila officer to update your details.
      </p>
    </section>
  )
}
