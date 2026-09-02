import { CalendarDays, Clock3 } from 'lucide-react'

export default function EventDateTimeField({ id, kind, label, name, onChange, onUseCurrent, value }) {
  const isDate = kind === 'date'
  const Icon = isDate ? CalendarDays : Clock3
  const placeholder = isDate ? 'YYYY-MM-DD' : 'HH:MM'

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[var(--bp-text-muted)]" htmlFor={id}>{label}</label>
        <button
          className="mono text-[11px] font-bold uppercase tracking-[.1em] text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]"
          onClick={onUseCurrent}
          type="button"
        >
          {isDate ? 'Use today' : 'Use now'}
        </button>
      </div>
      <div className="bp-control flex items-center gap-3 bg-[var(--bp-bg-soft)] px-3">
        <Icon aria-hidden="true" className="shrink-0 text-[var(--bp-amber)]" size={17} />
        <input
          aria-describedby={`${id}-hint`}
          className="min-w-0 flex-1 border-0 bg-transparent px-0 py-3 text-[var(--bp-text)] outline-none"
          id={id}
          inputMode="numeric"
          maxLength={isDate ? 10 : 5}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          value={value}
        />
      </div>
      <p className="mt-1.5 text-xs text-[var(--bp-text-dim)]" id={`${id}-hint`}>
        Enter {placeholder} manually or choose {isDate ? 'Use today' : 'Use now'}.
      </p>
    </div>
  )
}
