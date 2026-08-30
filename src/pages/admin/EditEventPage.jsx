import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackLink from '../../components/BackLink.jsx'
import { supabase } from '../../services/supabase/client.js'

const initialForm = {
  title: '',
  description: '',
  eventDate: '',
  startTime: '',
  venue: '',
  registrationStatus: 'OPEN',
}

export default function EditEventPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUnavailable, setIsUnavailable] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadEvent() {
      setIsLoading(true)
      setErrorMessage('')
      setIsUnavailable(false)

      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, event_date, start_time, venue, registration_status')
        .eq('id', id)
        .maybeSingle()

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
          venue: data.venue,
          registrationStatus: data.registration_status,
        })
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

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.title.trim() || !form.eventDate || !form.startTime || !form.venue.trim()) {
      setErrorMessage('Title, date, start time, and venue are required.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: form.title.trim(),
          description: form.description.trim(),
          event_date: form.eventDate,
          start_time: form.startTime,
          venue: form.venue.trim(),
          registration_status: form.registrationStatus,
        })
        .eq('id', id)
        .select('id')
        .single()

      if (error) throw error

      navigate('/admin/events')
    } catch (error) {
      setErrorMessage(error.message || 'We could not save this event. Please try again.')
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
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
              className={inputClassName}
              id="description"
              name="description"
              onChange={handleChange}
              rows="5"
              value={form.description}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
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
