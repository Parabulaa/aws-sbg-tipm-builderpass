export function formatEventDate(eventDate) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${eventDate}T00:00:00`))
}

export function formatEventTime(startTime) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(`2000-01-01T${startTime}`),
  )
}

export function formatEventTimeRange(startTime, endTime) {
  const start = formatEventTime(startTime)
  return endTime ? `${start}–${formatEventTime(endTime)}` : start
}

export function eventStatusLabel(status) {
  return status === 'OPEN' ? 'Registration open' : 'Registration closed'
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getEventLifecycle(event, now = new Date()) {
  const start = new Date(`${event.event_date}T${event.start_time}`)
  const end = new Date(`${event.event_date}T${event.end_time || event.start_time}`)

  if (now >= end) return 'ENDED'
  if (now >= start) return 'IN_PROGRESS'
  return 'UPCOMING'
}

export function eventIsCurrent(event, now = new Date()) {
  return getEventLifecycle(event, now) !== 'ENDED'
}

export function eventRegistrationLabel(event, now = new Date()) {
  if (!eventIsCurrent(event, now)) return 'Event ended'
  return eventStatusLabel(event.registration_status)
}

export function eventMatchesFilters(event, filters, todayOrNow = new Date()) {
  const now = typeof todayOrNow === 'string' ? new Date(`${todayOrNow}T00:00:00`) : todayOrNow
  const lifecycle = getEventLifecycle(event, now)
  const matchesTime = filters.time === 'ALL'
    || (filters.time === 'CURRENT' && lifecycle !== 'ENDED')
    || (filters.time === 'UPCOMING' && lifecycle === 'UPCOMING')
    || (filters.time === 'PAST' && lifecycle === 'ENDED')
  const effectiveRegistrationStatus = eventIsCurrent(event, now) && event.registration_status === 'OPEN'
    ? 'OPEN'
    : 'CLOSED'
  const matchesRegistration =
    filters.registrationStatus === 'ALL'
    || effectiveRegistrationStatus === filters.registrationStatus

  return matchesTime && matchesRegistration
}
