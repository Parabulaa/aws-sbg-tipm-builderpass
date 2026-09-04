import assert from 'node:assert/strict'
import test from 'node:test'
import { getNextOptionIndex } from '../src/utils/selectNavigation.js'

test('moves through options and wraps at either end', () => {
  assert.equal(getNextOptionIndex(2, 'ArrowDown', 3), 0)
  assert.equal(getNextOptionIndex(0, 'ArrowUp', 3), 2)
})

test('supports Home and End listbox navigation', () => {
  assert.equal(getNextOptionIndex(2, 'Home', 5), 0)
  assert.equal(getNextOptionIndex(2, 'End', 5), 4)
})

test('handles an empty option list safely', () => {
  assert.equal(getNextOptionIndex(0, 'ArrowDown', 0), -1)
})
