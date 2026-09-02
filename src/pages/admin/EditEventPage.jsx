import { ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackLink from '../../components/BackLink.jsx'
import EventDateTimeField from '../../components/EventDateTimeField.jsx'
import SelectControl from '../../components/SelectControl.jsx'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { supabase } from '../../services/supabase/client.js'
import {
  getEventPosterUrl,
  getEventPosterValidationMessage,
  removeEventPoster,
  uploadEventPoster,
} from '../../utils/eventPosters.js'
import { isValidEventDate, isValidEventTime } from '../../utils/events.js'
import {
  eventWithOptionalEndTime,
  getDatabaseFeatureMessage,
  queryWithOptionalEventEndTime,
} from '../../utils/supabaseCompatibility.js'

const initialForm = {
  title: '',
  description: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  venue: '',
  capacity: '',
  registrationStatus: 'OPEN',
}

export default function EditEventPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const posterInputRef = useRef(null)
  const [form, setForm] = useState(initialForm)
  const [posterPath, setPosterPath] = useState(null)
  const [posterUrl, setPosterUrl] = useState(null)
  const [posterFile, setPosterFile] = useState(null)
  const [shouldRemovePoster, setShouldRemovePoster] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUnavailable, setIsUnavailable] = useState(false)
  const posterPreviewUrl = useObjectUrl(posterFile)
  const displayedPosterUrl = posterPreviewUrl || (!shouldRemovePoster ? posterUrl : '')

  useEffect(() => {
    let isActive = true

    async function loadEvent() {
      setIsLoading(true)
      setErrorMessage('')
      setIsUnavailable(false)
      setPosterFile(null)
      setShouldRemovePoster(false)
      setPosterUrl(null)

      const { data: rawData, error } = await queryWithOptionalEventEndTime((includeEndTime) => supabase
        .from('events')
        .select(includeEndTime
          ? 'id, title, description, event_date, start_time, end_time, venue, capacity, registration_status, poster_path'
          : 'id, title, description, event_date, start_time, venue, capacity, registration_status, poster_path')
        .eq('id', id)
        .maybeSingle())
      const data = eventWithOptionalEndTime(rawData)

      if (!isActive) return

      if (error || !data) {
        setErrorMessage(error?.message || 'This event is not available.')
        setIsUnavailable(true)
      } else {
        setForm({
          title: data.title,
          description: data.description,
          eventDate: data.event_date,
          startTime: data.start_time.slice(0, 5),
          endTime: data.end_time?.slice(0, 5) || '',
          venue: data.venue,
          capacity: data.capacity == null ? '' : String(data.capacity),
          registrationStatus: data.registration_status,
        })
        setPosterPath(data.poster_path)

        if (data.poster_path) {
          getEventPosterUrl(data.poster_path)
            .then((url) => {
              if (isActive) setPosterUrl(url)
            })
            .catch(() => {})
        }
      }

      setIsLoading(false)
    }

    loadEvent()

    return () => {
      isActive = false
    }
  }, [id])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
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
    setShouldRemovePoster(false)
    setErrorMessage('')
  }

  function handleRemovePoster() {
    setPosterFile(null)
    setShouldRemovePoster(true)
    setPosterUrl(null)
    setErrorMessage('')
    if (posterInputRef.current) posterInputRef.current.value = ''
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

    setErrorMessage('')
    setIsSubmitting(true)
    let uploadedPosterPath = null

    try {
      let nextPosterPath = posterPath
      if (posterFile) {
        uploadedPosterPath = await uploadEventPoster(id, posterFile)
        nextPosterPath = uploadedPosterPath
      } else if (shouldRemovePoster) {
        nextPosterPath = null
      }

      const update = {
        title: form.title.trim(),
        description: form.description.trim(),
        event_date: form.eventDate,
        start_time: form.startTime,
        end_time: form.endTime,
        venue: form.venue.trim(),
        capacity,
        registration_status: form.registrationStatus,
      }

      if (nextPosterPath !== posterPath) update.poster_path = nextPosterPath

      const { error } = await supabase
        .from('events')
        .update(update)
        .eq('id', id)
        .select('id')
        .single()

      if (error) throw error

      if (posterPath && nextPosterPath !== posterPath) {
        await removeEventPoster(posterPath).catch(() => {})
      }

      navigate('/admin/events')
    } catch (error) {
      if (uploadedPosterPath) await removeEventPoster(uploadedPosterPath).catch(() => {})
      setErrorMessage(getDatabaseFeatureMessage(error, 'We could not save this event. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <section className="mx-auto max-w-2xl px-5 py-12 text-slate-600">Loading event...</section>
  }

  if (isUnavailable) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-12">
        <p className="text-sm text-red-700">{errorMessage}</p>
        <div className="mt-5">
          <BackLink to="/admin/events">Back to events</BackLink>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <BackLink to="/admin/events">Back to events</BackLink>
      <div className="bp-panel-outline mt-5 bg-[var(--bp-surface)] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Event management</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Edit event</h1>
        <p className="mt-3 text-slate-600">Changes update this event without changing its registrations or attendance.</p>

        {errorMessage && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {errorMessage}
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
              className={`${inputClassName} resize-none`}
              id="description"
              name="description"
              onChange={handleChange}
              rows="5"
              value={form.description}
            />
          </FormField>

          <FormField label="Event poster" htmlFor="poster">
            {displayedPosterUrl && (
              <figure className="mb-3 border border-slate-200 bg-slate-50 p-2">
                <img
                  alt={posterPreviewUrl ? 'New event poster preview' : 'Current event poster'}
                  className="aspect-video w-full object-contain"
                  draggable="false"
                  src={displayedPosterUrl}
                />
                <figcaption className="mt-2 text-xs font-medium text-slate-600">
                  {posterPreviewUrl ? 'New poster preview' : 'Current poster'}
                </figcaption>
              </figure>
            )}
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              id="poster"
              onChange={handlePosterChange}
              ref={posterInputRef}
              type="file"
            />
            <label
              className="bp-control inline-flex cursor-pointer items-center gap-2 bg-[var(--bp-bg-soft)] px-4 py-3 font-bold text-[var(--bp-amber)] transition-colors hover:bg-[var(--bp-amber)]/10"
              htmlFor="poster"
            >
              <ImagePlus aria-hidden="true" size={18} /> Choose replacement image
            </label>
            <p className="mt-1.5 text-xs text-slate-500">JPEG, PNG, or WebP up to 5 MB. A new image replaces the current poster.</p>
            {posterFile && <p className="mt-2 text-sm text-slate-600">New poster: {posterFile.name}</p>}
            {shouldRemovePoster && <p className="mt-2 text-sm text-slate-600">The current poster will be removed when you save.</p>}
            {posterPath && !shouldRemovePoster && (
              <button
                className="mt-3 text-sm font-medium text-red-700 hover:text-red-900"
                onClick={handleRemovePoster}
                type="button"
              >
                Remove current poster
              </button>
            )}
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
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Saving changes...' : 'Save changes'}
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
