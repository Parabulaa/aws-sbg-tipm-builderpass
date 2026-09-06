export function publicEventLifecycle(event, now = new Date()) {
  // Event schedules are wall-clock times in Manila, including for visitors abroad.
  const start = new Date(`${event.event_date}T${event.start_time}+08:00`)
  const end = new Date(`${event.event_date}T${event.end_time || event.start_time}+08:00`)
  if (now >= end) return 'ENDED'
  return now >= start ? 'IN_PROGRESS' : 'UPCOMING'
}

export function selectPublicEvents(events, { period = 'ALL', search = '', limit = Infinity, now = new Date() } = {}) {
  return events
    .filter((event) => event.publication_status === 'PUBLISHED' && event.visibility === 'PUBLIC')
    .filter((event) => event.title.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((event) => period === 'ALL' || (period === 'PAST'
      ? publicEventLifecycle(event, now) === 'ENDED'
      : publicEventLifecycle(event, now) !== 'ENDED'))
    .sort((a, b) => {
      const comparison = `${a.event_date}T${a.start_time}`.localeCompare(`${b.event_date}T${b.start_time}`) || a.id.localeCompare(b.id)
      return period === 'PAST' ? -comparison : comparison
    })
    .slice(0, limit)
}
