import assert from 'node:assert/strict'
import test from 'node:test'
import { isMissingBatchSummaryFunction } from '../src/utils/supabaseCompatibility.js'

test('recognizes a deployment missing the batch RSVP summary function', () => {
  assert.equal(isMissingBatchSummaryFunction({ code: 'PGRST202', message: 'missing function' }), true)
  assert.equal(isMissingBatchSummaryFunction({ code: '42501', message: 'permission denied' }), false)
})
