import { Eye, EyeOff } from 'lucide-react'
import AuthInput from './AuthInput.jsx'
import { getPasswordInputType } from '../../utils/authValidation.js'

export default function PasswordInput({
  autoComplete = 'new-password',
  describedBy,
  error,
  id,
  isVisible,
  label = 'password',
  name,
  onChange,
  onToggleVisibility,
  value,
}) {
  const VisibilityIcon = isVisible ? EyeOff : Eye

  return (
    <div className="relative">
      <AuthInput
        aria-describedby={describedBy}
        autoComplete={autoComplete}
        className="pr-12"
        error={error}
        id={id}
        name={name}
        onChange={onChange}
        type={getPasswordInputType(isVisible)}
        value={value}
      />
      <button
        aria-label={`${isVisible ? 'Hide' : 'Show'} ${label}`}
        aria-pressed={isVisible}
        className={`bp-password-visibility-toggle absolute right-0 top-0 flex h-full w-12 items-center justify-center transition-colors focus-visible:text-[var(--bp-text-muted)] ${
          isVisible
            ? 'text-[var(--bp-text-muted)] hover:text-[var(--bp-text)]'
            : 'text-[var(--bp-text-dim)] hover:text-[var(--bp-text-muted)]'
        }`}
        onClick={onToggleVisibility}
        type="button"
      >
        <VisibilityIcon aria-hidden="true" size={19} />
      </button>
    </div>
  )
}
