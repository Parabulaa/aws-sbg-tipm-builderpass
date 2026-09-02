const strengthChecks = [
  {
    isMet: (password) => password.length >= 12,
    suggestion: 'Use at least 12 characters.',
  },
  {
    isMet: (password) => /[a-z]/.test(password) && /[A-Z]/.test(password),
    suggestion: 'Mix uppercase and lowercase letters.',
  },
  {
    isMet: (password) => /\d/.test(password),
    suggestion: 'Add a number.',
  },
  {
    isMet: (password) => /[^A-Za-z0-9\s]/.test(password),
    suggestion: 'Add a symbol.',
  },
]

const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']

export function getPasswordStrength(password) {
  if (!password) {
    return {
      label: 'Not entered',
      score: 0,
      suggestion: 'Use at least 12 characters with uppercase and lowercase letters, a number, and a symbol.',
    }
  }

  const unmetChecks = strengthChecks.filter((check) => !check.isMet(password))
  const score = strengthChecks.length - unmetChecks.length

  return {
    label: strengthLabels[score],
    score,
    suggestion: unmetChecks.length > 0
      ? unmetChecks.map((check) => check.suggestion).join(' ')
      : 'Strong password. Avoid reusing it on other accounts.',
  }
}
