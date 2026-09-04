import assert from 'node:assert/strict'
import test from 'node:test'
import { getAuthErrorMessage } from '../src/utils/authErrors.js'

test('maps authentication failures without exposing provider messages', () => {
  assert.equal(getAuthErrorMessage({ code: 'invalid_credentials' }, 'login'), 'The email or password is incorrect.')
  assert.match(getAuthErrorMessage({ status: 429 }, 'verification'), /Too many attempts/)
  assert.match(getAuthErrorMessage({ message: 'Failed to fetch' }, 'login'), /connection/)
  assert.equal(getAuthErrorMessage({ message: 'Internal database details' }, 'register'), 'We could not create your account. Please try again.')
})
