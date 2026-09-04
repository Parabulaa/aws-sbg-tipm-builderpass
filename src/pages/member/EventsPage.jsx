import { CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EventSearchControl from '../../components/EventSearchControl.jsx'
import EventPoster from '../../components/EventPoster.jsx'
import { EventCardSkeletons } from '../../components/LoadingSkeleton.jsx'
import RetryNotice from '../../components/RetryNotice.jsx'
import SelectControl from '../../components/SelectControl.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../services/supabase/client.js'
import { getRsvpSummaries } from '../../services/supabase/rsvpSummaries.js'
import { getEventPosterUrl, getEventPosterUrls } from '../../utils/eventPosters.js'
import { createEventFilterParams, parseEventFilters } from '../../utils/eventFilters.js'
import { eventWithOptionalEndTime, queryWithOptionalEventEndTime } from '../../utils/supabaseCompatibility.js'
import {
  eventIsCurrent,
  eventMatchesFilters,
  eventRegistrationLabel,
  formatEventDate,
  formatEventTimeRange,
} from '../../utils/events.js'

const filterConfig = {
  search: { defaultValue: '', param: 'q' },
  time: { defaultValue: 'ALL', param: 'time', values: ['ALL', 'CURRENT', 'UPCOMING', 'PAST'] },
  participation: { defaultValue: 'ALL', param: 'activity', values: ['ALL', 'RESERVED', 'ATTENDED'] },
  registrationStatus: { defaultValue: 'ALL', param: 'registration', values: ['ALL', 'OPEN', 'CLOSED'] },
}
const initialFilters = Object.fromEntries(Object.entries(filterConfig).map(([name, settings]) => [name, settings.defaultValue]))

export default function EventsPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [rsvpSummariesByEvent, setRsvpSummariesByEvent] = useState({})
  const [posterUrlsByPath, setPosterUrlsByPath] = useState({})
  const [memberStateByEvent, setMemberStateByEvent] = useState({})
  const [searchParams, setSearchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isActive = true

    async function loadEvents() {
      if (!profile?.id) {
        setErrorMessage('Your member profile is not available. Please sign in again.')
        setIsLoading(false)
        return
      }

      setErrorMessage('')
      setWarningMessage('')
      setIsLoading(true)
      const [eventsResult, registrationsResult, attendanceResult] = await Promise.all([
        queryWithOptionalEventEndTime((includeEndTime) => supabase
          .from('events')
          .select(includeEndTime
            ? 'id, title, description, event_date, start_time, end_time, venue, capacity, registration_status, poster_path'
            : 'id, title, description, event_date, start_time, venue, capacity, registration_status, poster_path')
          .order('event_date', { ascending: true })
          .order('start_time', { ascending: true })),
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

      if (eventsResult.error) {
        setErrorMessage('We could not load events. Please try again.')
        setIsLoading(false)
        return
      }

      const data = eventsResult.data.map(eventWithOptionalEndTime)
      const warnings = []
      if (registrationsResult.error) warnings.push('reservation indicators')
      if (attendanceResult.error) warnings.push('attendance indicators')
      setEvents(data)
      setMemberStateByEvent(buildMemberState(registrationsResult.data ?? [], attendanceResult.data ?? []))

      const posterUrlsPromise = getEventPosterUrls(data.map((event) => event.poster_path)).catch(() => {
        warnings.push('some event posters')
        return {}
      })
      const [posterUrls, summaryResult] = await Promise.all([
        posterUrlsPromise,
        getRsvpSummaries(data.map((event) => event.id)),
      ])
      if (summaryResult.hadFailures) warnings.push('some RSVP totals')

      if (!isActive) return

      setRsvpSummariesByEvent(summaryResult.summariesByEvent)
      setPosterUrlsByPath(posterUrls)
      if (warnings.length > 0) setWarningMessage(`Events loaded, but ${warnings.join(', ')} are temporarily unavailable.`)
      setIsLoading(false)
    }

    loadEvents()

    return () => {
      isActive = false
    }
  }, [profile?.id, reloadKey])

  const filters = parseEventFilters(searchParams, filterConfig)
  const filteredEvents = filterEvents(events, filters, memberStateByEvent)
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => value !== initialFilters[key])
  const eventsById = new Map(events.map((event) => [event.id, event]))
  const currentReservations = Object.entries(memberStateByEvent)
    .filter(([eventId, state]) => state.isReserved && eventsById.has(eventId) && eventIsCurrent(eventsById.get(eventId)))
    .length
  const attendedEvents = Object.values(memberStateByEvent).filter((state) => state.isAttended).length

  return (
    <section className="mx-auto max-w-[90rem] px-6 py-12 sm:py-20 lg:px-10">
      <div className="grid gap-8 border-b border-[var(--bp-border)] pb-8 xl:grid-cols-[minmax(17rem,1fr)_minmax(0,52rem)] xl:items-end">
        <div>
          <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Events</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--bp-text)]">Events</h1>
          <p className="mt-4 text-base text-[var(--bp-text-dim)]">
            See events created by your Student Builder Group administrators.
          </p>
        </div>

        {!isLoading && !errorMessage && events.length > 0 && (
          <div className="bp-panel-outline bg-[var(--bp-surface)] p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-amber)]">Filter events</p>
              {hasActiveFilters && (
                <button className="text-sm font-bold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]" onClick={() => setSearchParams({}, { replace: true })} type="button">
                  Reset
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(13rem,1.15fr)_repeat(3,minmax(10rem,1fr))]">
              <FilterField label="Search" htmlFor="member-event-search-filter">
                <EventSearchControl id="member-event-search-filter" onChange={handleFilterChange} value={filters.search} />
              </FilterField>
              <FilterField label="Time" htmlFor="member-event-time-filter">
                <SelectControl id="member-event-time-filter" name="time" onChange={handleFilterChange} options={timeFilterOptions} value={filters.time} />
              </FilterField>
              <FilterField label="My activity" htmlFor="member-event-participation-filter">
                <SelectControl id="member-event-participation-filter" name="participation" onChange={handleFilterChange} options={participationFilterOptions} value={filters.participation} />
              </FilterField>
              <FilterField label="Registration" htmlFor="member-event-registration-filter">
                <SelectControl id="member-event-registration-filter" name="registrationStatus" onChange={handleFilterChange} options={registrationFilterOptions} value={filters.registrationStatus} />
              </FilterField>
            </div>
          </div>
        )}
      </div>

      {isLoading && <EventCardSkeletons />}
      {errorMessage && (
        <div className="mt-8 max-w-xl">
          <RetryNotice isRetrying={isLoading} message={errorMessage} onRetry={() => setReloadKey((key) => key + 1)} />
        </div>
      )}
      {warningMessage && <p className="mt-6 border border-[var(--bp-amber-muted)] bg-[var(--bp-amber)]/5 px-4 py-3 text-sm text-[var(--bp-text-muted)]" role="status">{warningMessage}</p>}

      {!isLoading && !errorMessage && events.length === 0 && (
        <div className="mt-8 border border-[var(--bp-border)] bg-[var(--bp-surface)] px-6 py-5 text-[var(--bp-text-dim)]">
          No events are currently available.
        </div>
      )}

      {!isLoading && !errorMessage && events.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm text-[var(--bp-text-dim)]" role="status">
            <p>Showing {filteredEvents.length} of {events.length} events</p>
            <p>{currentReservations} current reservation{currentReservations === 1 ? '' : 's'} // {attendedEvents} attended</p>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="mt-4 border border-[var(--bp-border)] bg-[var(--bp-surface)] px-6 py-5 text-[var(--bp-text-dim)]">
              <p className="font-semibold text-[var(--bp-text-muted)]">No matching events</p>
              <p className="mt-1 text-sm">
                {filters.search
                  ? `No event names match “${filters.search.trim()}”. Clear the search or adjust the filters.`
                  : 'Adjust or reset the current filters to see more events.'}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),24rem))] justify-start gap-7 pb-1">
              {filteredEvents.map((event) => {
                const rsvpSummary = rsvpSummariesByEvent[event.id]
                const posterUrl = posterUrlsByPath[event.poster_path]
                const memberState = memberStateByEvent[event.id] || {}
                const isCurrent = eventIsCurrent(event)

                return (
                  <Link
                    aria-label={`View details for ${event.title}`}
                    className="bp-event-card group block w-full bg-[var(--bp-surface)] p-6 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--bp-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--bp-amber)]"
                    key={event.id}
                    to={`/events/${event.id}`}
                  >
                    <EventPoster
                      className="aspect-[4/3] w-full sm:aspect-video"
                      imageClassName="object-contain sm:object-cover"
                      onRetry={event.poster_path ? () => refreshPoster(event.poster_path) : undefined}
                      src={posterUrl}
                      title={event.title}
                    />

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
    setSearchParams(createEventFilterParams({ ...filters, [name]: value }, filterConfig), { replace: true })
  }

  async function refreshPoster(posterPath) {
    const nextUrl = await getEventPosterUrl(posterPath)
    setPosterUrlsByPath((current) => ({ ...current, [posterPath]: nextUrl }))
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

const timeFilterOptions = [
  { value: 'ALL', label: 'All events' },
  { value: 'CURRENT', label: 'Current events' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'PAST', label: 'Ended' },
]

const participationFilterOptions = [
  { value: 'ALL', label: 'All events' },
  { value: 'RESERVED', label: 'My reservations' },
  { value: 'ATTENDED', label: 'Events attended' },
]

const registrationFilterOptions = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
]
