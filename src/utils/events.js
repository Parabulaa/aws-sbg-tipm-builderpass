export function formatEventDate(eventDate) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${eventDate}T00:00:00`))
}

export function formatEventTime(startTime) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(`2000-01-01T${startTime}`),
  )
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

export function eventMatchesFilters(event, filters, today = getLocalDateKey()) {
  const matchesTime =
    filters.time === 'ALL'
    || (filters.time === 'UPCOMING' ? event.event_date >= today : event.event_date < today)
  const matchesRegistration =
    filters.registrationStatus === 'ALL'
    || event.registration_status === filters.registrationStatus

  return matchesTime && matchesRegistration
}
