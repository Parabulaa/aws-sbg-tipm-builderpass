import { CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BackLink from '../../components/BackLink.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../services/supabase/client.js'
import { eventStatusLabel, formatEventDate, formatEventTime } from '../../utils/events.js'

export default function EventDetailPage() {
  const { profile } = useAuth()
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [registration, setRegistration] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadEvent() {
      setIsLoading(true)
      setErrorMessage('')

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, description, event_date, start_time, venue, registration_status')
        .eq('id', id)
        .maybeSingle()

      if (eventError || !eventData) {
        setErrorMessage(eventError?.message || 'This event is not available.')
        setIsLoading(false)
        return
      }

      setEvent(eventData)

      if (profile?.id) {
        const { data: registrationData, error: registrationError } = await supabase
          .from('event_registrations')
          .select('id, status, registered_at')
          .eq('event_id', id)
          .eq('user_id', profile.id)
          .maybeSingle()

        if (registrationError) {
          setErrorMessage(registrationError.message || 'We could not check your registration.')
        } else {
          setRegistration(registrationData)
        }
      }

      setIsLoading(false)
    }

    loadEvent()
  }, [id, profile?.id])

  async function handleRegistration() {
    if (!event || !profile?.id) {
      setErrorMessage('Your member profile is not available. Please sign in again.')
      return
    }

    setErrorMessage('')
    setConfirmationMessage('')
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert({ event_id: event.id, user_id: profile.id })
        .select('id, status, registered_at')
        .single()

      if (error?.code === '23505') {
        setRegistration({ id: 'existing' })
        setConfirmationMessage('You are already registered for this event.')
        return
      }

      if (error) throw error

      setRegistration(data)
      setConfirmationMessage('You are registered for this event.')
    } catch (error) {
      setErrorMessage(error.message || 'We could not register you for this event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-12 text-[var(--bp-text-dim)]">Loading event...</section>
    )
  }

  if (!event) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-12">
        <p className="text-sm text-[var(--bp-danger)]">{errorMessage}</p>
        <div className="mt-5">
          <BackLink to="/events">Back to events</BackLink>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 sm:py-20 lg:px-10">
      <BackLink to="/events">Back to events</BackLink>

      <article className="mt-8 border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1">
            <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">
              Event // {eventStatusLabel(event.registration_status)}
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--bp-text)] sm:text-4xl">
              {event.title}
            </h1>
          </div>
          <span
            className={`mono shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wider ${
              event.registration_status === 'OPEN'
                ? 'border border-[var(--bp-success)] bg-[var(--bp-success)]/15 text-[var(--bp-success)]'
                : 'border border-[var(--bp-border)] bg-[var(--bp-bg-soft)] text-[var(--bp-text-dim)]'
            }`}
          >
            [ {eventStatusLabel(event.registration_status)} ]
          </span>
        </div>

        <div className="mt-8 grid gap-6 border-t border-[var(--bp-border)] pt-8 sm:grid-cols-2">
          <div>
            <dt className="mono flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">
              <CalendarDays size={16} className="text-[var(--bp-amber)]" /> Date / Time
            </dt>
            <dd className="mt-2 font-bold text-[var(--bp-text)]">
              {formatEventDate(event.event_date)} at {formatEventTime(event.start_time)}
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

        <div className="mt-8 border-t border-[var(--bp-border)] pt-8">
          <p className="mono mb-6 text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">
            Registration
          </p>

          {errorMessage && (
            <p className="mb-4 text-sm text-[var(--bp-danger)]">{errorMessage}</p>
          )}
          {confirmationMessage && (
            <p className="mb-4 text-sm font-semibold text-[var(--bp-success)]">{confirmationMessage}</p>
          )}

          {registration ? (
            <p className="font-bold text-[var(--bp-success)]">You are already registered for this event.</p>
          ) : event.registration_status === 'OPEN' ? (
            <button
              className="border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-6 py-3 font-bold uppercase tracking-wide text-black transition-colors hover:bg-[var(--bp-amber-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={handleRegistration}
              type="button"
            >
              {isSubmitting ? 'Registering...' : 'Register for this event'}
            </button>
          ) : (
            <p className="font-semibold text-[var(--bp-text-dim)]">Registration is closed for this event.</p>
          )}

          {profile?.role === 'ADMIN' && (
            <Link
              className="ml-6 inline-block font-semibold text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]"
              to={`/admin/events/${event.id}/registrations`}
            >
              View registrations →
            </Link>
          )}
        </div>
      </article>
    </section>
  )
}
