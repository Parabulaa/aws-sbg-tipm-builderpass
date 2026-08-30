import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BackLink from '../../components/BackLink.jsx'
import { supabase } from '../../services/supabase/client.js'
import { formatEventDate, formatEventTime } from '../../utils/events.js'

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
          .select('id, user_id, registered_at, profiles(student_number, first_name, last_name, course)')
          .eq('event_id', id)
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

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <BackLink to="/admin/events">Back to events</BackLink>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Manual attendance</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{event.title}</h1>
      <p className="mt-3 text-slate-600">
        {formatEventDate(event.event_date)} at {formatEventTime(event.start_time)}
      </p>
      {errorMessage && <p className="mt-6 text-sm text-red-700">{errorMessage}</p>}

      {registrations.length === 0 ? (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-600">No registered members are available for attendance.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-medium">Student number</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Registration</th>
                <th className="px-5 py-3 font-medium">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {registrations.map((registration) => {
                const member = registration.profiles
                const attendance = attendanceByUser[registration.user_id]
                const isSaving = savingUserId === registration.user_id

                return (
                  <tr key={registration.id}>
                    <td className="px-5 py-3">{member?.student_number}</td>
                    <td className="px-5 py-3">{member ? `${member.first_name} ${member.last_name}` : 'Unavailable'}</td>
                    <td className="px-5 py-3">{member?.course}</td>
                    <td className="px-5 py-3">{new Date(registration.registered_at).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className={`rounded-md px-3 py-1.5 font-medium disabled:cursor-not-allowed ${
                            attendance?.status === 'PRESENT'
                              ? 'bg-green-700 text-white'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                          disabled={isSaving}
                          onClick={() => recordAttendance(registration.user_id, 'PRESENT')}
                          type="button"
                        >
                          Present
                        </button>
                        <button
                          className={`rounded-md px-3 py-1.5 font-medium disabled:cursor-not-allowed ${
                            attendance?.status === 'ABSENT'
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                          }`}
                          disabled={isSaving}
                          onClick={() => recordAttendance(registration.user_id, 'ABSENT')}
                          type="button"
                        >
                          Absent
                        </button>
                        {attendance?.check_in_time && (
                          <span className="text-xs text-slate-500">{new Date(attendance.check_in_time).toLocaleString()}</span>
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
