import assert from 'node:assert/strict'
import test from 'node:test'
import { createActionLock } from '../src/utils/actionLock.js'
import { getPosterDisplayState } from '../src/utils/posterDisplay.js'

test('action lock rejects duplicate RSVP attempts until the request finishes', () => {
  const lock = createActionLock()

  assert.equal(lock.acquire(), true)
  assert.equal(lock.acquire(), false)
  lock.release()
  assert.equal(lock.acquire(), true)
})

test('poster display state covers missing, loading, loaded, and failed images', () => {
  assert.equal(getPosterDisplayState({ src: '', hasError: false, isLoaded: false }), 'unavailable')
  assert.equal(getPosterDisplayState({ src: '/poster.jpg', hasError: false, isLoaded: false }), 'loading')
  assert.equal(getPosterDisplayState({ src: '/poster.jpg', hasError: false, isLoaded: true }), 'ready')
  assert.equal(getPosterDisplayState({ src: '/poster.jpg', hasError: true, isLoaded: true }), 'unavailable')
})
