import assert from 'node:assert/strict'
import test from 'node:test'
import { getRecoveryLinkError } from '../src/utils/authRecovery.js'

test('identifies expired and malformed recovery links', () => {
  assert.match(getRecoveryLinkError('?error_code=otp_expired&error_description=Link+expired'), /expired/)
  assert.match(getRecoveryLinkError('', '#error=access_denied&error_code=bad_code'), /invalid/)
  assert.equal(getRecoveryLinkError('?code=valid'), '')
})
