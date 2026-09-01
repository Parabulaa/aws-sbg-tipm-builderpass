import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BackLink from '../../components/BackLink.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../services/supabase/client.js'
import { getEventPosterValidationMessage, removeEventPoster, uploadEventPoster } from '../../utils/eventPosters.js'

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
      setErrorMessage(error.message || 'We could not create the event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <BackLink to="/admin/events">Back to events</BackLink>
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
              className={inputClassName}
              id="description"
              name="description"
              onChange={handleChange}
              rows="5"
              value={form.description}
            />
          </FormField>

          <FormField label="Event poster (optional)" htmlFor="poster">
            <input
              accept="image/jpeg,image/png,image/webp"
              className={inputClassName}
              id="poster"
              onChange={handlePosterChange}
              type="file"
            />
            <p className="mt-1.5 text-xs text-slate-500">JPEG, PNG, or WebP up to 5 MB. A 16:9 image works best.</p>
            {posterFile && <p className="mt-2 text-sm text-slate-600">Selected: {posterFile.name}</p>}
          </FormField>

          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="Date" htmlFor="eventDate">
              <input
                className={inputClassName}
                id="eventDate"
                name="eventDate"
                onChange={handleChange}
                type="date"
                value={form.eventDate}
              />
            </FormField>
            <FormField label="Start time" htmlFor="startTime">
              <input
                className={inputClassName}
                id="startTime"
                name="startTime"
                onChange={handleChange}
                type="time"
                value={form.startTime}
              />
            </FormField>
            <FormField label="End time" htmlFor="endTime">
              <input
                className={inputClassName}
                id="endTime"
                name="endTime"
                onChange={handleChange}
                type="time"
                value={form.endTime}
              />
            </FormField>
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
              step="1"
              type="number"
              value={form.capacity}
            />
            <p className="mt-1.5 text-xs text-slate-500">Set the maximum number of active reservations.</p>
          </FormField>

          <FormField label="Registration status" htmlFor="registrationStatus">
            <select
              className={inputClassName}
              id="registrationStatus"
              name="registrationStatus"
              onChange={handleChange}
              value={form.registrationStatus}
            >
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
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
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:ring-2 focus:ring-indigo-500'
