import { CalendarDays, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase/client.js'
import { eventStatusLabel, formatEventDate, formatEventTime } from '../../utils/events.js'

export default function AdminEventsPage() {
  const [events, setEvents] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date, start_time, venue, registration_status')
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Admin events</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Events</h1>
          <p className="mt-3 text-slate-600">Create and view real BuilderPass events.</p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-md bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800"
          to="/admin/events/new"
        >
          <Plus size={18} /> Create event
        </Link>
      </div>

      {isLoading && <p className="mt-8 text-slate-600">Loading events...</p>}
      {errorMessage && <p className="mt-8 text-sm text-red-700">{errorMessage}</p>}
      {!isLoading && !errorMessage && events.length === 0 && (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-600">No events have been created yet.</p>
      )}

      {!isLoading && !errorMessage && events.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-200">
            {events.map((event) => (
              <Link className="block p-5 hover:bg-slate-50" key={event.id} to={`/events/${event.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-950">{event.title}</h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                      <CalendarDays size={16} /> {formatEventDate(event.event_date)} at {formatEventTime(event.start_time)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{event.venue}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      event.registration_status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {eventStatusLabel(event.registration_status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
