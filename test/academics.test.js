import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeCourse } from '../src/constants/academics.js'

test('normalizes legacy course abbreviations to supported program names', () => {
  assert.equal(normalizeCourse('BSCS'), 'BS Computer Science (BS CS)')
  assert.equal(normalizeCourse('BS IT'), 'BS Information Technology (BS IT)')
  assert.equal(normalizeCourse('BS Computer Engineering (BS CPE)'), 'BS Computer Engineering (BS CPE)')
})
