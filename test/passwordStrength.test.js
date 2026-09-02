import assert from 'node:assert/strict'
import test from 'node:test'
import { getPasswordStrength } from '../src/utils/passwordStrength.js'

test('reports a clear starting suggestion before a password is entered', () => {
  const strength = getPasswordStrength('')

  assert.equal(strength.label, 'Not entered')
  assert.equal(strength.score, 0)
  assert.match(strength.suggestion, /12 characters/)
})

test('scores weak and improving passwords with targeted suggestions', () => {
  const weak = getPasswordStrength('builder')
  const good = getPasswordStrength('BuilderPass9')

  assert.equal(weak.label, 'Weak')
  assert.match(weak.suggestion, /uppercase/)
  assert.equal(good.label, 'Good')
  assert.match(good.suggestion, /symbol/)
})

test('recognizes a strong password and recommends avoiding reuse', () => {
  const strength = getPasswordStrength('BuilderPass9!Secure')

  assert.equal(strength.label, 'Strong')
  assert.equal(strength.score, 4)
  assert.match(strength.suggestion, /Avoid reusing/)
})
