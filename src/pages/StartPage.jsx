import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LandingSections from '../components/LandingSections.jsx'
import useReducedMotion from '../hooks/useReducedMotion.js'

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

export default function StartPage() {
  const [displayedText, setDisplayedText] = useState('')
  const reducedMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    if (reducedMotion) {
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
  }, [reducedMotion])

  useEffect(() => {
    if (paused || reducedMotion) return
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, HERO_AUTOPLAY_DELAY)
    return () => window.clearInterval(timer)
  }, [paused, reducedMotion])

  function goToHeroSlide(index) {
    setActiveSlide(index)
    setPaused(true)
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
              {!reducedMotion && <span className="terminal-cursor" />}
            </div>

            <h1 className="bp-hero-in-headline text-[clamp(2.75rem,5.4vw,4.75rem)] font-black leading-[1.05] tracking-[-0.02em] text-[var(--bp-text)]">
              Find your next event.
              <br />
              <span className="text-[var(--bp-amber)]">Be part of it.</span>
            </h1>

            <p className="bp-hero-in-copy mt-8 max-w-xl text-[clamp(1.05rem,1.15vw,1.25rem)] leading-relaxed text-[var(--bp-text-dim)]">
              Discover AWS SBG TIP Manila events, reserve your spot, and track your community participation in one place.
            </p>

            <div className="bp-hero-in-cta mt-10 flex flex-wrap items-center gap-6">
              <Link
                className="inline-flex items-center gap-2 border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-7 py-4 text-base font-bold uppercase tracking-wide text-black transition-all duration-200 ease-out hover:translate-y-[-2px] hover:bg-[var(--bp-amber-strong)]"
                to="/register"
              >
                Join BuilderPass
                <ArrowRight size={18} />
              </Link>
              <Link className="inline-flex min-h-12 items-center gap-2 border border-[var(--bp-border-strong)] px-6 font-bold text-[var(--bp-text)] hover:border-[var(--bp-amber)]" to="/events">Explore events <ArrowRight size={18} /></Link>
            </div>
          </div>

          <div className="bp-hero-in-slideshow relative block min-w-0">
            <div className="group relative overflow-hidden border-2 border-[var(--bp-border-strong)] bg-[var(--bp-surface)]">
              <div className="relative h-56 w-full overflow-hidden sm:h-72 lg:h-80 xl:h-96 2xl:h-[26rem]">
                <div
                  className="flex h-full w-full transition-transform duration-700 motion-reduce:transition-none ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                >
                  {heroSlides.map((slide, index) => (
                    <picture className="block h-full w-full shrink-0" key={slide.src}>
                      <source media="(max-width: 1023px)" srcSet={slide.mobileSrc} />
                      <img
                        alt={slide.caption}
                        className="block h-full w-full object-cover object-center"
                        decoding={index === 0 ? 'sync' : 'async'}
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
                <div className="flex flex-wrap items-center gap-3">
                  {reducedMotion ? <span className="text-xs text-[var(--bp-text-dim)]">Autoplay off</span> : <button aria-label={paused ? 'Play community slideshow' : 'Pause community slideshow'} className="grid min-h-11 min-w-11 place-items-center border border-[var(--bp-border)] text-[var(--bp-amber)]" onClick={() => setPaused((current) => !current)} type="button">{paused ? <Play size={16} /> : <Pause size={16} />}</button>}
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

      <LandingSections />
    </>
  )
}
