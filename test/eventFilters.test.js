import assert from 'node:assert/strict'
import test from 'node:test'
import { createEventFilterParams, parseEventFilters } from '../src/utils/eventFilters.js'

const config = {
  search: { defaultValue: '', param: 'q' },
  time: { defaultValue: 'ALL', param: 'time', values: ['ALL', 'UPCOMING', 'PAST'] },
  status: { defaultValue: 'ALL', param: 'registration', values: ['ALL', 'OPEN', 'CLOSED'] },
}

test('parses supported filters and rejects invalid URL values', () => {
  const filters = parseEventFilters(new URLSearchParams('q=cloud&time=UPCOMING&registration=INVALID'), config)

  assert.deepEqual(filters, { search: 'cloud', time: 'UPCOMING', status: 'ALL' })
})

test('serializes only active event filters for concise shareable URLs', () => {
  const params = createEventFilterParams({ search: 'Community Day', time: 'ALL', status: 'OPEN' }, config)

  assert.equal(params.toString(), 'q=Community+Day&registration=OPEN')
  assert.deepEqual(parseEventFilters(params, config), { search: 'Community Day', time: 'ALL', status: 'OPEN' })
})
