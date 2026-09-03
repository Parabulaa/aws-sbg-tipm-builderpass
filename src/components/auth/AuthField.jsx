export default function AuthField({ children, error, htmlFor, label, labelAction }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="block text-sm font-semibold text-[var(--bp-text-muted)]" htmlFor={htmlFor}>
          {label}
        </label>
        {labelAction}
      </div>
      {children}
      {error && <p className="mt-2 text-sm text-[var(--bp-danger)]">{error}</p>}
    </div>
  )
}
