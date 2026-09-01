import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeMemberImportHeader,
  normalizeMemberImportRow,
  validateMemberImportRows,
} from '../src/utils/memberImport.js'

const validRow = {
  row: 2,
  student_number: 'SBG-001',
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'Ada@Example.com',
  course: 'BSCS',
  year_level: '2',
  section: 'CS-21',
}

test('normalizes supported member ID header aliases', () => {
  assert.equal(normalizeMemberImportHeader(' AWS SBG Member ID '), 'student_number')
  assert.equal(normalizeMemberImportHeader('member-id'), 'student_number')
  assert.equal(normalizeMemberImportHeader('First Name'), 'first_name')
})

test('normalizes row values and preserves the spreadsheet row number', () => {
  assert.deepEqual(
    normalizeMemberImportRow({ 'First Name': ' Ada ', 'Year Level': 2 }, 7),
    { row: 7, first_name: 'Ada', year_level: '2' },
  )
})

test('returns a normalized valid member ready for insertion', () => {
  const result = validateMemberImportRows([validRow])

  assert.equal(result.invalidRows.length, 0)
  assert.deepEqual(result.validRows[0], {
    ...validRow,
    email: 'ada@example.com',
    year_level: 2,
  })
})

test('marks every occurrence of an in-file duplicate as invalid', () => {
  const duplicate = { ...validRow, row: 3, email: 'other@example.com' }
  const result = validateMemberImportRows([validRow, duplicate])

  assert.equal(result.validRows.length, 0)
  assert.equal(result.invalidRows.length, 2)
  assert.match(result.invalidRows[0].reason, /Duplicate AWS SBG Member ID in this file/)
  assert.match(result.invalidRows[1].reason, /Duplicate AWS SBG Member ID in this file/)
})

test('rejects records that conflict with existing profiles case-insensitively', () => {
  const result = validateMemberImportRows(
    [validRow],
    [{ student_number: 'other-id', email: 'ADA@example.com' }],
  )

  assert.equal(result.validRows.length, 0)
  assert.match(result.invalidRows[0].reason, /Email address already exists/)
})

test('reports missing fields, invalid email, and invalid year together', () => {
  const result = validateMemberImportRows([
    { ...validRow, first_name: '', email: 'invalid', year_level: '2.5' },
  ])

  assert.equal(result.validRows.length, 0)
  assert.match(result.invalidRows[0].reason, /Missing: first_name/)
  assert.match(result.invalidRows[0].reason, /Email address is invalid/)
  assert.match(result.invalidRows[0].reason, /Year level must be a whole number/)
})
