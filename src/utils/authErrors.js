const fallbackByOperation = {
  login: 'We could not sign you in. Please try again.',
  register: 'We could not create your account. Please try again.',
  recovery: 'We could not send the reset email. Please try again.',
  reset: 'We could not update your password. Request a new reset link and try again.',
  verification: 'We could not resend the verification email. Please try again shortly.',
}

export function getAuthErrorMessage(error, operation) {
  const code = String(error?.code || '').toLowerCase()
  const message = String(error?.message || '').toLowerCase()

  if (error?.status === 429 || code.includes('rate_limit') || message.includes('rate limit')) {
    return 'Too many attempts. Wait a moment before trying again.'
  }
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'The email or password is incorrect.'
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Confirm your email address before signing in.'
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return 'An account already exists for this email. Try signing in instead.'
  }
  if (code.includes('weak_password') || message.includes('password should')) {
    return 'Choose a stronger password that meets every requirement.'
  }
  if (code === 'same_password' || message.includes('same password')) {
    return 'Your new password must be different from your current password.'
  }
  if (message.includes('fetch') || message.includes('network')) {
    return 'BuilderPass could not reach the server. Check your connection and try again.'
  }

  return fallbackByOperation[operation] || 'The authentication request could not be completed. Please try again.'
}
