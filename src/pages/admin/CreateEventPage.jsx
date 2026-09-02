import { ImagePlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BackLink from '../../components/BackLink.jsx'
import EventDateTimeField from '../../components/EventDateTimeField.jsx'
import SelectControl from '../../components/SelectControl.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { supabase } from '../../services/supabase/client.js'
import { getEventPosterValidationMessage, removeEventPoster, uploadEventPoster } from '../../utils/eventPosters.js'
import { isValidEventDate, isValidEventTime } from '../../utils/events.js'
import { getDatabaseFeatureMessage } from '../../utils/supabaseCompatibility.js'

const initialForm = {
  title: '',
  description: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  venue: '',
  capacity: '50',
  registrationStatus: 'OPEN',
}

export default function CreateEventPage() {
  const { session } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [posterFile, setPosterFile] = useState(null)
  const [createdEventId, setCreatedEventId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const posterPreviewUrl = useObjectUrl(posterFile)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setCreatedEventId(null)
    setErrorMessage('')
  }

  function handlePosterChange(event) {
    const file = event.target.files?.[0] ?? null
    const validationMessage = getEventPosterValidationMessage(file)

    if (validationMessage) {
      event.target.value = ''
      setPosterFile(null)
      setErrorMessage(validationMessage)
      return
    }

    setPosterFile(file)
    setCreatedEventId(null)
    setErrorMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.title.trim() || !form.eventDate || !form.startTime || !form.endTime || !form.venue.trim()) {
      setErrorMessage('Title, date, start time, end time, and venue are required.')
      return
    }

    if (!isValidEventDate(form.eventDate) || !isValidEventTime(form.startTime) || !isValidEventTime(form.endTime)) {
      setErrorMessage('Use YYYY-MM-DD for the date and 24-hour HH:MM for both times.')
      return
    }

    if (form.endTime <= form.startTime) {
      setErrorMessage('End time must be later than start time.')
      return
    }

    const capacity = getCapacityValue(form.capacity)
    if (capacity === undefined) {
      setErrorMessage('Capacity must be a whole number greater than zero.')
      return
    }

    setCreatedEventId(null)
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: form.title.trim(),
          description: form.description.trim(),
          event_date: form.eventDate,
          start_time: form.startTime,
          end_time: form.endTime,
          venue: form.venue.trim(),
          capacity,
          registration_status: form.registrationStatus,
          created_by: session.user.id,
        })
        .select('id')
        .single()

      if (error) throw error

      if (posterFile) {
        let uploadedPosterPath = null

        try {
          uploadedPosterPath = await uploadEventPoster(data.id, posterFile)

          const { error: updateError } = await supabase
            .from('events')
            .update({ poster_path: uploadedPosterPath })
            .eq('id', data.id)
            .select('id')
            .single()

          if (updateError) throw updateError
        } catch {
          if (uploadedPosterPath) await removeEventPoster(uploadedPosterPath).catch(() => {})

          setCreatedEventId(data.id)
          setErrorMessage('The event was created, but its poster could not be uploaded. Open the event editor to try again.')
          return
        }
      }

      navigate(`/events/${data.id}`)
    } catch (error) {
      setErrorMessage(getDatabaseFeatureMessage(error, 'We could not create the event. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <BackLink to="/admin/events">Back to events</BackLink>
      <div className="bp-panel-outline mt-5 bg-[var(--bp-surface)] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Event management</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Create event</h1>
        <p className="mt-3 text-slate-600">Only real events should be added here.</p>

        {errorMessage && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <p>{errorMessage}</p>
            {createdEventId && (
              <Link className="mt-2 inline-block font-semibold text-indigo-700 hover:text-indigo-900" to={`/admin/events/${createdEventId}/edit`}>
                Edit the created event
              </Link>
            )}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <FormField label="Title" htmlFor="title">
            <input
              className={inputClassName}
              id="title"
              name="title"
              onChange={handleChange}
              value={form.title}
            />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <textarea
              id="description"
              name="description"
              onChange={handleChange}
              rows="5"
              className={`${inputClassName} resize-none`}
              value={form.description}
            />
          </FormField>

          <FormField label="Event poster (optional)" htmlFor="poster">
            {posterPreviewUrl && (
              <figure className="mb-3 border border-slate-200 bg-slate-50 p-2">
                <img
                  alt="Selected event poster preview"
                  className="aspect-video w-full object-contain"
                  draggable="false"
                  src={posterPreviewUrl}
                />
                <figcaption className="mt-2 text-xs font-medium text-slate-600">Poster preview</figcaption>
              </figure>
            )}
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              id="poster"
              onChange={handlePosterChange}
              type="file"
            />
            <label
              className="bp-control inline-flex cursor-pointer items-center gap-2 bg-[var(--bp-bg-soft)] px-4 py-3 font-bold text-[var(--bp-amber)] transition-colors hover:bg-[var(--bp-amber)]/10"
              htmlFor="poster"
            >
              <ImagePlus aria-hidden="true" size={18} /> Choose poster image
            </label>
            <p className="mt-1.5 text-xs text-slate-500">JPEG, PNG, or WebP up to 5 MB. A 16:9 image works best.</p>
            {posterFile && <p className="mt-2 text-sm text-slate-600">Selected: {posterFile.name}</p>}
          </FormField>

          <div className="grid gap-5 sm:grid-cols-3">
            <EventDateTimeField id="eventDate" kind="date" label="Date" name="eventDate" onChange={handleChange} value={form.eventDate} />
            <EventDateTimeField id="startTime" kind="time" label="Start time" name="startTime" onChange={handleChange} value={form.startTime} />
            <EventDateTimeField id="endTime" kind="time" label="End time" name="endTime" onChange={handleChange} value={form.endTime} />
          </div>

          <FormField label="Venue" htmlFor="venue">
            <input
              className={inputClassName}
              id="venue"
              name="venue"
              onChange={handleChange}
              value={form.venue}
            />
          </FormField>

          <FormField label="Capacity" htmlFor="capacity">
            <input
              className={inputClassName}
              id="capacity"
              min="1"
              name="capacity"
              onChange={handleChange}
              inputMode="numeric"
              pattern="[0-9]*"
              type="text"
              value={form.capacity}
            />
            <p className="mt-1.5 text-xs text-slate-500">Set the maximum number of active reservations.</p>
          </FormField>

          <FormField label="Registration status" htmlFor="registrationStatus">
            <SelectControl
              className="w-full"
              id="registrationStatus"
              name="registrationStatus"
              onChange={handleChange}
              options={registrationStatusOptions}
              value={form.registrationStatus}
            />
          </FormField>

          <button
            className="w-full rounded-md bg-indigo-700 px-4 py-3 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-indigo-400"
            disabled={isSubmitting || Boolean(createdEventId)}
            type="submit"
          >
            {isSubmitting ? 'Creating event...' : 'Create event'}
          </button>
        </form>
      </div>
    </section>
  )

}

function getCapacityValue(value) {
  const capacity = Number(value)
  return value.trim() && Number.isInteger(capacity) && capacity > 0 ? capacity : undefined
}

function FormField({ children, htmlFor, label }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClassName =
  'bp-control w-full bg-[var(--bp-bg-soft)] px-4 py-3 text-[var(--bp-text)] outline-none transition focus:ring-1 focus:ring-[var(--bp-amber)]'

const registrationStatusOptions = [
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
]
