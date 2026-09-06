import assert from 'node:assert/strict'
import test from 'node:test'
import { publicEventLifecycle, selectPublicEvents } from '../src/utils/publicEvents.js'
import { authLink, getAuthDestination } from '../src/utils/authDestination.js'
import { approvedTestimonials } from '../src/content/testimonials.js'

const makeEvent = (id, overrides = {}) => ({ id, title: 'Cloud workshop', event_date: '2026-09-06', start_time: '09:00:00', end_time: '11:00:00', publication_status: 'PUBLISHED', visibility: 'PUBLIC', ...overrides })

test('public lifecycle uses Manila time regardless of the visitor timezone', () => {
  const event = makeEvent('1')
  assert.equal(publicEventLifecycle(event, new Date('2026-09-06T00:59:00Z')), 'UPCOMING')
  assert.equal(publicEventLifecycle(event, new Date('2026-09-06T01:00:00Z')), 'IN_PROGRESS')
  assert.equal(publicEventLifecycle(event, new Date('2026-09-06T03:00:00Z')), 'ENDED')
})

test('public previews filter private/draft events, sort correctly, and cap cards', () => {
  const events = [makeEvent('1'), makeEvent('2', { visibility: 'MEMBERS' }), makeEvent('3', { publication_status: 'DRAFT' }), makeEvent('4', { event_date: '2026-09-05' }), makeEvent('5', { event_date: '2026-09-04' }), makeEvent('6', { event_date: '2026-09-07' })]
  const now = new Date('2026-09-06T02:00:00Z')
  assert.deepEqual(selectPublicEvents(events, { period: 'UPCOMING', now }).map(e => e.id), ['1', '6'])
  assert.deepEqual(selectPublicEvents(events, { period: 'PAST', now }).map(e => e.id), ['4', '5'])
  assert.equal(selectPublicEvents(events, { period: 'PAST', now, limit: 1 }).length, 1)
  assert.equal(selectPublicEvents(events, { search: '  CLOUD ', now }).length, 4)
  assert.deepEqual(selectPublicEvents(events, { search: 'missing', now }), [])
})

test('signup preserves only permitted local destinations, including event filters', () => {
  const eventPath = '/events/11111111-1111-4111-8111-111111111111'
  assert.equal(getAuthDestination({ search: authLink('/register', eventPath).split('/register')[1] }), eventPath)
  assert.equal(getAuthDestination({ state: { from: { pathname: '/events', search: '?q=Cloud' } } }), '/events?q=Cloud')
  for (const next of ['https://evil.example', '//evil.example', '/\\evil.example', '/admin', '/events/../admin', '/events\n']) {
    assert.equal(getAuthDestination({ search: `?next=${encodeURIComponent(next)}` }), '')
  }
})

test('testimonials stay hidden without both editorial approval and member consent', () => {
  const entry = { id: '1', quote: 'A real approved quote', name: 'Approved name' }
  assert.deepEqual(approvedTestimonials([entry, { ...entry, approved: true }, { ...entry, consentToPublish: true }]), [])
  assert.equal(approvedTestimonials([{ ...entry, approved: true, consentToPublish: true }]).length, 1)
})
