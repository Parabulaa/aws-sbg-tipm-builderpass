import { useSearchParams } from 'react-router-dom'
import EventSearchControl from '../components/EventSearchControl.jsx'
import PublicEventCard from '../components/PublicEventCard.jsx'
import RetryNotice from '../components/RetryNotice.jsx'
import SelectControl from '../components/SelectControl.jsx'
import { EventCardSkeletons } from '../components/LoadingSkeleton.jsx'
import usePublicEvents from '../hooks/usePublicEvents.js'
import { selectPublicEvents } from '../utils/publicEvents.js'

export default function PublicEventsPage() {
  const data = usePublicEvents()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') || ''
  const period = ['ALL', 'UPCOMING', 'PAST'].includes(params.get('time')) ? params.get('time') : 'ALL'
  const events = selectPublicEvents(data.events, { search, period, now: data.now })
  function change(event) {
    const key = event.target.name === 'search' ? 'q' : 'time'
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (!event.target.value || event.target.value === 'ALL') next.delete(key)
      else next.set(key, event.target.value)
      return next
    }, { replace: true })
  }
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 lg:px-10">
      <p className="mono text-xs font-bold uppercase tracking-wider text-[var(--bp-amber)]">AWS SBG TIP Manila</p>
      <h1 className="mt-4 text-4xl font-black">Explore community events</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[var(--bp-text-dim)]">See what’s coming up and revisit previous events. Sign in to reserve a spot and see events available to members.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_14rem]">
        <div><label className="mb-2 block text-sm font-bold" htmlFor="public-event-search">Search events</label><EventSearchControl id="public-event-search" value={search} onChange={change} /></div>
        <div><label className="mb-2 block text-sm font-bold" htmlFor="public-event-time">Time</label><SelectControl id="public-event-time" name="time" value={period} onChange={change} options={[{ value: 'ALL', label: 'All events' }, { value: 'UPCOMING', label: 'Upcoming & live' }, { value: 'PAST', label: 'Previous events' }]} /></div>
      </div>
      {(search || period !== 'ALL') && <button className="mt-4 min-h-11 font-bold text-[var(--bp-amber)]" type="button" onClick={() => setParams({}, { replace: true })}>Reset filters</button>}
      {data.loading && <EventCardSkeletons />}
      {data.error && <div className="mt-6"><RetryNotice message={data.error} onRetry={data.retry} /></div>}
      {data.posterWarning && <p className="mt-4 text-sm" role="status">{data.posterWarning}</p>}
      {!data.loading && !data.error && <>
        <p className="mt-6 text-sm text-[var(--bp-text-dim)]" role="status">{events.length} event{events.length === 1 ? '' : 's'} found</p>
        {events.length ? <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{events.map((event) => <PublicEventCard key={event.id} event={event} now={data.now} poster={data.posters[event.poster_path]} onRetry={event.poster_path ? () => data.refreshPoster(event.poster_path) : undefined} />)}</div>
          : <p className="mt-5 border border-[var(--bp-border)] p-6 text-[var(--bp-text-dim)]">{search ? 'No matching events. Try another name or reset the filters.' : period === 'PAST' ? 'Previous public events will appear here when available.' : 'No public events are posted for this selection yet. Check back for the next community session.'}</p>}
      </>}
    </section>
  )
}
