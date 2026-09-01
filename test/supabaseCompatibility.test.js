import assert from 'node:assert/strict'
import test from 'node:test'
import {
  eventWithOptionalEndTime,
  getDatabaseFeatureMessage,
  isMissingEventEndTime,
  isMissingProfileUpdateFunction,
  queryWithOptionalEventEndTime,
} from '../src/utils/supabaseCompatibility.js'

test('detects the missing end_time column returned by Postgres', () => {
  assert.equal(isMissingEventEndTime({ code: '42703', message: 'column events.end_time does not exist' }), true)
  assert.equal(isMissingEventEndTime({ code: '42501', message: 'permission denied' }), false)
})

test('retries event queries without end_time only for the legacy schema error', async () => {
  const calls = []
  const result = await queryWithOptionalEventEndTime(async (includeEndTime) => {
    calls.push(includeEndTime)
    return includeEndTime
      ? { data: null, error: { code: '42703', message: 'column events.end_time does not exist' } }
      : { data: [{ id: 'event-1' }], error: null }
  })

  assert.deepEqual(calls, [true, false])
  assert.deepEqual(result.data, [{ id: 'event-1' }])
})

test('normalizes legacy events and explains pending database features', () => {
  assert.deepEqual(eventWithOptionalEndTime({ id: 'event-1' }), { end_time: null, id: 'event-1' })

  const error = { code: 'PGRST202', message: 'Could not find the function public.update_own_profile in the schema cache' }
  assert.equal(isMissingProfileUpdateFunction(error), true)
  assert.match(getDatabaseFeatureMessage(error, 'fallback'), /Phase 8/)
})
