export function getRecoveryLinkError(search = '', hash = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const errorCode = params.get('error_code') || hashParams.get('error_code')
  const description = params.get('error_description') || hashParams.get('error_description')

  if (errorCode === 'otp_expired' || description?.toLowerCase().includes('expired')) {
    return 'This password-reset link has expired. Request a new link to continue.'
  }
  if (errorCode || params.get('error') || hashParams.get('error')) {
    return 'This password-reset link is invalid or has already been used.'
  }

  return ''
}
