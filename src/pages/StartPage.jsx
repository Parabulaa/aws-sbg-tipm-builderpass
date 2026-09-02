import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ChevronDown, CircleCheck, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal.jsx'

const learnMoreDetails = [
  'Every TIPian gets a single profile that tracks membership info, event registrations, and attendance history in one place.',
  'Admins can create events, open or close registration, and review who signed up without juggling spreadsheets.',
  'Attendance check-ins are recorded per event, giving officers an accurate, exportable record for every session.',
]

const terminalText = '> builderpass.init("tip-manila")'

const heroSlides = [
  {
    src: '/images/events/DSC_0086.JPG',
    mobileSrc: '/images/events/mobile/DSC_0086-mobile.jpg',
    caption: 'Building together. Shipping impact.',
  },
  {
    src: '/images/events/DSC_0701.JPG',
    mobileSrc: '/images/events/mobile/DSC_0701-mobile.jpg',
    caption: 'Community sessions and builder meetups.',
  },
  {
    src: '/images/events/IMG_8332.png',
    mobileSrc: '/images/events/mobile/IMG_8332-mobile.jpg',
    caption: 'Students building together.',
  },
]

const HERO_AUTOPLAY_DELAY = 5500

const features = [
  {
    icon: Users,
    title: 'Manage members',
    description: 'Keep the AWS SBG TIP Manila community organized in one dedicated member space for TIPians.',
  },
  {
    icon: CalendarDays,
    title: 'Run events',
    description: 'Discover and manage AWS SBG TIP Manila workshops, sessions, and builder activities in one place.',
  },
  {
    icon: CircleCheck,
    title: 'Track attendance',
    description: 'Keep check-ins simple and accurate for TIPians joining AWS SBG events and community sessions.',
  },
]

export default function StartPage() {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false)
  const heroTimerRef = useRef(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setDisplayedText(terminalText)
      return
    }

    let currentIndex = 0
    const typingSpeed = 50

    const timer = setInterval(() => {
      if (currentIndex < terminalText.length) {
        setDisplayedText(terminalText.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(timer)
      }
    }, typingSpeed)

    return () => clearInterval(timer)
  }, [])

  function resetHeroAutoplay() {
    if (heroTimerRef.current) window.clearInterval(heroTimerRef.current)
    heroTimerRef.current = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, HERO_AUTOPLAY_DELAY)
  }

  useEffect(() => {
    resetHeroAutoplay()
    return () => {
      if (heroTimerRef.current) window.clearInterval(heroTimerRef.current)
    }
  }, [])

  function goToHeroSlide(index) {
    setActiveSlide(index)
    resetHeroAutoplay()
  }

  function previousHeroSlide() {
    goToHeroSlide((activeSlide - 1 + heroSlides.length) % heroSlides.length)
  }

  function nextHeroSlide() {
    goToHeroSlide((activeSlide + 1) % heroSlides.length)
  }

  const currentHeroSlide = heroSlides[activeSlide]

  return (
    <>
      <section className="bp-hero-viewport mx-auto flex max-w-[80rem] items-center px-6 py-8 sm:py-12 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-6">
          <div className="max-w-2xl">
            <p className="bp-hero-in-eyebrow mono mb-2 flex items-center gap-3 text-[clamp(0.7rem,0.85vw,0.9rem)] font-bold uppercase tracking-[.2em] text-[var(--bp-text-dim)]">
              <span className="h-[2px] w-8 bg-[var(--bp-amber)]" />
              AWS Student Builder Group - TIP Manila
            </p>

            <div className="bp-hero-in-terminal mono mb-8 mt-6 text-[clamp(1.15rem,1.9vw,1.75rem)] text-[var(--bp-amber)]">
              {displayedText}
              {showCursor && <span className="terminal-cursor" />}
            </div>

            <h1 className="bp-hero-in-headline text-[clamp(2.75rem,5.4vw,4.75rem)] font-black leading-[1.05] tracking-[-0.02em] text-[var(--bp-text)]">
              Build the room.
              <br />
              <span className="text-[var(--bp-amber)]">Show up for it.</span>
            </h1>

            <p className="bp-hero-in-copy mt-8 max-w-xl text-[clamp(1.05rem,1.15vw,1.25rem)] leading-relaxed text-[var(--bp-text-dim)]">
              BuilderPass keeps your group's members, events, registrations, and attendance in one practical workspace.
            </p>

            <div className="bp-hero-in-cta mt-10 flex flex-wrap items-center gap-6">
              <Link
                className="inline-flex items-center gap-2 border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-7 py-4 text-base font-bold uppercase tracking-wide text-black transition-all duration-200 ease-out hover:translate-y-[-2px] hover:bg-[var(--bp-amber-strong)]"
                to="/register"
              >
                Join BuilderPass
                <ArrowRight size={18} />
              </Link>
              <span className="mono text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">
                For AWS SBG TIP Manila members
              </span>
            </div>
          </div>

          <div className="bp-hero-in-slideshow relative block min-w-0">
            {/* Sparse amber corner details around the frame — decorative only,
               kept off the photo itself so faces/content stay clean and readable. */}
            <span aria-hidden="true" className="absolute -left-3 -top-3 h-3 w-3 border border-[var(--bp-amber)]/60 bg-[var(--bp-amber)]/25" />
            <span aria-hidden="true" className="absolute -bottom-4 -right-4 h-5 w-5 bg-[var(--bp-amber)]/20" />

            <div className="group relative overflow-hidden border-2 border-[var(--bp-border-strong)] bg-[var(--bp-surface)]">
              <div className="relative h-56 w-full overflow-hidden sm:h-72 lg:h-80 xl:h-96 2xl:h-[26rem]">
                <div
                  className="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                >
                  {heroSlides.map((slide, index) => (
                    <picture className="h-full w-full shrink-0" key={slide.src}>
                      <source media="(max-width: 1023px)" srcSet={slide.mobileSrc} />
                      <img
                        alt={slide.caption}
                        className="h-full w-full object-cover"
                        draggable="false"
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        src={slide.src}
                      />
                    </picture>
                  ))}
                </div>

                <button
                  aria-label="Previous community photo"
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 border border-white/25 bg-black/55 p-2 text-white opacity-100 backdrop-blur transition-all duration-200 ease-out hover:bg-[var(--bp-amber)] hover:text-black sm:p-2.5 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={previousHeroSlide}
                  type="button"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  aria-label="Next community photo"
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 border border-white/25 bg-black/55 p-2 text-white opacity-100 backdrop-blur transition-all duration-200 ease-out hover:bg-[var(--bp-amber)] hover:text-black sm:p-2.5 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={nextHeroSlide}
                  type="button"
                >
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="flex flex-col items-start justify-between gap-3 border-t border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <p className="mono flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[var(--bp-text-dim)]">
                  <span className="h-2 w-2 bg-[var(--bp-amber)]" />
                  {currentHeroSlide.caption}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {heroSlides.map((slide, index) => (
                      <button
                        aria-current={index === activeSlide}
                        aria-label={`Go to slide ${index + 1}`}
                        className={`h-1.5 w-6 transition-all duration-300 ease-out ${
                          index === activeSlide ? 'bg-[var(--bp-amber)]' : 'bg-[var(--bp-text-dim)]/60 hover:bg-[var(--bp-text-muted)]'
                        }`}
                        key={slide.src}
                        onClick={() => goToHeroSlide(index)}
                        type="button"
                      />
                    ))}
                  </div>
                  <p className="mono hidden text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-amber)] sm:block">TIP Manila</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ScrollReveal as="section" className="mx-auto max-w-6xl px-6 py-16 text-center lg:px-10 lg:py-20">
        <p className="mono text-xs font-bold uppercase tracking-[.2em] text-[var(--bp-amber)]">
          [ 01 ] BUILDERPASS FOR TIPIANS
        </p>
        <h2 className="mx-auto mt-4 max-w-xl text-[clamp(1.875rem,2.8vw,2.75rem)] font-black leading-tight tracking-tight text-[var(--bp-text)]">
          One space for the builder community.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[var(--bp-text-dim)]">
          BuilderPass gives AWS Student Builder Group - TIP Manila one practical place for members, events, registrations, and attendance.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              className="group relative overflow-hidden border border-[var(--bp-border)] bg-[var(--bp-surface)]/60 p-8 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--bp-amber)]"
              key={feature.title}
            >
              {/* Sparse amber corner markers — decorative only, brighten on hover. */}
              <span
                aria-hidden="true"
                className="absolute left-3 top-3 h-1.5 w-1.5 bg-[var(--bp-amber)]/30 transition-colors duration-200 group-hover:bg-[var(--bp-amber)]"
              />
              <span
                aria-hidden="true"
                className="absolute bottom-3 right-3 h-1.5 w-1.5 bg-[var(--bp-amber)]/30 transition-colors duration-200 group-hover:bg-[var(--bp-amber)]"
              />

              <div className="mx-auto grid h-16 w-16 place-items-center border border-[var(--bp-border-strong)] text-[var(--bp-amber)] transition-colors duration-200 group-hover:border-[var(--bp-amber)] group-hover:bg-[var(--bp-amber)]/10">
                <feature.icon size={26} />
              </div>

              <h3 className="mt-6 text-lg font-bold text-[var(--bp-text)] transition-colors duration-200 group-hover:text-[var(--bp-amber)]">
                {feature.title}
              </h3>

              <div className="mx-auto mt-3 flex items-center justify-center gap-2" aria-hidden="true">
                <span className="h-px w-6 bg-[var(--bp-border-strong)]" />
                <span className="h-1.5 w-1.5 bg-[var(--bp-amber)]" />
                <span className="h-px w-6 bg-[var(--bp-border-strong)]" />
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[var(--bp-text-dim)]">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            aria-controls="tipians-learn-more"
            aria-expanded={isLearnMoreOpen}
            className="mono inline-flex items-center gap-2 border border-[var(--bp-border-strong)] px-5 py-2.5 text-xs font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)] transition-all duration-200 ease-out hover:border-[var(--bp-amber)] hover:text-[var(--bp-amber)]"
            onClick={() => setIsLearnMoreOpen((current) => !current)}
            type="button"
          >
            Learn more
            <ChevronDown
              className={`transition-transform duration-200 ease-out ${isLearnMoreOpen ? 'rotate-180' : ''}`}
              size={16}
            />
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 ease-out ${
            isLearnMoreOpen ? 'mt-8 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
          id="tipians-learn-more"
        >
          <div className="overflow-hidden">
            <div className="mx-auto max-w-2xl border-t border-[var(--bp-border)] pt-8 text-left">
              <ul className="space-y-4">
                {learnMoreDetails.map((detail) => (
                  <li className="flex items-start gap-3" key={detail}>
                    <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--bp-amber)]" size={18} />
                    <span className="text-sm leading-relaxed text-[var(--bp-text-dim)]">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </>
  )
}
