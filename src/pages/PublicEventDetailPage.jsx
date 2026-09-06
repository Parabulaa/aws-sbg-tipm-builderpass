import { Link, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink.jsx'
import EventPoster from '../components/EventPoster.jsx'
import RetryNotice from '../components/RetryNotice.jsx'
import { EventDetailSkeleton } from '../components/LoadingSkeleton.jsx'
import usePublicEvents from '../hooks/usePublicEvents.js'
import { authLink } from '../utils/authDestination.js'
import { formatEventDate, formatEventTimeRange } from '../utils/events.js'
import { publicEventLifecycle } from '../utils/publicEvents.js'

export default function PublicEventDetailPage() {
  const { id } = useParams()
  const data = usePublicEvents(id)
  if (data.loading) return <EventDetailSkeleton />
  const event = data.events[0]
  const ended = event && publicEventLifecycle(event, data.now) === 'ENDED'
  return (
    <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
      <BackLink to="/events">Back to events</BackLink>
      {data.error ? <div className="mt-8"><RetryNotice message={data.error} onRetry={data.retry} /></div> : !event ? <div className="mt-8 border border-[var(--bp-border)] p-6"><h1 className="text-2xl font-bold">This event isn’t publicly available.</h1><p className="mt-3 text-[var(--bp-text-dim)]">It may be members only or no longer published.</p><Link className="mt-5 inline-flex min-h-11 items-center font-bold text-[var(--bp-amber)]" to={authLink('/login', `/events/${id}`)}>Sign in to check member access →</Link></div> : <article className="mt-8 border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 sm:p-9">
        <p className="mono text-xs font-bold uppercase tracking-wider text-[var(--bp-amber)]">{ended ? 'Previous event' : 'Community event'}</p>
        <h1 className="mt-4 break-words text-3xl font-black sm:text-4xl">{event.title}</h1>
        <p className="mt-4 text-[var(--bp-text-dim)]">{formatEventDate(event.event_date)} · {formatEventTimeRange(event.start_time, event.end_time)} PHT (Manila)</p>
        <p className="mt-2 break-words text-[var(--bp-text-dim)]">{event.venue}</p>
        <EventPoster className="mt-6 aspect-video w-full" imageClassName="object-contain" src={data.posters[event.poster_path]} title={event.title} onRetry={event.poster_path ? () => data.refreshPoster(event.poster_path) : undefined} />
        {data.posterWarning && <p className="mt-3 text-sm" role="status">{data.posterWarning}</p>}
        <p className="mt-6 whitespace-pre-wrap break-words leading-7 text-[var(--bp-text-muted)]">{event.description}</p>
        {ended && event.recap && <div className="mt-8 border-t border-[var(--bp-border)] pt-6"><h2 className="text-xl font-bold">What happened</h2><p className="mt-3 whitespace-pre-wrap break-words leading-7 text-[var(--bp-text-dim)]">{event.recap}</p></div>}
        <div className="mt-8 border-t border-[var(--bp-border)] pt-6">
          {ended ? <p>This event has ended. Browse upcoming events to find your next session.</p> : event.registration_status !== 'OPEN' ? <p>Registration is closed. You can still read the event announcement here.</p> : <>
            <p className="text-sm text-[var(--bp-text-dim)]">Registration is open, subject to available spots. Sign in to check availability and confirm your RSVP.</p>
            <div className="mt-5 flex flex-wrap gap-4"><Link className="inline-flex min-h-12 items-center bg-[var(--bp-amber)] px-5 font-bold text-black" to={authLink('/login', `/events/${id}`)}>Sign in to reserve</Link><Link className="inline-flex min-h-12 items-center border border-[var(--bp-amber)] px-5 font-bold text-[var(--bp-amber)]" to={authLink('/register', `/events/${id}`)}>Create an account</Link></div>
          </>}
        </div>
      </article>}
    </section>
  )
}
