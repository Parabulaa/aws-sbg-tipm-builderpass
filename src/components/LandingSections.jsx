import { CalendarDays, CircleCheck, Users } from 'lucide-react'
import CommunityGallery from './CommunityGallery.jsx'
import ScrollReveal from './ScrollReveal.jsx'
import { approvedTestimonials, testimonials } from '../content/testimonials.js'

const benefits = [
  { icon: CalendarDays, title: 'Find your next event', text: 'Browse community workshops and sessions, with the date, time, and venue in one place.' },
  { icon: Users, title: 'Reserve your spot', text: 'See availability, confirm your RSVP, and cancel while registration is open and the event has not ended.' },
  { icon: CircleCheck, title: 'Keep track of your activity', text: 'Review your reservations and attendance recorded by event officers from your member dashboard.' },
]
const faqs = [
  { question: 'Do I need prior experience?', answer: 'Check each event’s description for prerequisites and the intended experience level. If you are new to AWS or unsure whether a session is suitable, ask the organizers through the official Facebook link below. Contact the group for organization membership requirements.' },
  { question: 'Is BuilderPass dedicated to AWS SBG TIPM?', answer: 'Yes. BuilderPass is dedicated to AWS Student Builder Group – TIP Manila (AWS SBG TIPM). It supports our members, events, registrations, and participation records. Registration asks for your AWS SBG Member ID and academic details. For eligibility or member ID concerns, use the official Facebook link below.' },
  { question: 'Does creating an account mean I have joined the organization?', answer: 'An account gives you access to the BuilderPass member workspace. For official organization membership requirements or approval, contact AWS SBG TIPM through the official Facebook link below.' },
  { question: 'Is there a membership or event fee?', answer: 'Check the official membership announcement and each event’s details for any fees. For confirmation, message AWS SBG TIPM using the Facebook link below before joining or attending.' },
  { question: 'Can I browse events before creating an account?', answer: 'Yes. Publicly published events are available to everyone. Sign in to view member events, check available spots, and confirm a reservation.' },
  { question: 'How do I register for an event?', answer: 'Create an account, verify your email if prompted, and sign in. Open an event with registration available and select Reserve a spot. Your place is confirmed when the page shows RSVP confirmed.' },
  { question: 'Can I cancel my RSVP?', answer: 'You can cancel an active RSVP while registration is open and the event has not ended, provided your attendance has not already been finalized. Your spot becomes available to another member.' },
  { question: 'What if an event is full?', answer: 'New reservations are unavailable when capacity is reached. Check the event again later in case a member cancels and a spot becomes available.' },
  { question: 'How is my attendance recorded?', answer: 'Event officers record attendance. A reservation alone does not mark you as present. Review your activity after the event and contact the organizers if a record needs correction.' },
]

function Section({ id, eyebrow, title, children }) {
  return <ScrollReveal as="section" id={id} threshold={0} className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14 lg:px-10 lg:py-20">
    <p className="mono text-xs font-bold uppercase tracking-[.18em] text-[var(--bp-amber)]">{eyebrow}</p>
    <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">{title}</h2>
    {children}
  </ScrollReveal>
}

export default function LandingSections() {
  const quotes = approvedTestimonials(testimonials)
  return <>
    <Section id="why-join" eyebrow="01 / Why join" title="Make room for your next builder experience.">
      <div className="mt-7 grid gap-8 md:grid-cols-2">
        <p className="text-lg leading-8 text-[var(--bp-text-muted)]">AWS Student Builder Group at TIP Manila brings students together through community events and workshops. BuilderPass is your workspace for finding sessions, reserving a spot, and tracking your participation.</p>
        <div className="border-l-2 border-[var(--bp-amber)] pl-6"><h3 className="text-xl font-bold">Who can join?</h3><p className="mt-3 leading-7 text-[var(--bp-text-dim)]">BuilderPass serves AWS SBG TIP Manila members. Sign up with your AWS SBG Member ID and academic details. For organization membership, eligibility, or a missing member ID, contact the group through the Facebook link in the FAQ.</p></div>
      </div>
      <h3 className="mt-10 text-2xl font-bold">Membership benefits</h3>
      <div className="mt-8 grid gap-6 md:grid-cols-3">{benefits.map(({ icon: Icon, title, text }) => <div key={title} className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-7"><Icon aria-hidden="true" className="text-[var(--bp-amber)]" size={28} /><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-[var(--bp-text-dim)]">{text}</p></div>)}</div>
      <div className="mt-10 border-t border-[var(--bp-border)] pt-8"><h3 className="text-xl font-bold">Start in three steps</h3><ol className="mt-6 grid gap-6 md:grid-cols-3">{[['Create your account', 'Use your email, AWS SBG Member ID, and academic details.'], ['Verify your email', 'Follow the inbox link if prompted, then sign in.'], ['Find an event & reserve', 'Choose a session and confirm your RSVP while spots are available.']].map(([title, text], i) => <li key={title}><span className="mono text-sm font-bold text-[var(--bp-amber)]">0{i + 1}</span><h4 className="mt-2 font-bold">{title}</h4><p className="mt-2 text-sm leading-6 text-[var(--bp-text-dim)]">{text}</p></li>)}</ol></div>
    {quotes.length > 0 && <div id="member-stories" className="mt-10"><h3 className="text-2xl font-bold">In our members’ words.</h3><div className="mt-8 grid gap-6 md:grid-cols-3">{quotes.map((quote) => <figure key={quote.id} className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-7"><blockquote className="text-lg leading-8">“{quote.quote}”</blockquote><figcaption className="mt-5 text-sm text-[var(--bp-text-dim)]"><strong>{quote.name}</strong>{quote.attribution && <span className="mt-1 block">{quote.attribution}</span>}</figcaption></figure>)}</div></div>}
    </Section>
    <Section id="events" eyebrow="02 / Events" title="Community in pictures.">
      <CommunityGallery />
    </Section>

    <Section id="faq" eyebrow="03 / FAQ" title="Before you join."><div className="mt-8 divide-y divide-[var(--bp-border)] border-y border-[var(--bp-border)]">{faqs.map(({ question, answer }) => <details className="group py-5" key={question}><summary className="cursor-pointer py-2 pr-4 text-lg font-bold marker:text-[var(--bp-amber)]">{question}</summary><p className="mt-3 max-w-3xl leading-7 text-[var(--bp-text-dim)]">{answer}</p></details>)}</div><a className="mt-6 inline-flex min-h-11 items-center font-bold text-[var(--bp-amber)]" href="https://www.facebook.com/awssbgtip" target="_blank" rel="noopener noreferrer">For concerns, message AWS SBG TIPM on Facebook →</a></Section>
  </>
}
