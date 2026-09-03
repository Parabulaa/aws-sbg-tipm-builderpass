import { Search, X } from 'lucide-react'

export default function EventSearchControl({ id, onChange, value }) {
  function clearSearch() {
    onChange({ target: { name: 'search', value: '' } })
  }

  return (
    <div className="bp-control bp-control-accent flex h-12 items-center gap-3 px-4">
      <Search aria-hidden="true" className="shrink-0 text-[var(--bp-amber)]" size={18} />
      <input
        aria-label="Search events by name"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[var(--bp-text)] outline-none"
        id={id}
        name="search"
        onChange={onChange}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault()
            clearSearch()
          }
        }}
        placeholder="Event name"
        type="text"
        value={value}
      />
      {value && (
        <button
          aria-label="Clear event search"
          className="-mr-2 grid h-8 w-8 shrink-0 place-items-center text-[var(--bp-text-dim)] transition-colors hover:text-[var(--bp-amber)] focus-visible:text-[var(--bp-amber)]"
          onClick={clearSearch}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      )}
    </div>
  )
}
