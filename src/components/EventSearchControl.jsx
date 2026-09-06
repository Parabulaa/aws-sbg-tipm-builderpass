import { LoaderCircle, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function EventSearchControl({ id, onChange, value }) {
  const [draftValue, setDraftValue] = useState(value)
  const [isComposing, setIsComposing] = useState(false)
  const inputRef = useRef(null)
  const submittedValueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    // An acknowledgement of our debounce must not overwrite newer keystrokes.
    if (value !== submittedValueRef.current) {
      submittedValueRef.current = value
      setDraftValue(value)
    }
  }, [value])

  useEffect(() => {
    if (draftValue === value || isComposing) return undefined

    const timerId = window.setTimeout(() => {
      submittedValueRef.current = draftValue
      onChangeRef.current({ target: { name: 'search', value: draftValue } })
    }, 300)

    return () => window.clearTimeout(timerId)
  }, [draftValue, value, isComposing])

  function clearSearch() {
    setDraftValue('')
    submittedValueRef.current = ''
    onChange({ target: { name: 'search', value: '' } })
    inputRef.current?.focus()
  }

  return (
    <div className="bp-control bp-control-accent flex h-12 items-center gap-3 px-4">
      <Search aria-hidden="true" className="shrink-0 text-[var(--bp-amber)]" size={18} />
      <input
        aria-label="Search events by name"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[var(--bp-text)] outline-none"
        id={id}
        name="search"
        ref={inputRef}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(event) => {
          setIsComposing(false)
          setDraftValue(event.currentTarget.value)
        }}
        onChange={(event) => setDraftValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && draftValue) {
            event.preventDefault()
            clearSearch()
          }
        }}
        placeholder="Event name"
        type="text"
        value={draftValue}
      />
      {draftValue !== value && (
        <LoaderCircle aria-label="Updating event results" className="shrink-0 animate-spin text-[var(--bp-amber)]" size={16} />
      )}
      {draftValue && (
        <button
          aria-label="Clear event search"
          className="-my-1.5 -mr-3 grid h-11 w-11 shrink-0 place-items-center text-[var(--bp-text-dim)] transition-colors hover:text-[var(--bp-amber)] focus-visible:text-[var(--bp-amber)]"
          onClick={clearSearch}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      )}
    </div>
  )
}
