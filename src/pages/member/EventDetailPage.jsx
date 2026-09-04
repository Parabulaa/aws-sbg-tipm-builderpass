import { AlertTriangle, CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BackLink from '../../components/BackLink.jsx'
import Dialog from '../../components/Dialog.jsx'
import EventPoster from '../../components/EventPoster.jsx'
import { EventDetailSkeleton } from '../../components/LoadingSkeleton.jsx'
import RetryNotice from '../../components/RetryNotice.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../services/supabase/client.js'
import { getEventPosterUrl } from '../../utils/eventPosters.js'
import {
  eventIsCurrent,
  eventRegistrationLabel,
  formatEventDate,
  formatEventTimeRange,
} from '../../utils/events.js'
import { eventWithOptionalEndTime, queryWithOptionalEventEndTime } from '../../utils/supabaseCompatibility.js'
import { createActionLock } from '../../utils/actionLock.js'

export default function EventDetailPage() {
  const { profile } = useAuth()
  const { id } = useParams()
  const isEventManager = ['OFFICER', 'ADMIN'].includes(profile?.role)
  const [event, setEvent] = useState(null)
  const [posterUrl, setPosterUrl] = useState(null)
  const [registration, setRegistration] = useState(null)
  const [rsvpSummary, setRsvpSummary] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const rsvpRequestLockRef = useRef(createActionLock())

  useEffect(() => {
    let isActive = true

    async function loadEvent() {
      setIsLoading(true)
      setErrorMessage('')
      setWarningMessage('')
      setPosterUrl(null)
      setRegistration(null)
      setRsvpSummary(null)

      const [eventResult, summaryResult] = await Promise.all([
        queryWithOptionalEventEndTime((includeEndTime) => supabase
          .from('events')
          .select(includeEndTime
            ? 'id, title, description, event_date, start_time, end_time, venue, capacity, registration_status, poster_path'
            : 'id, title, description, event_date, start_time, venue, capacity, registration_status, poster_path')
          .eq('id', id)
          .maybeSingle()),
        supabase.rpc('get_event_rsvp_summary', { p_event_id: id }),
      ])

      if (!isActive) return

      if (eventResult.error || !eventResult.data) {
        setErrorMessage(eventResult.error?.message || 'This event is not available.')
        setIsLoading(false)
        return
      }

      setEvent(eventWithOptionalEndTime(eventResult.data))

      if (eventResult.data.poster_path) {
        getEventPosterUrl(eventResult.data.poster_path)
          .then((url) => {
            if (isActive) setPosterUrl(url)
          })
          .catch(() => {
            if (isActive) setWarningMessage('The event poster is temporarily unavailable.')
          })
      }

      if (summaryResult.error) {
        setWarningMessage('Event details loaded, but RSVP availability is temporarily unavailable.')
      } else {
        setRsvpSummary(summaryResult.data?.[0] ?? null)
      }

      if (profile?.id) {
        const { data: registrationData, error: registrationError } = await supabase
          .from('event_registrations')
          .select('id, status, registered_at, cancelled_at')
          .eq('event_id', id)
          .eq('user_id', profile.id)
          .maybeSingle()

        if (!isActive) return

        if (registrationError) {
          setWarningMessage('Event details loaded, but your reservation status is temporarily unavailable.')
        } else {
          setRegistration(registrationData)
        }
      }

      setIsLoading(false)
    }

    loadEvent()

    return () => {
      isActive = false
    }
  }, [id, profile?.id, reloadKey])

  async function refreshRsvpSummary() {
    const { data, error } = await supabase.rpc('get_event_rsvp_summary', { p_event_id: id })

    if (error) throw error

    setRsvpSummary(data?.[0] ?? null)
  }

  async function handleRegistration() {
    if (!rsvpRequestLockRef.current.acquire()) return

    if (!event || !profile?.id) {
      rsvpRequestLockRef.current.release()
      setErrorMessage('Your member profile is not available. Please sign in again.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.rpc('rsvp_to_event', { p_event_id: event.id })
      if (error) throw error

      const nextRegistration = data?.[0]
      if (!nextRegistration) throw new Error('Your RSVP could not be confirmed. Please try again.')

      setRegistration(nextRegistration)
      await refreshRsvpSummary()
    } catch (error) {
      setErrorMessage(getRsvpErrorMessage(error, 'We could not register you for this event. Please try again.'))
    } finally {
      rsvpRequestLockRef.current.release()
      setIsSubmitting(false)
    }
  }

  async function handleCancellation() {
    if (!event || !rsvpRequestLockRef.current.acquire()) return

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.rpc('cancel_event_rsvp', { p_event_id: event.id })
      if (error) throw error

      const nextRegistration = data?.[0]
      if (!nextRegistration) throw new Error('Your RSVP could not be cancelled. Please try again.')

      setRegistration(nextRegistration)
      setIsCancelDialogOpen(false)
      await refreshRsvpSummary()
    } catch (error) {
      setErrorMessage(getRsvpErrorMessage(error, 'We could not cancel your RSVP. Please try again.'))
    } finally {
      rsvpRequestLockRef.current.release()
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <EventDetailSkeleton />
  }

  if (!event) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-12">
        <RetryNotice isRetrying={isLoading} message={errorMessage} onRetry={() => setReloadKey((key) => key + 1)} />
        <div className="mt-5">
          <BackLink to="/events">Back to events</BackLink>
        </div>
      </section>
    )
  }

  const hasActiveRsvp = registration?.status === 'REGISTERED'
  const isCurrent = eventIsCurrent(event)
  const isEventFull = Boolean(rsvpSummary?.is_full)

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 sm:py-20 lg:px-10">
      <BackLink to="/events">Back to events</BackLink>

      <article className="bp-panel-outline mt-8 bg-[var(--bp-surface)] p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1">
            <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">
              Event // {eventRegistrationLabel(event)}
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--bp-text)] sm:text-4xl">
              {event.title}
            </h1>
          </div>
          <span
            className={`mono shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wider ${
              event.registration_status === 'OPEN' && isCurrent
                ? 'border border-[var(--bp-success)] bg-[var(--bp-success)]/15 text-[var(--bp-success)]'
                : 'border border-[var(--bp-border)] bg-[var(--bp-bg-soft)] text-[var(--bp-text-dim)]'
            }`}
          >
            [ {eventRegistrationLabel(event)} ]
          </span>
        </div>

        <EventPoster
          className="mt-8 aspect-[4/3] w-full sm:aspect-video"
          imageClassName="object-contain sm:object-cover"
          loading="eager"
          onRetry={event.poster_path ? refreshPoster : undefined}
          src={posterUrl}
          title={event.title}
        />

        <div className="mt-8 grid gap-6 border-t border-[var(--bp-border)] pt-8 sm:grid-cols-2">
          <div>
            <dt className="mono flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">
              <CalendarDays size={16} className="text-[var(--bp-amber)]" /> Date / Time
            </dt>
            <dd className="mt-2 font-bold text-[var(--bp-text)]">
              {formatEventDate(event.event_date)} // {formatEventTimeRange(event.start_time, event.end_time)}
            </dd>
          </div>
          <div>
            <dt className="mono flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">
              <MapPin size={16} className="text-[var(--bp-amber)]" /> Venue
            </dt>
            <dd className="mt-2 font-bold text-[var(--bp-text)]">{event.venue}</dd>
          </div>
        </div>

        {event.description && (
          <div className="mt-8 border-t border-[var(--bp-border)] pt-8">
            <p className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">Description</p>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-[var(--bp-text-muted)]">
              {event.description}
            </p>
          </div>
        )}

        <div
          aria-busy={isSubmitting}
          aria-live="polite"
          className="mt-8 border-t border-[var(--bp-border)] pt-8"
        >
          <p className="mono mb-4 text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">
            Registration
          </p>

          {rsvpSummary && (
            <div className="mb-6 border border-[var(--bp-amber-muted)] bg-[var(--bp-bg-soft)] px-4 py-3 text-sm">
              {rsvpSummary.capacity != null ? (
                <>
                  <p className="font-bold text-[var(--bp-text)]">
                    {rsvpSummary.registered_count} / {rsvpSummary.capacity} RSVPs
                  </p>
                  <p className="mt-1 text-[var(--bp-text-dim)]">
                    {isEventFull ? 'EVENT FULL' : `${rsvpSummary.slots_remaining} spots remaining`}
                  </p>
                </>
              ) : (
                <p className="font-bold text-[var(--bp-danger)]">Capacity has not been configured for this legacy event.</p>
              )}
            </div>
          )}

          {errorMessage && (
            <p className="mb-4 border border-[var(--bp-danger)]/60 bg-[var(--bp-danger)]/10 px-4 py-3 text-sm text-[var(--bp-danger)]" role="alert">{errorMessage}</p>
          )}
          {warningMessage && (
            <p className="mb-4 border border-[var(--bp-amber-muted)] bg-[var(--bp-amber)]/5 px-4 py-3 text-sm text-[var(--bp-text-muted)]" role="status">{warningMessage}</p>
          )}

          {hasActiveRsvp ? (
            <div className="flex flex-col gap-4 border border-[var(--bp-success)]/70 bg-[var(--bp-success)]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-[var(--bp-success)]">RSVP confirmed</p>
                <p className="mt-1 text-sm text-[var(--bp-text-muted)]">You are registered for this event.</p>
              </div>
              {event.registration_status === 'OPEN' && isCurrent ? (
                <button
                  className="min-h-11 min-w-36 border border-[var(--bp-danger)] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--bp-danger)] transition-colors hover:bg-[var(--bp-danger)] hover:text-white"
                  disabled={isSubmitting}
                  onClick={() => setIsCancelDialogOpen(true)}
                  type="button"
                >
                  Cancel RSVP
                </button>
              ) : (
                <p className="text-sm text-[var(--bp-text-dim)]">RSVP cancellation is unavailable after registration closes or the event ends.</p>
              )}
            </div>
          ) : !isCurrent ? (
            <p className="font-semibold text-[var(--bp-text-dim)]">This event has ended. New reservations are no longer available.</p>
          ) : event.registration_status !== 'OPEN' ? (
            <p className="font-semibold text-[var(--bp-text-dim)]">Registration is closed for this event.</p>
          ) : isEventFull ? (
            <p className="font-bold text-[var(--bp-danger)]">EVENT FULL</p>
          ) : rsvpSummary?.capacity == null ? (
            <p className="font-semibold text-[var(--bp-text-dim)]">Reservations will open after an event manager sets the capacity.</p>
          ) : (
            <div className={registration?.status === 'CANCELLED' ? 'border border-[var(--bp-amber-muted)] bg-[var(--bp-amber)]/5 p-4' : ''}>
              {registration?.status === 'CANCELLED' && (
                <div className="mb-4">
                  <p className="font-bold text-[var(--bp-amber)]">RSVP cancelled</p>
                  <p className="mt-1 text-sm text-[var(--bp-text-muted)]">Your spot was released. You can reserve again while slots are available.</p>
                </div>
              )}
              <button
                className="min-h-11 min-w-36 border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-black transition-colors hover:bg-[var(--bp-amber-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting || !rsvpSummary}
                onClick={handleRegistration}
                type="button"
              >
                {isSubmitting ? 'Reserving...' : rsvpSummary ? 'Reserve a spot' : 'Checking availability...'}
              </button>
            </div>
          )}

          {isEventManager && (
            <div className="mt-6 border-t border-[var(--bp-border)] pt-5">
              <Link
                className="inline-block font-semibold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]"
                to={`/admin/events/${event.id}/registrations`}
              >
                View registrations →
              </Link>
            </div>
          )}
        </div>
      </article>

      <Dialog
        icon={AlertTriangle}
        isOpen={isCancelDialogOpen}
        onClose={() => {
          if (!isSubmitting) setIsCancelDialogOpen(false)
        }}
        titleId="cancel-rsvp-title"
        tone="danger"
      >
        <h2 className="text-2xl font-black tracking-tight text-[var(--bp-text)]" id="cancel-rsvp-title">Cancel RSVP?</h2>
        <p className="mt-3 leading-relaxed text-[var(--bp-text-dim)]">
          Your spot will be released for another member. You can register again only while registration remains open and space is available.
        </p>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <button
            className="border border-[var(--bp-border)] px-4 py-2 font-bold text-[var(--bp-text)] transition-colors hover:border-[var(--bp-amber)] hover:text-[var(--bp-amber)]"
            disabled={isSubmitting}
            onClick={() => setIsCancelDialogOpen(false)}
            type="button"
          >
            Keep RSVP
          </button>
          <button
            className="bg-[var(--bp-danger)] px-4 py-2 font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={handleCancellation}
            type="button"
          >
            {isSubmitting ? 'Cancelling...' : 'Cancel RSVP'}
          </button>
        </div>
      </Dialog>
    </section>
  )

  async function refreshPoster() {
    const nextUrl = await getEventPosterUrl(event.poster_path)
    setPosterUrl(nextUrl)
    setWarningMessage('')
  }
}

function getRsvpErrorMessage(error, fallback) {
  const messages = {
    EVENT_FULL: 'This event is full.',
    EVENT_ENDED: 'This event has ended. Reservations are no longer available.',
    REGISTRATION_CLOSED: 'Registration is closed for this event.',
    PROFILE_NOT_FOUND: 'Your member profile is not available. Please sign in again.',
    NO_ACTIVE_RSVP: 'You do not have an active RSVP to cancel.',
    CANNOT_CANCEL_ATTENDED_RSVP: 'This RSVP cannot be cancelled because attendance has already been recorded.',
  }

  return messages[error?.message] || error?.message || fallback
}
