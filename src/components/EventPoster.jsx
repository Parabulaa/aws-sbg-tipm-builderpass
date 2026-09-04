import { ImageOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPosterDisplayState } from '../utils/posterDisplay.js'

export default function EventPoster({ className = '', imageClassName = '', loading = 'lazy', onRetry, src, title }) {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    setHasError(false)
    setIsLoaded(false)
    setIsRetrying(false)
  }, [src])

  const displayState = getPosterDisplayState({ hasError, isLoaded, src })
  const showFallback = displayState === 'unavailable'

  async function retryPoster(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!onRetry || isRetrying) return

    setIsRetrying(true)
    setHasError(false)
    setIsLoaded(false)
    try {
      await onRetry()
    } catch {
      setHasError(true)
      setIsRetrying(false)
    }
  }

  return (
    <div
      className={`relative isolate overflow-hidden border border-[var(--bp-border)] bg-[var(--bp-bg-soft)] ${className}`}
    >
      {displayState !== 'ready' && (
        <div
          aria-label={showFallback ? `${title} poster unavailable` : `${title} poster loading`}
          className="absolute inset-0 z-10 grid place-items-center bg-[linear-gradient(135deg,var(--bp-bg-soft),var(--bp-surface-raised))]"
          role="img"
        >
          <div className="text-center">
            <ImageOff aria-hidden="true" className="mx-auto text-[var(--bp-amber-muted)]" size={28} />
            <p className="mono mt-2 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--bp-text-dim)]">
              {isRetrying ? 'Refreshing poster' : showFallback ? 'Poster unavailable' : 'Loading poster'}
            </p>
            {showFallback && onRetry && (
              <button
                className="mt-3 border border-[var(--bp-amber-muted)] px-3 py-1.5 text-xs font-bold text-[var(--bp-amber)] hover:border-[var(--bp-amber)]"
                disabled={isRetrying}
                onClick={retryPoster}
                type="button"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}

      {src && !hasError && (
        <img
          alt={`${title} poster`}
          className={`relative h-full w-full transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${imageClassName}`}
          draggable="false"
          loading={loading}
          onError={() => {
            setHasError(true)
            setIsRetrying(false)
          }}
          onLoad={() => {
            setIsLoaded(true)
            setIsRetrying(false)
          }}
          src={src}
        />
      )}
    </div>
  )
}
