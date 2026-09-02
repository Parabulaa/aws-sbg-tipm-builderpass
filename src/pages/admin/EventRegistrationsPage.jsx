import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BackLink from '../../components/BackLink.jsx'
import { supabase } from '../../services/supabase/client.js'
import { formatEventDate, formatEventTime } from '../../utils/events.js'

export default function EventRegistrationsPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRegistrations() {
      const [eventResult, registrationsResult] = await Promise.all([
        supabase.from('events').select('id, title, event_date, start_time').eq('id', id).maybeSingle(),
        supabase
          .from('event_registrations')
          .select('id, registered_at, profiles(student_number, first_name, last_name, email, course, year_level)')
          .eq('event_id', id)
          .eq('status', 'REGISTERED')
          .order('registered_at', { ascending: true }),
      ])

      if (eventResult.error || !eventResult.data) {
        setErrorMessage(eventResult.error?.message || 'This event is not available.')
      } else if (registrationsResult.error) {
        setErrorMessage(registrationsResult.error.message || 'We could not load registrations.')
      } else {
        setEvent(eventResult.data)
        setRegistrations(registrationsResult.data)
      }

      setIsLoading(false)
    }

    loadRegistrations()
  }, [id])

  if (isLoading) {
    return <section className="mx-auto max-w-6xl px-5 py-12 text-slate-600">Loading registrations...</section>
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
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Event registrations</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{event.title}</h1>
      <p className="mt-3 text-slate-600">
        {formatEventDate(event.event_date)} at {formatEventTime(event.start_time)}
      </p>

      {registrations.length === 0 ? (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-600">No members have registered yet.</p>
      ) : (
        <div className="bp-scroll mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-medium">AWS SBG Member ID</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Year</th>
                <th className="px-5 py-3 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {registrations.map((registration) => {
                const member = registration.profiles

                return (
                  <tr key={registration.id}>
                    <td className="px-5 py-3">{member?.student_number}</td>
                    <td className="px-5 py-3">{member ? `${member.first_name} ${member.last_name}` : 'Unavailable'}</td>
                    <td className="px-5 py-3">{member?.course}</td>
                    <td className="px-5 py-3">{member?.year_level}</td>
                    <td className="px-5 py-3">{new Date(registration.registered_at).toLocaleString()}</td>
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
