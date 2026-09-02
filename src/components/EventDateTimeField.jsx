export default function EventDateTimeField({ id, kind, label, name, onChange, value }) {
  const isDate = kind === 'date'
  const placeholder = isDate ? 'YYYY-MM-DD' : 'HH:MM'

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--bp-text-muted)]" htmlFor={id}>{label}</label>
      <div className="bp-control min-w-0 bg-[var(--bp-bg-soft)] px-3">
        <input
          aria-describedby={`${id}-hint`}
          className="bp-date-time-input w-full min-w-0 border-0 bg-transparent px-0 py-3 text-[var(--bp-text)] outline-none"
          id={id}
          lang={isDate ? undefined : 'en-US'}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required
          step={isDate ? undefined : 60}
          type={kind}
          value={value}
        />
      </div>
      <p className="mt-1.5 text-xs text-[var(--bp-text-dim)]" id={`${id}-hint`}>
        Open the {isDate ? 'calendar' : 'time picker'} or enter a valid {isDate ? 'date' : 'time'} manually{isDate ? '.' : ' (AM/PM shown by your device).'}
      </p>
    </div>
  )
}
