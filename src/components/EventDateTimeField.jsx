import { CalendarDays, Clock3 } from 'lucide-react'

export default function EventDateTimeField({ id, kind, label, name, onChange, onUseCurrent, value }) {
  const isDate = kind === 'date'
  const Icon = isDate ? CalendarDays : Clock3
  const placeholder = isDate ? 'YYYY-MM-DD' : 'HH:MM'

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--bp-text-muted)]" htmlFor={id}>{label}</label>
      <div className="bp-control flex min-w-0 items-center gap-2 bg-[var(--bp-bg-soft)] px-3">
        <Icon aria-hidden="true" className="shrink-0 text-[var(--bp-amber)]" size={17} />
        <input
          aria-describedby={`${id}-hint`}
          className="bp-date-time-input min-w-0 flex-1 border-0 bg-transparent px-0 py-3 text-[var(--bp-text)] outline-none"
          id={id}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          step={isDate ? undefined : 60}
          type={kind}
          value={value}
        />
        <button
          aria-label={`Set ${label.toLowerCase()} to ${isDate ? 'today' : 'the current time'}`}
          className="mono shrink-0 border-l border-[var(--bp-border)] py-1 pl-2 text-[10px] font-bold uppercase tracking-[.08em] text-[var(--bp-amber)] hover:text-[var(--bp-amber-strong)]"
          onClick={onUseCurrent}
          type="button"
        >
          {isDate ? 'Today' : 'Now'}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-[var(--bp-text-dim)]" id={`${id}-hint`}>
        Enter {placeholder} manually or open the {isDate ? 'calendar' : 'time picker'}.
      </p>
    </div>
  )
}
