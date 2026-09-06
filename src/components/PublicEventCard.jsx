import { Link } from 'react-router-dom'
import EventPoster from './EventPoster.jsx'
import { formatEventDate, formatEventTimeRange } from '../utils/events.js'
import { publicEventLifecycle } from '../utils/publicEvents.js'

export default function PublicEventCard({ event, poster, now, onRetry }) {
  const lifecycle = publicEventLifecycle(event, now)
  const ended = lifecycle === 'ENDED'
  const label = ended ? 'Event ended' : lifecycle === 'IN_PROGRESS' ? 'Happening now' : 'Upcoming'
  return (
    <article className="flex min-w-0 flex-col border border-[var(--bp-border)] bg-[var(--bp-surface)] p-5 sm:p-6">
      <EventPoster className="aspect-video w-full" imageClassName="object-contain" src={poster} title={event.title} onRetry={onRetry} />
      <p className="mono mt-5 text-xs font-bold uppercase tracking-wider text-[var(--bp-amber)]">{label}</p>
      <h3 className="mt-3 break-words text-xl font-bold"><Link className="hover:text-[var(--bp-amber)]" to={`/events/${event.id}`}>{event.title}</Link></h3>
      <p className="mt-3 text-sm text-[var(--bp-text-dim)]">{formatEventDate(event.event_date)} · {formatEventTimeRange(event.start_time, event.end_time)} PHT</p>
      <p className="mt-2 break-words text-sm text-[var(--bp-text-dim)]">{event.venue}</p>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--bp-text-muted)]">{ended ? event.recap || event.description : event.description}</p>
      {!ended && <p className="mt-4 text-sm font-semibold">{event.registration_status === 'OPEN' ? 'Registration open · subject to availability' : 'Registration closed'}</p>}
      <Link className="mt-auto inline-flex min-h-11 items-center pt-5 font-bold text-[var(--bp-amber)]" to={`/events/${event.id}`}>
        {ended ? 'View event recap' : 'View event details'} →
      </Link>
    </article>
  )
}
