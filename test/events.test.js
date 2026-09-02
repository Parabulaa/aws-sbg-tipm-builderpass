import assert from 'node:assert/strict'
import test from 'node:test'
import {
  eventIsCurrent,
  eventMatchesFilters,
  eventRegistrationLabel,
  eventStatusLabel,
  formatEventTimeRange,
  getEventLifecycle,
  getLocalDateKey,
  getLocalTimeValue,
  isValidEventDate,
  isValidEventTime,
} from '../src/utils/events.js'

test('getLocalDateKey uses the date local calendar fields', () => {
  const localDate = new Date(2026, 8, 1, 0, 15)

  assert.equal(getLocalDateKey(localDate), '2026-09-01')
})

test('event form helpers format local time and reject invalid manual values', () => {
  const localDate = new Date(2026, 8, 1, 7, 5)

  assert.equal(getLocalTimeValue(localDate), '07:05')
  assert.equal(isValidEventDate('2026-09-01'), true)
  assert.equal(isValidEventDate('2026-02-30'), false)
  assert.equal(isValidEventTime('23:59'), true)
  assert.equal(isValidEventTime('24:00'), false)
  assert.equal(isValidEventTime('7:05'), false)
})

test('eventMatchesFilters treats today as upcoming and applies registration status', () => {
  const event = { event_date: '2026-09-01', start_time: '10:00', end_time: '12:00', registration_status: 'OPEN' }
  const morning = new Date('2026-09-01T09:00:00')

  assert.equal(eventMatchesFilters(event, { time: 'UPCOMING', registrationStatus: 'OPEN' }, morning), true)
  assert.equal(eventMatchesFilters(event, { time: 'PAST', registrationStatus: 'ALL' }, morning), false)
  assert.equal(eventMatchesFilters(event, { time: 'ALL', registrationStatus: 'CLOSED' }, morning), false)
})

test('eventMatchesFilters identifies dates before today as past', () => {
  const event = { event_date: '2026-08-31', start_time: '10:00', end_time: '12:00', registration_status: 'CLOSED' }

  assert.equal(eventMatchesFilters(event, { time: 'PAST', registrationStatus: 'CLOSED' }, new Date('2026-09-01T00:00:00')), true)
})

test('eventStatusLabel has a safe closed label for non-open states', () => {
  assert.equal(eventStatusLabel('OPEN'), 'Registration open')
  assert.equal(eventStatusLabel('CLOSED'), 'Registration closed')
})

test('event lifecycle distinguishes upcoming, in-progress, and ended events', () => {
  const event = { event_date: '2026-09-01', start_time: '10:00', end_time: '12:00' }

  assert.equal(getEventLifecycle(event, new Date('2026-09-01T09:59:00')), 'UPCOMING')
  assert.equal(getEventLifecycle(event, new Date('2026-09-01T10:00:00')), 'IN_PROGRESS')
  assert.equal(getEventLifecycle(event, new Date('2026-09-01T12:00:00')), 'ENDED')
  assert.equal(eventIsCurrent(event, new Date('2026-09-01T11:00:00')), true)
  assert.equal(eventRegistrationLabel({ ...event, registration_status: 'OPEN' }, new Date('2026-09-01T12:00:00')), 'Event ended')
})

test('events without an end time stop being current at their start time', () => {
  const legacyEvent = { event_date: '2026-09-01', start_time: '10:00' }

  assert.equal(eventIsCurrent(legacyEvent, new Date('2026-09-01T10:00:00')), false)
})

test('formatEventTimeRange includes the configured end time', () => {
  assert.match(formatEventTimeRange('10:00', '12:30'), /10:00/)
  assert.match(formatEventTimeRange('10:00', '12:30'), /12:30/)
})
