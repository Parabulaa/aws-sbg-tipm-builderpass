import { Search } from 'lucide-react'

export default function EventSearchControl({ id, onChange, value }) {
  return (
    <div className="bp-control bp-control-accent flex h-12 items-center gap-3 px-4">
      <Search aria-hidden="true" className="shrink-0 text-[var(--bp-amber)]" size={18} />
      <input
        aria-label="Search events by name"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[var(--bp-text)] outline-none"
        id={id}
        name="search"
        onChange={onChange}
        placeholder="Event name"
        type="search"
        value={value}
      />
    </div>
  )
}
