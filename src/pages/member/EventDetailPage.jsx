import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
    return <section className="mx-auto max-w-4xl px-5 py-12 text-slate-600">Loading event...</section>
  }

  if (!event) {
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

        <div className="mt-8 border-t border-slate-200 pt-6">
          {errorMessage && <p className="mb-4 text-sm text-red-700">{errorMessage}</p>}
          {confirmationMessage && <p className="mb-4 text-sm font-medium text-green-700">{confirmationMessage}</p>}
          {registration ? (
            <p className="font-medium text-green-700">You are already registered for this event.</p>
          ) : event.registration_status === 'OPEN' ? (
            <button
              className="rounded-md bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-indigo-400"
              disabled={isSubmitting}
              onClick={handleRegistration}
              type="button"
            >
              {isSubmitting ? 'Registering...' : 'Register for this event'}
            </button>
          ) : (
            <p className="font-medium text-slate-600">Registration is closed for this event.</p>
          )}

          {profile?.role === 'ADMIN' && (
            <Link className="ml-4 inline-block font-medium text-indigo-700 hover:text-indigo-900" to={`/admin/events/${event.id}/registrations`}>
              View registrations
            </Link>
          )}
        </div>
      </article>
    </section>
  )
}
