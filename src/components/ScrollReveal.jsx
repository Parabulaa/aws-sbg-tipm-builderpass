import { useEffect, useRef, useState } from 'react'

/**
 * Wraps a section and fades/slides it into view once it enters the viewport.
 * Presentation-only: does not affect the wrapped content's behavior, state,
 * or accessibility tree. Respects prefers-reduced-motion by rendering the
 * content already visible.
 */
export default function ScrollReveal({ as: Tag = 'div', children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.15 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      className={`bp-reveal ${isVisible ? 'bp-reveal-visible' : ''} ${className}`}
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
