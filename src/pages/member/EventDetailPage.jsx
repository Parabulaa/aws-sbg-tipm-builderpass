import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../services/supabase/client.js'
import { eventStatusLabel, formatEventDate, formatEventTime } from '../../utils/events.js'

export default function EventDetailPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadEvent() {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, event_date, start_time, venue, registration_status, created_at')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        setErrorMessage(error.message || 'We could not load this event.')
      } else if (!data) {
        setErrorMessage('This event is not available.')
      } else {
        setEvent(data)
      }

      setIsLoading(false)
    }

    loadEvent()
  }, [id])

  if (isLoading) {
    return <section className="mx-auto max-w-4xl px-5 py-12 text-slate-600">Loading event...</section>
  }

  if (errorMessage) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-12">
        <p className="text-sm text-red-700">{errorMessage}</p>
        <Link className="mt-5 inline-flex items-center gap-2 font-medium text-indigo-700 hover:text-indigo-900" to="/events">
          <ArrowLeft size={17} /> Back to events
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900" to="/events">
        <ArrowLeft size={17} /> Back to events
      </Link>
      <article className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Event details</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{event.title}</h1>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              event.registration_status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {eventStatusLabel(event.registration_status)}
          </span>
        </div>

        {event.description && <p className="mt-6 whitespace-pre-wrap leading-7 text-slate-700">{event.description}</p>}

        <dl className="mt-8 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <CalendarDays size={16} /> Date and time
            </dt>
            <dd className="mt-1 text-slate-900">
              {formatEventDate(event.event_date)} at {formatEventTime(event.start_time)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <MapPin size={16} /> Venue
            </dt>
            <dd className="mt-1 text-slate-900">{event.venue}</dd>
          </div>
        </dl>
      </article>
    </section>
  )
}
