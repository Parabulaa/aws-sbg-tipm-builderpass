import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BackLink from '../../components/BackLink.jsx'
import { supabase } from '../../services/supabase/client.js'
import { formatEventDate, formatEventTime } from '../../utils/events.js'

const attendanceStatuses = [
  { value: 'NOT_MARKED', label: 'Not marked', selectedClassName: 'bg-slate-700 text-white', idleClassName: 'bg-slate-200 text-slate-800 hover:bg-slate-300' },
  { value: 'PRESENT', label: 'Present', selectedClassName: 'bg-green-700 text-white', idleClassName: 'bg-green-100 text-green-800 hover:bg-green-200' },
  { value: 'DID_NOT_ATTEND', label: 'Did not attend', selectedClassName: 'bg-red-700 text-white', idleClassName: 'bg-red-100 text-red-800 hover:bg-red-200' },
]

export default function EventAttendancePage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [attendanceByUser, setAttendanceByUser] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState('')

  useEffect(() => {
    async function loadAttendance() {
      const [eventResult, registrationsResult, attendanceResult] = await Promise.all([
        supabase.from('events').select('id, title, event_date, start_time').eq('id', id).maybeSingle(),
        supabase
          .from('event_registrations')
          .select('id, user_id, registered_at, profiles(student_number, first_name, last_name, course, year_level, section)')
          .eq('event_id', id)
          .eq('status', 'REGISTERED')
          .order('registered_at', { ascending: true }),
        supabase.from('attendance').select('id, user_id, status, check_in_time').eq('event_id', id),
      ])

      if (eventResult.error || !eventResult.data) {
        setErrorMessage(eventResult.error?.message || 'This event is not available.')
      } else if (registrationsResult.error || attendanceResult.error) {
        setErrorMessage(registrationsResult.error?.message || attendanceResult.error?.message || 'We could not load attendance.')
      } else {
        setEvent(eventResult.data)
        setRegistrations(registrationsResult.data)
        setAttendanceByUser(
          Object.fromEntries(attendanceResult.data.map((attendance) => [attendance.user_id, attendance])),
        )
      }

      setIsLoading(false)
    }

    loadAttendance()
  }, [id])

  async function recordAttendance(userId, status) {
    setErrorMessage('')
    setSavingUserId(userId)

    try {
      const { data, error } = await supabase
        .from('attendance')
        .upsert(
          {
            event_id: id,
            user_id: userId,
            status,
            check_in_time: status === 'PRESENT' ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id,event_id' },
        )
        .select('id, user_id, status, check_in_time')
        .single()

      if (error) throw error

      setAttendanceByUser((current) => ({ ...current, [userId]: data }))
    } catch (error) {
      setErrorMessage(error.message || 'We could not record attendance. Please try again.')
    } finally {
      setSavingUserId('')
    }
  }

  if (isLoading) {
    return <section className="mx-auto max-w-6xl px-5 py-12 text-slate-600">Loading attendance...</section>
  }

  if (!event) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm text-red-700">{errorMessage}</p>
        <div className="mt-5">
          <BackLink to="/admin/events">Back to events</BackLink>
        </div>
      </section>
    )
  }

  const summary = getAttendanceSummary(registrations, attendanceByUser)

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
      <BackLink to="/admin/events">Back to events</BackLink>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Manual attendance</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{event.title}</h1>
      <p className="mt-3 text-slate-600">
        {formatEventDate(event.event_date)} at {formatEventTime(event.start_time)}
      </p>
      {errorMessage && <p className="mt-6 text-sm text-red-700">{errorMessage}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Registered" value={summary.registered} />
        <SummaryCard label="Present" tone="success" value={summary.present} />
        <SummaryCard label="Did not attend" tone="danger" value={summary.didNotAttend} />
        <SummaryCard label="Not marked" value={summary.notMarked} />
      </div>

      {registrations.length === 0 ? (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-600">No registered members are available for attendance.</p>
      ) : (
        <div className="bp-scroll mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-[1100px] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-medium">AWS SBG Member ID</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Year</th>
                <th className="px-5 py-3 font-medium">Section</th>
                <th className="px-5 py-3 font-medium">RSVP status</th>
                <th className="px-5 py-3 font-medium">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {registrations.map((registration) => {
                const member = registration.profiles
                const attendance = attendanceByUser[registration.user_id]
                const attendanceStatus = attendance?.status ?? 'NOT_MARKED'
                const isSaving = savingUserId === registration.user_id

                return (
                  <tr key={registration.id}>
                    <td className="px-5 py-3">{member?.student_number || 'Unavailable'}</td>
                    <td className="px-5 py-3">{member ? `${member.first_name} ${member.last_name}` : 'Unavailable'}</td>
                    <td className="px-5 py-3">{member?.course || 'Not set'}</td>
                    <td className="px-5 py-3">{member?.year_level ? `Year ${member.year_level}` : 'Not set'}</td>
                    <td className="px-5 py-3">{member?.section || 'Not set'}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">Registered</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {attendanceStatuses.map((status) => (
                          <button
                            aria-pressed={attendanceStatus === status.value}
                            className={`rounded-md px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                              attendanceStatus === status.value ? status.selectedClassName : status.idleClassName
                            }`}
                            disabled={isSaving}
                            key={status.value}
                            onClick={() => recordAttendance(registration.user_id, status.value)}
                            type="button"
                          >
                            {isSaving ? 'Saving...' : status.label}
                          </button>
                        ))}
                        {attendance?.check_in_time && attendanceStatus === 'PRESENT' && (
                          <span className="text-xs text-slate-500">Marked {new Date(attendance.check_in_time).toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function getAttendanceSummary(registrations, attendanceByUser) {
  return registrations.reduce(
    (summary, registration) => {
      const status = attendanceByUser[registration.user_id]?.status ?? 'NOT_MARKED'
      summary.registered += 1

      if (status === 'PRESENT') summary.present += 1
      else if (status === 'DID_NOT_ATTEND') summary.didNotAttend += 1
      else summary.notMarked += 1

      return summary
    },
    { registered: 0, present: 0, didNotAttend: 0, notMarked: 0 },
  )
}

function SummaryCard({ label, tone = 'neutral', value }) {
  const toneClassName = {
    neutral: 'border-slate-200 bg-white text-slate-950',
    success: 'border-green-200 bg-green-50 text-green-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  }[tone]

  return (
    <div className={`rounded-lg border px-5 py-4 ${toneClassName}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  )
}
