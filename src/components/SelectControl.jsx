import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { getNextOptionIndex } from '../utils/selectNavigation.js'

export default function SelectControl({ className = '', error, id, name, onChange, options, value }) {
  const generatedId = useId()
  const controlId = id || `bp-select-${generatedId}`
  const listboxId = `${controlId}-listbox`
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selectedOption = options[selectedIndex]

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isOpen])

  function openMenu(index = selectedIndex) {
    setHighlightedIndex(index)
    setIsOpen(true)
  }

  function selectOption(option) {
    onChange({ target: { name, value: option.value } })
    setIsOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      if (!isOpen) return
      event.preventDefault()
      setIsOpen(false)
      triggerRef.current?.focus()
      return
    }

    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      if (!isOpen) {
        openMenu(getNextOptionIndex(selectedIndex, event.key, options.length))
      } else {
        setHighlightedIndex((current) => getNextOptionIndex(current, event.key, options.length))
      }
      return
    }

    if (event.key === 'Tab') {
      setIsOpen(false)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isOpen && highlightedIndex >= 0) selectOption(options[highlightedIndex])
      else openMenu()
    }
  }

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-describedby={error ? `${controlId}-error` : undefined}
        aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={Boolean(error)}
        className={`bp-control bp-select-trigger flex h-12 w-full items-center justify-between gap-4 bg-[var(--bp-bg-soft)] px-4 text-left text-[var(--bp-text)] transition-colors ${error ? 'bp-control-error' : ''} ${
          isOpen ? 'ring-1 ring-inset ring-[var(--bp-amber)]' : ''
        }`}
        id={controlId}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        role="combobox"
        ref={triggerRef}
        type="button"
      >
        <span className="truncate">{selectedOption?.label || 'Select an option'}</span>
        <ChevronDown className={`shrink-0 text-[var(--bp-amber)] transition-transform ${isOpen ? 'rotate-180' : ''}`} size={18} />
      </button>

      {isOpen && (
        <div
          aria-labelledby={controlId}
          className="bp-scroll absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-y-auto border border-[var(--bp-amber)] bg-[var(--bp-surface-raised)] p-1 shadow-2xl shadow-black/50"
          id={listboxId}
          role="listbox"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isHighlighted = index === highlightedIndex

            return (
              <button
                aria-selected={isSelected}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'bg-[var(--bp-amber)] text-black'
                    : isHighlighted
                      ? 'bg-[var(--bp-amber)]/15 text-[var(--bp-amber)]'
                      : 'text-[var(--bp-text)] hover:bg-[var(--bp-amber)]/10 hover:text-[var(--bp-amber)]'
                }`}
                id={`${listboxId}-option-${index}`}
                key={option.value}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                ref={(element) => { optionRefs.current[index] = element }}
                tabIndex={-1}
                type="button"
              >
                <span>{option.label}</span>
                {isSelected && <Check aria-hidden="true" size={16} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
