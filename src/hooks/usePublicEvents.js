import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client.js'
import { getEventPosterUrls } from '../utils/eventPosters.js'

const fields = 'id, title, description, event_date, start_time, end_time, venue, capacity, registration_status, poster_path, publication_status, visibility, recap'

export default function usePublicEvents(id) {
  const [events, setEvents] = useState([])
  const [posters, setPosters] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [posterWarning, setPosterWarning] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      setPosterWarning('')
      setEvents([])
      setPosters({})
      try {
        let query = supabase.from('events').select(fields)
          .eq('publication_status', 'PUBLISHED').eq('visibility', 'PUBLIC')
          .order('event_date').order('start_time').order('id')
        if (id) query = query.eq('id', id)
        const { data, error: queryError } = await query
        if (queryError) throw queryError
        if (!active) return
        setEvents(data || [])
        setLoading(false)
        try {
          const urls = await getEventPosterUrls((data || []).map((event) => event.poster_path), 300)
          if (active) setPosters(urls)
        } catch {
          if (active) setPosterWarning('Some event posters are unavailable. Event details are still available.')
        }
      } catch {
        if (active) setError('We could not load public events. Please try again.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id, reloadKey])

  async function refreshPoster(path) {
    const urls = await getEventPosterUrls([path], 300)
    setPosters((current) => ({ ...current, ...urls }))
  }

  return { events, posters, loading, error, posterWarning, now, refreshPoster, retry: () => setReloadKey((key) => key + 1) }
}
