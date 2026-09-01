import { CalendarDays, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase/client.js'
import { getEventPosterUrls } from '../../utils/eventPosters.js'
import { eventIsCurrent, eventMatchesFilters, eventRegistrationLabel, formatEventDate, formatEventTimeRange } from '../../utils/events.js'
import { eventWithOptionalEndTime, queryWithOptionalEventEndTime } from '../../utils/supabaseCompatibility.js'

const initialFilters = { time: 'CURRENT', registrationStatus: 'ALL' }

export default function AdminEventsPage() {
  const [events, setEvents] = useState([])
  const [posterUrlsByPath, setPosterUrlsByPath] = useState({})
  const [filters, setFilters] = useState(initialFilters)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadEvents() {
      const { data, error } = await queryWithOptionalEventEndTime((includeEndTime) => supabase
        .from('events')
        .select(includeEndTime
          ? 'id, title, event_date, start_time, end_time, venue, registration_status, poster_path'
          : 'id, title, event_date, start_time, venue, registration_status, poster_path')
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true }))

      if (!isActive) return

      if (error) {
        setErrorMessage(error.message || 'We could not load events. Please try again.')
      } else {
        const compatibleEvents = data.map(eventWithOptionalEndTime)
        setEvents(compatibleEvents)

        try {
          const posterUrls = await getEventPosterUrls(compatibleEvents.map((event) => event.poster_path))
          if (isActive) setPosterUrlsByPath(posterUrls)
        } catch {
          if (isActive) setPosterUrlsByPath({})
        }
      }

      if (isActive) setIsLoading(false)
    }

    loadEvents()

    return () => {
      isActive = false
    }
  }, [])

  const filteredEvents = filterEvents(events, filters)
  const hasActiveFilters = filters.time !== initialFilters.time || filters.registrationStatus !== initialFilters.registrationStatus

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Event management</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Events</h1>
          <p className="mt-3 text-slate-600">Create events and review registrations or attendance.</p>
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
        <>
          <fieldset className="mt-8 border border-slate-200 bg-white p-5">
            <legend className="px-1 text-sm font-semibold text-slate-900">Filter events</legend>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <FilterField label="Time" htmlFor="admin-event-time-filter">
                <select className={filterClassName} id="admin-event-time-filter" name="time" onChange={handleFilterChange} value={filters.time}>
                  <option value="ALL">All events</option>
                  <option value="CURRENT">Current events</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="PAST">Ended</option>
                </select>
              </FilterField>
              <FilterField label="Registration" htmlFor="admin-event-registration-filter">
                <select className={filterClassName} id="admin-event-registration-filter" name="registrationStatus" onChange={handleFilterChange} value={filters.registrationStatus}>
                  <option value="ALL">All statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </FilterField>
              {hasActiveFilters && (
                <button className="text-sm font-medium text-indigo-700 hover:text-indigo-900" onClick={() => setFilters(initialFilters)} type="button">
                  Reset filters
                </button>
              )}
            </div>
          </fieldset>

          <p className="mt-4 text-sm text-slate-600" role="status">Showing {filteredEvents.length} of {events.length} events</p>

          {filteredEvents.length === 0 ? (
            <p className="mt-4 rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-600">No events match the current filters.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="divide-y divide-slate-200">
                {filteredEvents.map((event) => {
                  const posterUrl = posterUrlsByPath[event.poster_path]

                  return (
                    <article className="flex flex-wrap items-center justify-between gap-4 p-5" key={event.id}>
                      <div className="flex min-w-0 items-center gap-4">
                        {posterUrl && (
                          <img
                            alt={`${event.title} poster`}
                            className="h-20 w-32 shrink-0 border border-slate-200 object-cover"
                            loading="lazy"
                            src={posterUrl}
                          />
                        )}
                        <div>
                          <h2 className="font-semibold text-slate-950">{event.title}</h2>
                          <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                            <CalendarDays size={16} /> {formatEventDate(event.event_date)} // {formatEventTimeRange(event.start_time, event.end_time)}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{event.venue}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            event.registration_status === 'OPEN' && eventIsCurrent(event) ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {eventRegistrationLabel(event)}
                        </span>
                        <Link className="text-sm font-medium text-indigo-700 hover:text-indigo-900" to={`/events/${event.id}`}>
                          Details
                        </Link>
                        <Link className="text-sm font-medium text-indigo-700 hover:text-indigo-900" to={`/admin/events/${event.id}/edit`}>
                          Edit
                        </Link>
                        <Link className="text-sm font-medium text-indigo-700 hover:text-indigo-900" to={`/admin/events/${event.id}/registrations`}>
                          Registrations
                        </Link>
                        <Link className="text-sm font-medium text-indigo-700 hover:text-indigo-900" to={`/admin/events/${event.id}/attendance`}>
                          Attendance
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }
}

function filterEvents(events, filters) {
  return events.filter((event) => eventMatchesFilters(event, filters))
}

function FilterField({ children, htmlFor, label }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}

const filterClassName = 'min-w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-indigo-500'
