import { CalendarDays, MoreHorizontal, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EventSearchControl from '../../components/EventSearchControl.jsx'
import EventPoster from '../../components/EventPoster.jsx'
import { EventCardSkeletons } from '../../components/LoadingSkeleton.jsx'
import RetryNotice from '../../components/RetryNotice.jsx'
import SelectControl from '../../components/SelectControl.jsx'
import { supabase } from '../../services/supabase/client.js'
import { getEventPosterUrl, getEventPosterUrls } from '../../utils/eventPosters.js'
import { createEventFilterParams, parseEventFilters } from '../../utils/eventFilters.js'
import { eventIsCurrent, eventMatchesFilters, eventRegistrationLabel, formatEventDate, formatEventTimeRange } from '../../utils/events.js'
import { eventWithOptionalEndTime, queryWithOptionalEventEndTime } from '../../utils/supabaseCompatibility.js'

const filterConfig = {
  search: { defaultValue: '', param: 'q' },
  time: { defaultValue: 'ALL', param: 'time', values: ['ALL', 'CURRENT', 'UPCOMING', 'PAST'] },
  registrationStatus: { defaultValue: 'ALL', param: 'registration', values: ['ALL', 'OPEN', 'CLOSED'] },
}
const initialFilters = Object.fromEntries(Object.entries(filterConfig).map(([name, settings]) => [name, settings.defaultValue]))
const eventActionClassName = 'inline-flex min-h-10 items-center justify-center border border-[var(--bp-amber-muted)] px-3 text-center text-sm font-semibold text-[var(--bp-amber)] transition-colors hover:border-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]'

export default function AdminEventsPage() {
  const [events, setEvents] = useState([])
  const [posterUrlsByPath, setPosterUrlsByPath] = useState({})
  const [searchParams, setSearchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [openActionsId, setOpenActionsId] = useState(null)

  useEffect(() => {
    let isActive = true

    async function loadEvents() {
      setWarningMessage('')
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
          if (isActive) {
            setPosterUrlsByPath({})
            setWarningMessage('Events loaded, but some posters are temporarily unavailable.')
          }
        }
      }

      if (isActive) setIsLoading(false)
    }

    loadEvents()

    return () => {
      isActive = false
    }
  }, [reloadKey])

  const filters = parseEventFilters(searchParams, filterConfig)
  const filteredEvents = filterEvents(events, filters)
  const hasActiveFilters = Object.keys(initialFilters).some((key) => filters[key] !== initialFilters[key])

  return (
    <section className="mx-auto max-w-[90rem] px-6 py-12 sm:py-16 lg:px-10">
      <div className="grid gap-6 border-b border-[var(--bp-border)] pb-8 xl:grid-cols-[minmax(17rem,1fr)_minmax(0,52rem)] xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Event management</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Events</h1>
          <p className="mt-3 text-slate-600">Create events and review registrations or attendance.</p>
        </div>
        <div className="bp-panel-outline bg-[var(--bp-surface)] p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(13rem,1fr)_11.5rem_11.5rem_10.5rem] lg:items-end">
            {!isLoading && !errorMessage && events.length > 0 && (
              <>
                <FilterField label="Search" htmlFor="admin-event-search-filter">
                  <EventSearchControl id="admin-event-search-filter" onChange={handleFilterChange} value={filters.search} />
                </FilterField>
                <FilterField label="Time" htmlFor="admin-event-time-filter">
                  <SelectControl className="w-full" id="admin-event-time-filter" name="time" onChange={handleFilterChange} options={timeFilterOptions} value={filters.time} />
                </FilterField>
                <FilterField label="Registration" htmlFor="admin-event-registration-filter">
                  <SelectControl className="w-full" id="admin-event-registration-filter" name="registrationStatus" onChange={handleFilterChange} options={registrationFilterOptions} value={filters.registrationStatus} />
                </FilterField>
              </>
            )}
            <Link
              className="inline-flex h-12 w-full items-center justify-center gap-2 self-end whitespace-nowrap bg-[var(--bp-amber)] px-4 text-sm font-bold uppercase tracking-wide text-black hover:bg-[var(--bp-amber-strong)] lg:col-start-4"
              to="/admin/events/new"
            >
              <Plus size={18} /> Create event
            </Link>
          </div>
          {hasActiveFilters && (
            <button className="mt-3 text-sm font-bold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]" onClick={() => setSearchParams({}, { replace: true })} type="button">
              Reset filters
            </button>
          )}
        </div>
      </div>

      {isLoading && <EventCardSkeletons compact />}
      {errorMessage && (
        <div className="mt-8 max-w-xl">
          <RetryNotice isRetrying={isLoading} message={errorMessage} onRetry={() => setReloadKey((key) => key + 1)} />
        </div>
      )}
      {warningMessage && <p className="mt-6 border border-[var(--bp-amber-muted)] bg-[var(--bp-amber)]/5 px-4 py-3 text-sm text-[var(--bp-text-muted)]" role="status">{warningMessage}</p>}
      {!isLoading && !errorMessage && events.length === 0 && (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-600">No events have been created yet.</p>
      )}

      {!isLoading && !errorMessage && events.length > 0 && (
        <>
          <p className="mt-6 text-sm text-slate-600" role="status">Showing {filteredEvents.length} of {events.length} events</p>

          {filteredEvents.length === 0 ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-600">
              <p className="font-semibold text-slate-800">No matching events</p>
              <p className="mt-1 text-sm">
                {filters.search
                  ? `No event names match “${filters.search.trim()}”. Clear the search or adjust the filters.`
                  : 'Adjust or reset the current filters to see more events.'}
              </p>
            </div>
          ) : (
            <div className="bp-panel-outline mt-4 overflow-hidden bg-white">
              <div className="bp-admin-event-list">
                {filteredEvents.map((event) => {
                  const posterUrl = posterUrlsByPath[event.poster_path]

                  return (
                    <article className="flex flex-wrap items-center justify-between gap-4 p-5" key={event.id}>
                      <div className="flex min-w-0 items-center gap-4">
                        <EventPoster
                          className="h-20 w-32 shrink-0"
                          imageClassName="object-cover"
                          onRetry={event.poster_path ? () => refreshPoster(event.poster_path) : undefined}
                          src={posterUrl}
                          title={event.title}
                        />
                        <div>
                          <h2 className="font-semibold text-slate-950">{event.title}</h2>
                          <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                            <CalendarDays size={16} /> {formatEventDate(event.event_date)} // {formatEventTimeRange(event.start_time, event.end_time)}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{event.venue}</p>
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            event.registration_status === 'OPEN' && eventIsCurrent(event) ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {eventRegistrationLabel(event)}
                        </span>
                        <EventActions
                          eventId={event.id}
                          isOpen={openActionsId === event.id}
                          setOpenActionsId={setOpenActionsId}
                        />
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
    setOpenActionsId(null)
    setSearchParams(createEventFilterParams({ ...filters, [name]: value }, filterConfig), { replace: true })
  }

  async function refreshPoster(posterPath) {
    const nextUrl = await getEventPosterUrl(posterPath)
    setPosterUrlsByPath((current) => ({ ...current, [posterPath]: nextUrl }))
  }
}

function EventActions({ eventId, isOpen, setOpenActionsId }) {
  const rootRef = useRef(null)
  const menuId = `event-${eventId}-actions`
  const actions = [
    { label: 'Details', to: `/events/${eventId}` },
    { label: 'Edit', to: `/admin/events/${eventId}/edit` },
    { label: 'Registrations', to: `/admin/events/${eventId}/registrations` },
    { label: 'Attendance', to: `/admin/events/${eventId}/attendance` },
  ]

  useEffect(() => {
    if (!isOpen) return undefined

    function closeOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpenActionsId(null)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpenActionsId(null)
    }

    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen, setOpenActionsId])

  return (
    <>
      <div className="w-full sm:hidden" ref={rootRef}>
        <button
          aria-controls={menuId}
          aria-expanded={isOpen}
          className="flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--bp-amber-muted)] px-4 text-sm font-bold text-[var(--bp-amber)] transition-colors hover:border-[var(--bp-amber)]"
          onClick={() => setOpenActionsId(isOpen ? null : eventId)}
          type="button"
        >
          <MoreHorizontal aria-hidden="true" size={18} /> Event actions
        </button>
        {isOpen && (
          <div className="mt-2 grid gap-2 border border-[var(--bp-amber-muted)] bg-[var(--bp-bg-soft)] p-2" id={menuId}>
            {actions.map((action) => (
              <Link className={eventActionClassName} key={action.to} onClick={() => setOpenActionsId(null)} to={action.to}>{action.label}</Link>
            ))}
          </div>
        )}
      </div>
      <div className="hidden w-full grid-cols-4 gap-2 sm:grid lg:w-auto">
        {actions.map((action) => (
          <Link className={eventActionClassName} key={action.to} to={action.to}>{action.label}</Link>
        ))}
      </div>
    </>
  )
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

const timeFilterOptions = [
  { value: 'ALL', label: 'All events' },
  { value: 'CURRENT', label: 'Current events' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'PAST', label: 'Ended' },
]

const registrationFilterOptions = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
]
