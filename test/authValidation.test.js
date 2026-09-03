import assert from 'node:assert/strict'
import test from 'node:test'
import { getPasswordInputType, getPasswordMatchState, validateRegistrationForm } from '../src/utils/authValidation.js'

const validForm = {
  studentNumber: '2026-001',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  course: 'BSCS',
  yearLevel: '1',
  password: 'BuilderPass9!Secure',
  confirmPassword: 'BuilderPass9!Secure',
}

test('accepts a complete registration form with a strong matching password', () => {
  assert.deepEqual(validateRegistrationForm(validForm), {})
})

test('reports invalid identity fields, weak passwords, and mismatched confirmation', () => {
  const errors = validateRegistrationForm({
    ...validForm,
    email: 'not-an-email',
    password: 'weak',
    confirmPassword: 'different',
  })

  assert.match(errors.email, /valid email/)
  assert.match(errors.password, /every requirement/)
  assert.match(errors.confirmPassword, /do not match/)
})

test('hides confirmation feedback until typed and reports either result', () => {
  assert.equal(getPasswordMatchState('BuilderPass9!Secure', ''), null)
  assert.deepEqual(getPasswordMatchState('BuilderPass9!Secure', 'different'), {
    matches: false,
    message: 'Passwords do not match',
  })
  assert.equal(getPasswordMatchState('BuilderPass9!Secure', 'BuilderPass9!Secure')?.matches, true)
})

test('maps password visibility to the correct input type', () => {
  assert.equal(getPasswordInputType(false), 'password')
  assert.equal(getPasswordInputType(true), 'text')
})
