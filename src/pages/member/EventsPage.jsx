import { CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../services/supabase/client.js'
import { getEventPosterUrls } from '../../utils/eventPosters.js'
import {
  eventIsCurrent,
  eventMatchesFilters,
  eventRegistrationLabel,
  formatEventDate,
  formatEventTimeRange,
} from '../../utils/events.js'

const initialFilters = { time: 'CURRENT', registrationStatus: 'ALL', participation: 'ALL' }

export default function EventsPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [rsvpSummariesByEvent, setRsvpSummariesByEvent] = useState({})
  const [posterUrlsByPath, setPosterUrlsByPath] = useState({})
  const [memberStateByEvent, setMemberStateByEvent] = useState({})
  const [filters, setFilters] = useState(initialFilters)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadEvents() {
      if (!profile?.id) {
        setErrorMessage('Your member profile is not available. Please sign in again.')
        setIsLoading(false)
        return
      }

      setErrorMessage('')
      setIsLoading(true)
      const [eventsResult, registrationsResult, attendanceResult] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, description, event_date, start_time, end_time, venue, capacity, registration_status, poster_path')
          .order('event_date', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase
          .from('event_registrations')
          .select('event_id, status')
          .eq('user_id', profile.id),
        supabase
          .from('attendance')
          .select('event_id, status')
          .eq('user_id', profile.id),
      ])

      if (!isActive) return

      const error = eventsResult.error || registrationsResult.error || attendanceResult.error
      if (error) {
        setErrorMessage(error.message || 'We could not load events. Please try again.')
        setIsLoading(false)
        return
      }

      const data = eventsResult.data
      setEvents(data)
      setMemberStateByEvent(buildMemberState(registrationsResult.data, attendanceResult.data))

      const posterUrlsPromise = getEventPosterUrls(data.map((event) => event.poster_path)).catch(() => ({}))
      const summaryResults = await Promise.all(
        data.map(async (event) => {
          const { data: summaryData, error: summaryError } = await supabase.rpc('get_event_rsvp_summary', {
            p_event_id: event.id,
          })

          return [event.id, summaryError ? null : summaryData?.[0] ?? null]
        }),
      )
      const posterUrls = await posterUrlsPromise

      if (!isActive) return

      setRsvpSummariesByEvent(Object.fromEntries(summaryResults.filter(([, summary]) => summary)))
      setPosterUrlsByPath(posterUrls)
      setIsLoading(false)
    }

    loadEvents()

    return () => {
      isActive = false
    }
  }, [profile?.id])

  const filteredEvents = filterEvents(events, filters, memberStateByEvent)
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => value !== initialFilters[key])
  const eventsById = new Map(events.map((event) => [event.id, event]))
  const currentReservations = Object.entries(memberStateByEvent)
    .filter(([eventId, state]) => state.isReserved && eventsById.has(eventId) && eventIsCurrent(eventsById.get(eventId)))
    .length
  const attendedEvents = Object.values(memberStateByEvent).filter((state) => state.isAttended).length

  return (
    <section className="mx-auto max-w-[90rem] px-6 py-12 sm:py-20 lg:px-10">
      <div className="border-b border-[var(--bp-border)] pb-8">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Events</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--bp-text)]">Events</h1>
        <p className="mt-4 text-base text-[var(--bp-text-dim)]">
          See events created by your Student Builder Group administrators.
        </p>
      </div>

      {isLoading && <p className="mt-8 text-[var(--bp-text-dim)]">Loading events...</p>}
      {errorMessage && <p className="mt-8 text-sm text-[var(--bp-danger)]">{errorMessage}</p>}

      {!isLoading && !errorMessage && events.length === 0 && (
        <div className="mt-8 border border-[var(--bp-border)] bg-[var(--bp-surface)] px-6 py-5 text-[var(--bp-text-dim)]">
          No events are currently available.
        </div>
      )}

      {!isLoading && !errorMessage && events.length > 0 && (
        <>
          <fieldset className="mt-8 border border-[var(--bp-border)] bg-[var(--bp-surface)] p-5">
            <legend className="mono px-1 text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">Filter events</legend>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <FilterField label="Time" htmlFor="member-event-time-filter">
                <select className={filterClassName} id="member-event-time-filter" name="time" onChange={handleFilterChange} value={filters.time}>
                  <option value="ALL">All events</option>
                  <option value="CURRENT">Current events</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="PAST">Ended</option>
                </select>
              </FilterField>
              <FilterField label="My activity" htmlFor="member-event-participation-filter">
                <select className={filterClassName} id="member-event-participation-filter" name="participation" onChange={handleFilterChange} value={filters.participation}>
                  <option value="ALL">All events</option>
                  <option value="RESERVED">My reservations</option>
                  <option value="ATTENDED">Events attended</option>
                </select>
              </FilterField>
              <FilterField label="Registration" htmlFor="member-event-registration-filter">
                <select className={filterClassName} id="member-event-registration-filter" name="registrationStatus" onChange={handleFilterChange} value={filters.registrationStatus}>
                  <option value="ALL">All statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </FilterField>
              {hasActiveFilters && (
                <button className="font-bold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]" onClick={() => setFilters(initialFilters)} type="button">
                  Reset filters
                </button>
              )}
            </div>
          </fieldset>

          <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm text-[var(--bp-text-dim)]" role="status">
            <p>Showing {filteredEvents.length} of {events.length} events</p>
            <p>{currentReservations} current reservation{currentReservations === 1 ? '' : 's'} // {attendedEvents} attended</p>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="mt-4 border border-[var(--bp-border)] bg-[var(--bp-surface)] px-6 py-5 text-[var(--bp-text-dim)]">
              No events match the current filters.
            </div>
          ) : (
            <div className="bp-scroll mt-6 grid max-h-[70vh] gap-6 overflow-y-auto pr-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => {
                const rsvpSummary = rsvpSummariesByEvent[event.id]
                const posterUrl = posterUrlsByPath[event.poster_path]
                const memberState = memberStateByEvent[event.id] || {}
                const isCurrent = eventIsCurrent(event)

                return (
                  <Link
                    aria-label={`View details for ${event.title}`}
                    className="group block border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--bp-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--bp-amber)]"
                    key={event.id}
                    to={`/events/${event.id}`}
                  >
                    {posterUrl && (
                      <img
                        alt={`${event.title} poster`}
                        className="aspect-video w-full border border-[var(--bp-border)] object-cover"
                        loading="lazy"
                        src={posterUrl}
                      />
                    )}

                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span
                          className={`mono inline-block px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                            event.registration_status === 'OPEN' && isCurrent
                              ? 'border border-[var(--bp-success)] bg-[var(--bp-success)]/15 text-[var(--bp-success)]'
                              : 'border border-[var(--bp-border)] bg-[var(--bp-bg-soft)] text-[var(--bp-text-dim)]'
                          }`}
                        >
                          [ {eventRegistrationLabel(event)} ]
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {memberState.isReserved && <span className="mono border border-[var(--bp-amber)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--bp-amber)]">Reserved</span>}
                        {memberState.isAttended && <span className="mono border border-[var(--bp-success)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--bp-success)]">Attended</span>}
                      </div>
                    </div>

                    <h2 className="mt-4 text-xl font-black tracking-tight text-[var(--bp-text)]">{event.title}</h2>

                    {event.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--bp-text-dim)]">
                        {event.description}
                      </p>
                    )}

                    <div className="mt-5 space-y-2 border-t border-[var(--bp-border)] pt-5 text-sm text-[var(--bp-text-muted)]">
                      <p className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-[var(--bp-amber)]" />
                        {formatEventDate(event.event_date)} // {formatEventTimeRange(event.start_time, event.end_time)}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={16} className="text-[var(--bp-amber)]" />
                        {event.venue}
                      </p>
                    </div>

                    {rsvpSummary && (
                      <p
                        className={`mono mt-4 text-xs font-bold uppercase tracking-[.12em] ${
                          rsvpSummary.is_full ? 'text-[var(--bp-danger)]' : 'text-[var(--bp-text-dim)]'
                        }`}
                      >
                        {rsvpSummary.capacity == null
                          ? 'Capacity pending configuration'
                          : rsvpSummary.is_full
                            ? `Event full // ${rsvpSummary.registered_count} of ${rsvpSummary.capacity} RSVPs`
                            : `${rsvpSummary.registered_count} of ${rsvpSummary.capacity} RSVPs // ${rsvpSummary.slots_remaining} spots left`}
                      </p>
                    )}

                    <p className="mt-6 font-bold text-[var(--bp-amber)] transition-colors group-hover:text-[var(--bp-amber-strong)]">
                      {memberState.isReserved ? 'View reservation and details →' : isCurrent ? 'View details and reserve →' : 'View event details →'}
                    </p>
                  </Link>
                )
              })}
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

function filterEvents(events, filters, memberStateByEvent) {
  return events.filter((event) => {
    const memberState = memberStateByEvent[event.id] || {}
    const matchesParticipation = filters.participation === 'ALL'
      || (filters.participation === 'RESERVED' && memberState.isReserved)
      || (filters.participation === 'ATTENDED' && memberState.isAttended)

    return eventMatchesFilters(event, filters) && matchesParticipation
  })
}

function buildMemberState(registrations, attendanceRecords) {
  const stateByEvent = {}

  registrations.forEach((registration) => {
    stateByEvent[registration.event_id] = {
      ...stateByEvent[registration.event_id],
      isReserved: registration.status === 'REGISTERED',
    }
  })

  attendanceRecords.forEach((attendance) => {
    stateByEvent[attendance.event_id] = {
      ...stateByEvent[attendance.event_id],
      isAttended: attendance.status === 'PRESENT',
    }
  })

  return stateByEvent
}

function FilterField({ children, htmlFor, label }) {
  return (
    <div>
      <label className="mono mb-1.5 block text-xs font-bold uppercase tracking-[.12em] text-[var(--bp-text-dim)]" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}

const filterClassName = 'min-w-40 border border-[var(--bp-border)] bg-[var(--bp-bg)] px-3 py-2 text-[var(--bp-text)] outline-none focus:border-[var(--bp-amber)]'
