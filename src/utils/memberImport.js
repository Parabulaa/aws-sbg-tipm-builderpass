export const REQUIRED_MEMBER_IMPORT_FIELDS = [
  'student_number',
  'first_name',
  'last_name',
  'email',
  'course',
  'year_level',
]

const headerAliases = {
  member_id: 'student_number',
  student_number: 'student_number',
  aws_sbg_member_id: 'student_number',
  aws_sbg_memberid: 'student_number',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function readMemberImportFile(file) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]

  if (!worksheet) throw new Error('This workbook does not contain a readable worksheet.')

  const headerRow = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })[0]

  if (!Array.isArray(headerRow) || headerRow.length === 0) {
    throw new Error('This file needs a header row before member records.')
  }

  const normalizedHeaders = headerRow.map(normalizeMemberImportHeader).filter(Boolean)
  const duplicateHeaders = findDuplicates(normalizedHeaders)

  if (duplicateHeaders.length > 0) {
    throw new Error(`Duplicate columns after normalization: ${formatMemberImportColumnNames(duplicateHeaders)}.`)
  }

  const rows = XLSX.utils
    .sheet_to_json(worksheet, { defval: '', blankrows: false })
    .map((row, index) => normalizeMemberImportRow(row, index + 2))

  return { headers: normalizedHeaders, rows }
}

export function validateMemberImportRows(rows, existingProfiles = []) {
  const existingStudentNumbers = new Set(
    existingProfiles.map((profile) => normalizeComparisonValue(profile.student_number)),
  )
  const existingEmails = new Set(
    existingProfiles.map((profile) => normalizeComparisonValue(profile.email)),
  )
  const studentNumberCounts = countValues(rows.map((row) => row.student_number))
  const emailCounts = countValues(rows.map((row) => row.email))
  const validRows = []
  const invalidRows = []

  rows.forEach((row) => {
    const errors = []
    const studentNumber = row.student_number
    const email = normalizeComparisonValue(row.email)
    const yearLevel = Number(row.year_level)
    const studentNumberKey = normalizeComparisonValue(studentNumber)
    const missingFields = REQUIRED_MEMBER_IMPORT_FIELDS.filter((field) => !row[field])

    if (missingFields.length > 0) {
      errors.push(`Missing: ${formatMemberImportColumnNames(missingFields)}`)
    }
    if (email && !emailPattern.test(email)) errors.push('Email address is invalid')
    if (row.year_level && (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 10)) {
      errors.push('Year level must be a whole number from 1 to 10')
    }

    if (studentNumberKey && existingStudentNumbers.has(studentNumberKey)) {
      errors.push('AWS SBG Member ID already exists')
    } else if (studentNumberKey && studentNumberCounts.get(studentNumberKey) > 1) {
      errors.push('Duplicate AWS SBG Member ID in this file')
    }

    if (email && existingEmails.has(email)) {
      errors.push('Email address already exists')
    } else if (email && emailCounts.get(email) > 1) {
      errors.push('Duplicate email address in this file')
    }

    if (errors.length > 0) {
      invalidRows.push({ ...row, reason: errors.join('; ') })
      return
    }

    validRows.push({
      row: row.row,
      student_number: studentNumber,
      first_name: row.first_name,
      last_name: row.last_name,
      email,
      course: row.course,
      year_level: yearLevel,
      section: row.section || null,
    })
  })

  return { validRows, invalidRows }
}

export function normalizeMemberImportRow(row, rowNumber) {
  return Object.entries(row).reduce(
    (normalizedRow, [header, value]) => ({
      ...normalizedRow,
      [normalizeMemberImportHeader(header)]: String(value).trim(),
    }),
    { row: rowNumber },
  )
}

export function normalizeMemberImportHeader(header) {
  const normalizedHeader = String(header).trim().toLowerCase().replace(/[\s-]+/g, '_')
  return headerAliases[normalizedHeader] || normalizedHeader
}

export function formatMemberImportColumnNames(columns) {
  return columns
    .map((column) => (column === 'student_number' ? 'member_id or student_number' : column))
    .join(', ')
}

function countValues(values) {
  return values.reduce((counts, value) => {
    const key = normalizeComparisonValue(value)
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
    return counts
  }, new Map())
}

function findDuplicates(values) {
  return [...countValues(values).entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
}

function normalizeComparisonValue(value) {
  return String(value ?? '').trim().toLowerCase()
}
