import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Reusable dialog/modal built with plain React + Tailwind + CSS keyframes.
 * The portal keeps the fixed overlay relative to the viewport even when a
 * page transition applies a transform to one of the dialog's ancestors.
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
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return

    const previouslyFocusedElement = document.activeElement
    const previousBodyOverflow = document.body.style.overflow

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements(dialogRef.current)
      if (focusableElements.length === 0) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)
      const focusedElementIndex = focusableElements.indexOf(document.activeElement)

      if (event.shiftKey && focusedElementIndex <= 0) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && (focusedElementIndex === -1 || document.activeElement === lastElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    getFocusableElements(dialogRef.current)[0]?.focus()

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.removeEventListener('keydown', handleKeyDown)

      if (previouslyFocusedElement instanceof HTMLElement && previouslyFocusedElement.isConnected) {
        previouslyFocusedElement.focus()
      }
    }
  }, [isOpen])

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

  return createPortal(
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
          className="absolute right-3 top-3 grid min-h-11 min-w-11 place-items-center border border-[var(--bp-border)] text-[var(--bp-text-dim)] transition-colors duration-150 hover:border-[var(--bp-amber)] hover:text-[var(--bp-amber)] sm:right-4 sm:top-4"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>

        {Icon && (
          <div className={`mb-4 grid h-11 w-11 place-items-center border ${toneIcon}`}>
            <Icon size={22} />
          </div>
        )}

        {children}
      </div>
    </div>,
    document.body,
  )
}

function getFocusableElements(container) {
  if (!container) return []

  return [...container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true')
}
