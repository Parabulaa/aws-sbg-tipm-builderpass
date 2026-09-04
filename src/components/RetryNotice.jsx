import { RefreshCw } from 'lucide-react'

export default function RetryNotice({ isRetrying = false, message, onRetry }) {
  return (
    <div className="border border-[var(--bp-danger)]/60 bg-[var(--bp-danger)]/10 px-4 py-4" role="alert">
      <p className="text-sm text-[var(--bp-danger)]">{message}</p>
      <button
        className="mt-3 inline-flex min-h-11 items-center gap-2 border border-[var(--bp-amber)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[var(--bp-amber)] transition-colors hover:bg-[var(--bp-amber)] hover:text-black disabled:cursor-wait disabled:opacity-60"
        disabled={isRetrying}
        onClick={onRetry}
        type="button"
      >
        <RefreshCw aria-hidden="true" className={isRetrying ? 'animate-spin' : ''} size={16} />
        {isRetrying ? 'Retrying...' : 'Try again'}
      </button>
    </div>
  )
}
