import assert from 'node:assert/strict'
import test from 'node:test'
import { getRemainingCooldown } from '../src/hooks/useResendCooldown.js'

test('calculates resend cooldowns without returning negative values', () => {
  assert.equal(getRemainingCooldown(61_000, 1_000), 60)
  assert.equal(getRemainingCooldown(1_001, 1_000), 1)
  assert.equal(getRemainingCooldown(999, 1_000), 0)
  assert.equal(getRemainingCooldown('invalid', 1_000), 0)
})
