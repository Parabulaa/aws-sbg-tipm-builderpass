import { CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase/client.js'
import { eventStatusLabel, formatEventDate, formatEventTime } from '../../utils/events.js'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, event_date, start_time, venue, registration_status')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) {
        setErrorMessage(error.message || 'We could not load events. Please try again.')
      } else {
        setEvents(data)
      }

      setIsLoading(false)
    }

    loadEvents()
  }, [])

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Events</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Upcoming events</h1>
      <p className="mt-4 text-slate-600">See events created by your Student Builder Group administrators.</p>

      {isLoading && <p className="mt-8 text-slate-600">Loading events...</p>}
      {errorMessage && <p className="mt-8 text-sm text-red-700">{errorMessage}</p>}

      {!isLoading && !errorMessage && events.length === 0 && (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-600">
          No events are currently available.
        </p>
      )}

      {!isLoading && !errorMessage && events.length > 0 && (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {events.map((event) => (
            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" key={event.id}>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-950">{event.title}</h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    event.registration_status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {eventStatusLabel(event.registration_status)}
                </span>
              </div>
              {event.description && <p className="mt-3 line-clamp-3 text-slate-600">{event.description}</p>}
              <div className="mt-5 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <CalendarDays size={16} /> {formatEventDate(event.event_date)} at {formatEventTime(event.start_time)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={16} /> {event.venue}
                </p>
              </div>
              <Link className="mt-5 inline-block font-medium text-indigo-700 hover:text-indigo-900" to={`/events/${event.id}`}>
                View details
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
