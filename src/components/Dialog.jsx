import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

/**
 * Reusable dialog/modal built with plain React + Tailwind + CSS keyframes.
 * No portal, no external dependency — a fixed overlay is sufficient for this
 * app's needs and keeps behavior simple and predictable.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - titleId: string (id applied to the heading, referenced by aria-labelledby)
 * - tone: 'amber' | 'success' | 'danger' (accent used for the top border/icon)
 * - icon: optional Lucide icon component rendered in the header
 * - children: dialog body content
 */
export default function Dialog({ children, icon: Icon, isOpen, onClose, titleId, tone = 'amber' }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const toneBorder =
    tone === 'success'
      ? 'border-t-[var(--bp-success)]'
      : tone === 'danger'
        ? 'border-t-[var(--bp-danger)]'
        : 'border-t-[var(--bp-amber)]'

  const toneIcon =
    tone === 'success'
      ? 'border-[var(--bp-success)] bg-[var(--bp-success)]/10 text-[var(--bp-success)]'
      : tone === 'danger'
        ? 'border-[var(--bp-danger)] bg-[var(--bp-danger)]/10 text-[var(--bp-danger)]'
        : 'border-[var(--bp-amber)] bg-[var(--bp-amber)]/10 text-[var(--bp-amber)]'

  return (
    <div
      className="bp-overlay-enter fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={`bp-dialog-enter relative w-full max-w-md border border-[var(--bp-border)] border-t-2 ${toneBorder} bg-[var(--bp-surface)] p-6 sm:p-8`}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <button
          aria-label="Close dialog"
          className="absolute right-4 top-4 border border-[var(--bp-border)] p-1.5 text-[var(--bp-text-dim)] transition-colors duration-150 hover:border-[var(--bp-amber)] hover:text-[var(--bp-amber)]"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>

        {Icon && (
          <div className={`mb-4 grid h-11 w-11 place-items-center border ${toneIcon}`}>
            <Icon size={22} />
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
