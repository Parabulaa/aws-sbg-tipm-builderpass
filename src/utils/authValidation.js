import { getPasswordStrength } from './passwordStrength.js'

export function validateRegistrationForm(form) {
  const errors = {}
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!form.studentNumber.trim()) errors.studentNumber = 'Student number is required.'
  if (!form.firstName.trim()) errors.firstName = 'First name is required.'
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.'
  if (!emailPattern.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (!form.course.trim()) errors.course = 'Course or program is required.'
  if (!form.yearLevel) errors.yearLevel = 'Select a year level.'
  if (getPasswordStrength(form.password).score < 4) errors.password = 'Password must meet every requirement below.'
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.'

  return errors
}

export function getPasswordMatchState(password, confirmation) {
  if (!confirmation) return null

  const matches = password === confirmation
  return {
    matches,
    message: matches ? '✓ Passwords match' : 'Passwords do not match',
  }
}

export function getPasswordInputType(isVisible) {
  return isVisible ? 'text' : 'password'
}
