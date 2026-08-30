import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase/client.js'
import { eventStatusLabel, formatEventDate, formatEventTime } from '../../utils/events.js'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [rsvpSummariesByEvent, setRsvpSummariesByEvent] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadEvents() {
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, event_date, start_time, venue, registration_status')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (!isActive) return

      if (error) {
        setErrorMessage(error.message || 'We could not load events. Please try again.')
        setIsLoading(false)
        return
      }

      setEvents(data)

      const summaryResults = await Promise.all(
        data.map(async (event) => {
          const { data: summaryData, error: summaryError } = await supabase.rpc('get_event_rsvp_summary', {
            p_event_id: event.id,
          })

          return [event.id, summaryError ? null : summaryData?.[0] ?? null]
        }),
      )

      if (!isActive) return

      setRsvpSummariesByEvent(Object.fromEntries(summaryResults.filter(([, summary]) => summary)))
      setIsLoading(false)
    }

    loadEvents()

    return () => {
      isActive = false
    }
  }, [])

  return (
    <section className="mx-auto max-w-[90rem] px-6 py-12 sm:py-20 lg:px-10">
      <div className="border-b border-[var(--bp-border)] pb-8">
        <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">Events</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--bp-text)]">Upcoming events</h1>
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
        <div className="bp-scroll mt-10 grid max-h-[70vh] gap-6 overflow-y-auto pr-1 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const rsvpSummary = rsvpSummariesByEvent[event.id]

            return (
              <article
                className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--bp-border-strong)]"
                key={event.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span
                      className={`mono inline-block px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                        event.registration_status === 'OPEN'
                          ? 'border border-[var(--bp-success)] bg-[var(--bp-success)]/15 text-[var(--bp-success)]'
                          : 'border border-[var(--bp-border)] bg-[var(--bp-bg-soft)] text-[var(--bp-text-dim)]'
                      }`}
                    >
                      [ {eventStatusLabel(event.registration_status)} ]
                    </span>
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
                    {formatEventDate(event.event_date)} at {formatEventTime(event.start_time)}
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
                      ? 'Unlimited capacity'
                      : rsvpSummary.is_full
                        ? `Event full // ${rsvpSummary.registered_count} of ${rsvpSummary.capacity} RSVPs`
                        : `${rsvpSummary.registered_count} of ${rsvpSummary.capacity} RSVPs // ${rsvpSummary.slots_remaining} spots left`}
                  </p>
                )}

                <Link
                  className="mt-6 inline-flex items-center gap-2 font-bold text-[var(--bp-amber)] transition-colors hover:text-[var(--bp-amber-strong)]"
                  to={`/events/${event.id}`}
                >
                  View details
                  <ArrowRight size={16} />
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
