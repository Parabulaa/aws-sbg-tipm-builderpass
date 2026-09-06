import { CalendarDays, CircleCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import ScrollReveal from './ScrollReveal.jsx'
import PublicEventCard from './PublicEventCard.jsx'
import RetryNotice from './RetryNotice.jsx'
import { EventCardSkeletons } from './LoadingSkeleton.jsx'
import usePublicEvents from '../hooks/usePublicEvents.js'
import { selectPublicEvents } from '../utils/publicEvents.js'
import { approvedTestimonials, testimonials } from '../content/testimonials.js'

const benefits = [
  { icon: CalendarDays, title: 'Find your next event', text: 'Browse community workshops and sessions, with the date, time, and venue in one place.' },
  { icon: Users, title: 'Reserve your spot', text: 'See availability, confirm your RSVP, and cancel while registration is open and the event has not ended.' },
  { icon: CircleCheck, title: 'Keep track of your activity', text: 'Review your reservations and attendance recorded by event officers from your member dashboard.' },
]
const faqs = [
  { question: 'Who is BuilderPass for?', answer: 'BuilderPass is the event and member workspace for AWS Student Builder Group at TIP Manila. Registration asks for your AWS SBG Member ID and academic details. If you are unsure about your eligibility or your program is not listed, contact the group before registering.' },
  { question: 'Does creating an account mean I have joined the organization?', answer: 'An account gives you access to the BuilderPass member workspace. For official organization membership requirements or approval, contact AWS SBG TIP Manila at aws.mnl@tip.edu.ph.' },
  { question: 'Is there a membership or event fee?', answer: 'Check the official membership announcement and each event’s details for any fees. For confirmation, contact aws.mnl@tip.edu.ph before joining or attending.' },
  { question: 'Can I browse events before creating an account?', answer: 'Yes. Publicly published events are available to everyone. Sign in to view member events, check available spots, and confirm a reservation.' },
  { question: 'How do I register for an event?', answer: 'Create an account, verify your email if prompted, and sign in. Open an event with registration available and select Reserve a spot. Your place is confirmed when the page shows RSVP confirmed.' },
  { question: 'Can I cancel my RSVP?', answer: 'You can cancel an active RSVP while registration is open and the event has not ended, provided your attendance has not already been finalized. Your spot becomes available to another member.' },
  { question: 'What if an event is full?', answer: 'New reservations are unavailable when capacity is reached. Check the event again later in case a member cancels and a spot becomes available.' },
  { question: 'How is my attendance recorded?', answer: 'Event officers record attendance. A reservation alone does not mark you as present. Review your activity after the event and contact the organizers if a record needs correction.' },
]

function Section({ id, eyebrow, title, children }) {
  return <ScrollReveal as="section" id={id} className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14 lg:px-10 lg:py-20">
    <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">{eyebrow}</p>
    <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">{title}</h2>
    {children}
  </ScrollReveal>
}

export default function LandingSections() {
  const data = usePublicEvents()
  const quotes = approvedTestimonials(testimonials)
  function eventSection(period) {
    const events = selectPublicEvents(data.events, { period, limit: 3, now: data.now })
    return <>
      {data.loading ? <EventCardSkeletons /> : data.error ? <div className="mt-6"><RetryNotice message={data.error} onRetry={data.retry} /></div> : events.length ?
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{events.map((event) => <PublicEventCard key={event.id} event={event} now={data.now} poster={data.posters[event.poster_path]} onRetry={event.poster_path ? () => data.refreshPoster(event.poster_path) : undefined} />)}</div>
        : <div className="mt-8 border border-[var(--bp-border)] bg-[var(--bp-surface)] p-7"><p className="font-bold">{period === 'PAST' ? 'Community moments will appear here.' : 'The next session is on its way.'}</p><p className="mt-2 text-sm leading-6 text-[var(--bp-text-dim)]">{period === 'PAST' ? 'Explore previous public events and their recaps once the organizers publish them.' : 'No upcoming public events are posted yet. Check back for the next announcement, or sign in to see member events.'}</p></div>}
      {data.posterWarning && <p className="mt-4 text-sm" role="status">{data.posterWarning}</p>}
      <Link className="mt-5 inline-flex min-h-11 items-center font-bold text-[var(--bp-amber)]" to={`/events?time=${period}`}>{period === 'PAST' ? 'Browse previous events' : 'Explore events'} →</Link>
    </>
  }
  return <>
    <nav aria-label="On this page" className="mx-auto flex max-w-6xl flex-wrap gap-x-7 gap-y-2 border-y border-[var(--bp-border)] px-6 py-4 lg:px-10">
      {[['why-join', 'Why join'], ['benefits', 'Benefits'], ['upcoming-events', 'Upcoming events'], ['previous-events', 'Previous events'], ...(quotes.length ? [['member-stories', 'Member stories']] : []), ['faq', 'FAQ']].map(([id, label]) => <a className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--bp-text-dim)] hover:text-[var(--bp-amber)]" key={id} href={`#${id}`}>{label}</a>)}
    </nav>
    <Section id="why-join" eyebrow="01 / Why join" title="Make room for your next builder experience.">
      <div className="mt-7 grid gap-8 md:grid-cols-2">
        <p className="text-lg leading-8 text-[var(--bp-text-muted)]">Stay connected to AWS SBG TIP Manila and find your next chance to take part. Whether you’re exploring a workshop or returning for another session, BuilderPass helps you turn interest into participation.</p>
        <div className="border-l-2 border-[var(--bp-amber)] pl-6"><h3 className="text-xl font-bold">Your community. Your participation.</h3><p className="mt-3 leading-7 text-[var(--bp-text-dim)]">See what’s happening, choose an event that interests you, and keep a record of the sessions you attend. Create a BuilderPass account to use the member workspace; contact the group for official membership requirements.</p></div>
      </div>
    </Section>
    <Section id="benefits" eyebrow="02 / What you get" title="Less searching. More showing up.">
      <div className="mt-8 grid gap-6 md:grid-cols-3">{benefits.map(({ icon: Icon, title, text }) => <div key={title} className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-7"><Icon aria-hidden="true" className="text-[var(--bp-amber)]" size={28} /><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-[var(--bp-text-dim)]">{text}</p></div>)}</div>
      <p className="mt-6 text-sm leading-6 text-[var(--bp-text-dim)]"><strong className="text-[var(--bp-text-muted)]">For officers:</strong> Create events, manage registrations, and record attendance in the same workspace.</p>
      <div className="mt-10 border-t border-[var(--bp-border)] pt-8"><h3 className="text-xl font-bold">Start in three steps</h3><ol className="mt-6 grid gap-6 md:grid-cols-3">{[['Create your account', 'Use your email, AWS SBG Member ID, and academic details.'], ['Verify your email', 'Follow the inbox link if prompted, then sign in.'], ['Find an event & reserve', 'Choose a session and confirm your RSVP while spots are available.']].map(([title, text], i) => <li key={title}><span className="mono text-sm font-bold text-[var(--bp-amber)]">0{i + 1}</span><h4 className="mt-2 font-bold">{title}</h4><p className="mt-2 text-sm leading-6 text-[var(--bp-text-dim)]">{text}</p></li>)}</ol></div>
    </Section>
    <Section id="upcoming-events" eyebrow="03 / Upcoming events" title="Find your next session.">{eventSection('UPCOMING')}</Section>
    <Section id="previous-events" eyebrow="04 / Previous events" title="Look back at what we’ve shared.">{eventSection('PAST')}</Section>
    {quotes.length > 0 && <Section id="member-stories" eyebrow="Member stories" title="In our members’ words."><div className="mt-8 grid gap-6 md:grid-cols-3">{quotes.map((quote) => <figure key={quote.id} className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-7"><blockquote className="text-lg leading-8">“{quote.quote}”</blockquote><figcaption className="mt-5 text-sm text-[var(--bp-text-dim)]"><strong>{quote.name}</strong>{quote.attribution && <span className="mt-1 block">{quote.attribution}</span>}</figcaption></figure>)}</div></Section>}
    <Section id="faq" eyebrow="05 / FAQ" title="Before you join."><div className="mt-8 divide-y divide-[var(--bp-border)] border-y border-[var(--bp-border)]">{faqs.map(({ question, answer }) => <details className="group py-5" key={question}><summary className="cursor-pointer py-2 pr-4 text-lg font-bold marker:text-[var(--bp-amber)]">{question}</summary><p className="mt-3 max-w-3xl leading-7 text-[var(--bp-text-dim)]">{answer}</p></details>)}</div><a className="mt-6 inline-flex min-h-11 items-center font-bold text-[var(--bp-amber)]" href="mailto:aws.mnl@tip.edu.ph">Still have a question? Contact the group →</a></Section>
    <section className="mx-auto max-w-6xl px-6 py-10 lg:px-10"><div className="border border-[var(--bp-amber-muted)] bg-[var(--bp-surface)] p-8 sm:p-12"><h2 className="text-3xl font-black sm:text-4xl">Your next event starts here.</h2><p className="mt-4 max-w-2xl leading-7 text-[var(--bp-text-dim)]">Create your account to reserve spots and keep track of your community participation.</p><div className="mt-7 flex flex-wrap gap-4"><Link className="inline-flex min-h-12 items-center bg-[var(--bp-amber)] px-6 font-bold text-black" to="/register">Join BuilderPass →</Link><Link className="inline-flex min-h-12 items-center border border-[var(--bp-border-strong)] px-6 font-bold" to="/events">Explore events</Link></div></div></section>
  </>
}
