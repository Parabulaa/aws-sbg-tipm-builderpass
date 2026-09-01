import assert from 'node:assert/strict'
import test from 'node:test'
import { eventMatchesFilters, eventStatusLabel, getLocalDateKey } from '../src/utils/events.js'

test('getLocalDateKey uses the date local calendar fields', () => {
  const localDate = new Date(2026, 8, 1, 0, 15)

  assert.equal(getLocalDateKey(localDate), '2026-09-01')
})

test('eventMatchesFilters treats today as upcoming and applies registration status', () => {
  const event = { event_date: '2026-09-01', registration_status: 'OPEN' }

  assert.equal(eventMatchesFilters(event, { time: 'UPCOMING', registrationStatus: 'OPEN' }, '2026-09-01'), true)
  assert.equal(eventMatchesFilters(event, { time: 'PAST', registrationStatus: 'ALL' }, '2026-09-01'), false)
  assert.equal(eventMatchesFilters(event, { time: 'ALL', registrationStatus: 'CLOSED' }, '2026-09-01'), false)
})

test('eventMatchesFilters identifies dates before today as past', () => {
  const event = { event_date: '2026-08-31', registration_status: 'CLOSED' }

  assert.equal(eventMatchesFilters(event, { time: 'PAST', registrationStatus: 'CLOSED' }, '2026-09-01'), true)
})

test('eventStatusLabel has a safe closed label for non-open states', () => {
  assert.equal(eventStatusLabel('OPEN'), 'Registration open')
  assert.equal(eventStatusLabel('CLOSED'), 'Registration closed')
})
