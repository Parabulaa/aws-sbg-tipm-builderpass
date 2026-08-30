import { useEffect, useRef } from 'react'

// Fixed, decorative intersection markers (tiny 5px dots). Positions are
// expressed as viewport percentages so they read as sparse technical
// details scattered around the page rather than a repeating pattern.
const markers = [
  { top: '9%', left: '51%' },
  { top: '14%', left: '4%' },
  { top: '22%', left: '90%' },
  { top: '38%', left: '96%' },
  { top: '58%', left: '32%' },
  { top: '66%', left: '8%' },
  { top: '78%', left: '68%' },
  { top: '86%', left: '18%' },
]

// Modular amber grid cells. Each is aligned to the 36px grid pitch (the
// same pitch used by the CSS grid-line background in index.css) via px
// offsets that are exact multiples of 36 (or 18, a clean half-step), so
// every square sits exactly on a grid intersection rather than floating
// freely. Each cell fades in, holds, and fades out on its own independent,
// slow loop — duration/delay/peak opacity/size are deliberately staggered
// so cells never activate in sync and the page reads as sparse, not busy.
const cells = [
  { left: 396, top: 108, size: 34, duration: 11, delay: 0, peak: 0.32 },
  { left: 900, top: 180, size: 18, duration: 14, delay: 2.5, peak: 0.22 },
  { left: 216, top: 324, size: 34, duration: 9, delay: 5, peak: 0.28 },
  { left: 1188, top: 252, size: 18, duration: 16, delay: 1, peak: 0.2 },
  { left: 684, top: 396, size: 34, duration: 12, delay: 6.5, peak: 0.4 },
  { left: 1044, top: 468, size: 18, duration: 10, delay: 3.5, peak: 0.25 },
  { left: 324, top: 468, size: 18, duration: 15, delay: 8, peak: 0.22 },
  { left: 828, top: 72, size: 34, duration: 13, delay: 4, peak: 0.28 },
  { left: 72, top: 216, size: 18, duration: 17, delay: 9.5, peak: 0.18 },
  { left: 1260, top: 396, size: 34, duration: 12.5, delay: 7, peak: 0.24 },
  { left: 540, top: 540, size: 18, duration: 10.5, delay: 2, peak: 0.2 },
  { left: 972, top: 36, size: 18, duration: 15.5, delay: 5.5, peak: 0.22 },
]

/**
 * Decorative ambient background: a two-layer amber technical grid that
 * drifts extremely slowly (independent speeds/directions for a light sense
 * of depth), a sparse set of grid-aligned amber squares that pulse in and
 * out on independent slow loops, plus a very light parallax response to
 * pointer movement. Purely visual — sits behind all content, ignores
 * pointer events, and never affects layout.
 *
 * Pass `muted` on data-dense pages (dashboard, admin, tables) to dial the
 * grid/cells down without removing them.
 */
export default function GridBackground({ muted = false }) {
  const layerRef = useRef(null)
  const deepLayerRef = useRef(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let frame = null

    function handlePointerMove(event) {
      const { innerWidth, innerHeight } = window
      const offsetX = (event.clientX / innerWidth - 0.5) * 8
      const offsetY = (event.clientY / innerHeight - 0.5) * 8

      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        if (layerRef.current) {
          layerRef.current.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`
        }
        if (deepLayerRef.current) {
          deepLayerRef.current.style.transform = `translate3d(${offsetX * -0.4}px, ${offsetY * -0.4}px, 0)`
        }
      })
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div aria-hidden="true" className={`bp-grid-wrap ${muted ? 'bp-grid-muted' : ''}`}>
      <div className="bp-grid-layer-deep" ref={deepLayerRef} />
      <div className="bp-grid-layer" ref={layerRef} />
      <div className="bp-grid-cells">
        {cells.map((cell) => (
          <span
            className="bp-grid-cell"
            key={`${cell.left}-${cell.top}`}
            style={{
              left: `${cell.left}px`,
              top: `${cell.top}px`,
              animationDuration: `${cell.duration}s`,
              animationDelay: `${cell.delay}s`,
              '--bp-cell-peak': cell.peak,
              '--bp-cell-size': `${cell.size}px`,
            }}
          />
        ))}
      </div>
      {markers.map((marker) => (
        <span className="bp-grid-marker" key={`${marker.top}-${marker.left}`} style={marker} />
      ))}
    </div>
  )
}
