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
