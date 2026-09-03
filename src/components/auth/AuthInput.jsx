export const authInputClassName = (error, className = '') =>
  `bp-control h-12 w-full bg-[var(--bp-bg-soft)] px-4 text-[var(--bp-text)] outline-none transition-colors ${
    error ? 'bp-control-error' : ''
  } ${className}`

export default function AuthInput({ className = '', error, ...props }) {
  return (
    <input
      {...props}
      aria-invalid={Boolean(error)}
      className={authInputClassName(error, className)}
    />
  )
}
