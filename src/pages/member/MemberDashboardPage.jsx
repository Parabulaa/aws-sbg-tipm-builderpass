import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RetryNotice from '../../components/RetryNotice.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../services/supabase/client.js'
import { eventIsCurrent, eventRegistrationLabel, formatEventDate, formatEventTimeRange } from '../../utils/events.js'
import { eventWithOptionalEndTime, queryWithOptionalEventEndTime } from '../../utils/supabaseCompatibility.js'

export default function MemberDashboardPage() {
  const { profile } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const terminalWelcome = useTerminalWelcome(profile?.first_name)

  useEffect(() => {
    let isActive = true

    async function loadDashboard() {
      if (!profile?.id) {
        setDashboard(null)
        setIsLoading(false)
        return
      }

      setDashboard(null)
      setErrorMessage('')
      setWarningMessage('')
      setIsLoading(true)

      const [attendanceResult, registrationsResult] = await Promise.all([
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('status', 'PRESENT'),
        queryWithOptionalEventEndTime((includeEndTime) => supabase
          .from('event_registrations')
          .select(includeEndTime
            ? 'id, status, events!inner(id, title, event_date, start_time, end_time, venue, registration_status)'
            : 'id, status, events!inner(id, title, event_date, start_time, venue, registration_status)')
          .eq('user_id', profile.id)),
      ])

      if (!isActive) return

      if (attendanceResult.error && registrationsResult.error) {
        setErrorMessage('We could not load your dashboard activity. Please try again.')
        setIsLoading(false)
        return
      }

      const registrations = (registrationsResult.data ?? []).map((registration) => ({
        ...registration,
        events: Array.isArray(registration.events)
          ? registration.events.map(eventWithOptionalEndTime)
          : eventWithOptionalEndTime(registration.events),
      }))

      const currentReservations = registrations
        .filter((registration) => registration.status === 'REGISTERED')
        .map((registration) => getRegistrationEvent(registration))
        .filter((event) => event && eventIsCurrent(event))
        .sort((left, right) => `${left.event_date}T${left.start_time}`.localeCompare(`${right.event_date}T${right.start_time}`))

      setDashboard({
        eventsAttended: attendanceResult.error ? null : attendanceResult.count ?? 0,
        totalRsvps: registrationsResult.error ? null : registrations.length,
        currentReservations: registrationsResult.error ? null : currentReservations.length,
        nextEvent: currentReservations[0] ?? null,
      })
      if (attendanceResult.error) setWarningMessage('RSVP activity loaded, but attendance totals are temporarily unavailable.')
      if (registrationsResult.error) setWarningMessage('Attendance loaded, but RSVP activity is temporarily unavailable.')
      setIsLoading(false)
    }

    loadDashboard()

    return () => {
      isActive = false
    }
  }, [profile?.id, reloadKey])

  return (
    <section className="mx-auto max-w-[90rem] px-6 py-12 sm:py-20 lg:px-10">
      <div className="border-b border-[var(--bp-border)] pb-8">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Dashboard // Member</p>
        <p className="mono mt-5 text-lg font-bold text-[var(--bp-amber)]" aria-label={`Terminal welcome: ${terminalWelcome}`}>
          <span aria-hidden="true">&gt; {terminalWelcome}</span>
          <span aria-hidden="true" className="terminal-cursor">█</span>
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--bp-text)]">
          Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--bp-text-dim)]">
          Here is what is happening in the BuilderPass community.
        </p>
      </div>

      <section className="mt-10" aria-labelledby="member-profile-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">Member profile</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--bp-text)]" id="member-profile-heading">
              {profile?.first_name} {profile?.last_name}
            </h2>
          </div>
          <p className="text-sm text-[var(--bp-text-dim)]">{profile?.email}</p>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ProfileItem label="AWS SBG Member ID" value={profile?.student_number || 'Not set'} />
          <ProfileItem label="Course" value={profile?.course || 'Not set'} />
          <ProfileItem label="Year level" value={profile?.year_level ? `Year ${profile.year_level}` : 'Not set'} />
          <ProfileItem label="Section" value={profile?.section || 'Not set'} />
          <ProfileItem label="Role" value={formatRole(profile?.role)} />
        </dl>
      </section>

      <section className="mt-12" aria-labelledby="member-activity-heading">
        <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">Member activity</p>
        <h2 className="mt-2 text-2xl font-black text-[var(--bp-text)]" id="member-activity-heading">Your event progress</h2>

        {isLoading && <p className="mt-6 text-[var(--bp-text-dim)]">Loading your event activity...</p>}
        {errorMessage && (
          <div className="mt-6 max-w-xl">
            <RetryNotice isRetrying={isLoading} message={errorMessage} onRetry={() => setReloadKey((key) => key + 1)} />
          </div>
        )}
        {warningMessage && <p className="mt-6 border border-[var(--bp-amber-muted)] bg-[var(--bp-amber)]/5 px-4 py-3 text-sm text-[var(--bp-text-muted)]" role="status">{warningMessage}</p>}

        {dashboard && (
          <>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <MetricCard label="Total RSVPs" value={dashboard.totalRsvps} />
              <MetricCard label="Current reservations" value={dashboard.currentReservations} />
              <MetricCard label="Events attended" value={dashboard.eventsAttended} />
            </div>

            <div className="mt-6 border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6">
              <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">Next event</p>
              {dashboard.nextEvent ? (
                <div className="mt-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-[var(--bp-text)]">{dashboard.nextEvent.title}</h3>
                      <div className="mt-3 space-y-2 text-sm text-[var(--bp-text-dim)]">
                        <p className="flex items-center gap-2">
                          <CalendarDays size={16} className="text-[var(--bp-amber)]" />
                          {formatEventDate(dashboard.nextEvent.event_date)} // {formatEventTimeRange(dashboard.nextEvent.start_time, dashboard.nextEvent.end_time)}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={16} className="text-[var(--bp-amber)]" />
                          {dashboard.nextEvent.venue}
                        </p>
                      </div>
                    </div>
                    <span className="mono border border-[var(--bp-border)] bg-[var(--bp-bg-soft)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--bp-text-dim)]">
                      {eventRegistrationLabel(dashboard.nextEvent)}
                    </span>
                  </div>
                  <Link
                    className="mt-5 inline-flex items-center gap-2 font-bold text-[var(--bp-amber)] transition-colors hover:text-[var(--bp-amber-strong)]"
                    to={`/events/${dashboard.nextEvent.id}`}
                  >
                    View event details
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <p className="mt-4 text-[var(--bp-text-dim)]">You do not have any upcoming RSVPs yet.</p>
              )}
            </div>
          </>
        )}
      </section>

      <div className="mt-12 border-t border-[var(--bp-border)] pt-10">
        <h2 className="text-2xl font-black text-[var(--bp-text)]">Ready to join an event?</h2>
        <p className="mt-3 max-w-2xl text-base text-[var(--bp-text-dim)]">
          Check out upcoming community sessions and register to attend.
        </p>
        <Link
          className="mt-6 inline-flex items-center gap-2 border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-6 py-3 font-bold uppercase tracking-wide text-black transition-transform hover:translate-y-[-1px]"
          to="/events"
        >
          View events
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  )
}

function useTerminalWelcome(firstName) {
  const welcomeText = `welcome("${firstName || 'member'}")`
  const [typedWelcome, setTypedWelcome] = useState('')

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedWelcome(welcomeText)
      return undefined
    }

    let characterCount = 0
    setTypedWelcome('')

    const intervalId = window.setInterval(() => {
      characterCount += 1
      setTypedWelcome(welcomeText.slice(0, characterCount))

      if (characterCount >= welcomeText.length) window.clearInterval(intervalId)
    }, 35)

    return () => window.clearInterval(intervalId)
  }, [welcomeText])

  return typedWelcome
}

function getRegistrationEvent(registration) {
  return Array.isArray(registration.events) ? registration.events[0] : registration.events
}

function formatRole(role) {
  if (!role) return 'Not set'
  return `${role.slice(0, 1)}${role.slice(1).toLowerCase()}`
}

function ProfileItem({ label, value }) {
  return (
    <div className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-5">
      <dt className="mono text-xs font-bold uppercase tracking-[.12em] text-[var(--bp-text-dim)]">{label}</dt>
      <dd className="mt-3 text-lg font-black text-[var(--bp-text)]">{value}</dd>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6">
      <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">{label}</p>
      <p className="mt-4 text-5xl font-black tracking-tight text-[var(--bp-amber)]">{value == null ? '--' : String(value).padStart(2, '0')}</p>
    </div>
  )
}
