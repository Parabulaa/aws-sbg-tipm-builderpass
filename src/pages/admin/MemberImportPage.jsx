import { CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import BackLink from '../../components/BackLink.jsx'
import { supabase } from '../../services/supabase/client.js'

const requiredFields = ['student_number', 'first_name', 'last_name', 'email', 'course', 'year_level']
const headerAliases = {
  member_id: 'student_number',
  student_number: 'student_number',
  aws_sbg_member_id: 'student_number',
  aws_sbg_memberid: 'student_number',
}
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function MemberImportPage() {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [validRows, setValidRows] = useState([])
  const [invalidRows, setInvalidRows] = useState([])
  const [message, setMessage] = useState('')
  const [isReading, setIsReading] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) await loadFile(file)
  }

  async function handleFileDrop(event) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) await loadFile(file)
  }

  async function loadFile(file) {
    setMessage('')
    setSelectedFile(null)
    setHeaders([])
    setRows([])
    setValidRows([])
    setInvalidRows([])
    setIsReading(true)

    try {
      const parsedFile = await readImportFile(file)
      setSelectedFile(file)
      setHeaders(parsedFile.headers)
      setRows(parsedFile.rows)
    } catch (error) {
      setMessage(error.message || 'We could not read this file. Please choose a CSV or XLSX workbook with a header row.')
    } finally {
      setIsReading(false)
    }
  }

  function clearFile() {
    setSelectedFile(null)
    setHeaders([])
    setRows([])
    setValidRows([])
    setInvalidRows([])
    setMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function previewImport() {
    if (!selectedFile) return

    setMessage('')
    setValidRows([])
    setInvalidRows([])

    const missingHeaders = requiredFields.filter((field) => !headers.includes(field))
    if (missingHeaders.length > 0) {
      setMessage(`Missing required columns: ${formatColumnNames(missingHeaders)}.`)
      return
    }

    if (rows.length === 0) {
      setMessage('This file has a header row but no member records to preview.')
      return
    }

    setIsPreviewing(true)

    try {
      const { data: existingProfiles, error } = await supabase
        .from('profiles')
        .select('student_number, email')

      if (error) throw error

      const preview = validateRows(rows, existingProfiles)
      setValidRows(preview.validRows)
      setInvalidRows(preview.invalidRows)
    } catch (error) {
      setMessage(error.message || 'We could not validate this import. Please try again.')
    } finally {
      setIsPreviewing(false)
    }
  }

  async function confirmImport() {
    if (validRows.length === 0) return

    setMessage('')
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .insert(validRows.map(({ row, ...member }) => ({ ...member, role: 'MEMBER' })))

      if (error) throw error

      setMessage(`${validRows.length} member${validRows.length === 1 ? '' : 's'} imported successfully.`)
      setSelectedFile(null)
      setHeaders([])
      setRows([])
      setValidRows([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setMessage(error.message || 'The import could not be completed. No members were added.')
    } finally {
      setIsSaving(false)
    }
  }

  const hasPreview = validRows.length > 0 || invalidRows.length > 0

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <BackLink to="/admin/members">Back to members</BackLink>
      <div className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Member management</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Import members</h1>
        <p className="mt-3 text-slate-600">
          Upload a CSV or XLSX file, review the results, then confirm the valid records. Importing creates membership records only; members can link an account later when they register.
        </p>
      </div>

      {message && (
        <p className="mt-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" role="status">
          {message}
        </p>
      )}

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-slate-950">Choose import file</h2>
        <p className="mt-2 text-sm text-slate-600">
          Required columns: member_id or student_number, first_name, last_name, email, course, year_level. Section is optional.
        </p>

        <input
          accept=".csv,.xlsx"
          className="sr-only"
          id="member-import-file"
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
        <label
          className="mt-6 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 px-6 py-12 text-center transition-colors hover:border-indigo-500 hover:bg-indigo-50"
          htmlFor="member-import-file"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleFileDrop}
        >
          <FileSpreadsheet className="h-9 w-9 text-indigo-700" />
          <span className="mt-4 font-semibold text-slate-950">Drop a CSV or XLSX file here, or choose one</span>
          <span className="mt-2 inline-flex items-center gap-2 rounded-md bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white">
            <Upload size={16} /> Choose file
          </span>
        </label>

        {isReading && <p className="mt-4 text-sm text-slate-600">Reading file...</p>}

        {selectedFile && !isReading && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-950">{selectedFile.name}</p>
              <p className="mt-1 text-sm text-slate-600">{rows.length} row{rows.length === 1 ? '' : 's'} detected</p>
            </div>
            <button
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950"
              onClick={clearFile}
              type="button"
            >
              <X size={16} /> Remove file
            </button>
          </div>
        )}

        {selectedFile && (
          <button
            className="mt-5 rounded-md bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-indigo-400"
            disabled={isPreviewing || isReading}
            onClick={previewImport}
            type="button"
          >
            {isPreviewing ? 'Validating file...' : 'Preview import'}
          </button>
        )}
      </div>

      {hasPreview && (
        <section className="mt-8" aria-labelledby="import-preview-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Import preview</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950" id="import-preview-heading">Review before importing</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <span className="rounded-full bg-green-100 px-3 py-1.5 text-green-800">Valid: {validRows.length}</span>
              <span className="rounded-full bg-red-100 px-3 py-1.5 text-red-800">Invalid: {invalidRows.length}</span>
            </div>
          </div>

          {validRows.length > 0 && (
            <div className="mt-6 rounded-xl border border-green-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-green-200 bg-green-50 px-5 py-4">
                <div>
                  <h3 className="font-bold text-green-900">Valid member records ({validRows.length})</h3>
                  <p className="mt-1 text-sm text-green-800">Only these records will be created when you confirm.</p>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-indigo-400"
                  disabled={isSaving}
                  onClick={confirmImport}
                  type="button"
                >
                  <CheckCircle2 size={18} />
                  {isSaving ? 'Importing...' : `Confirm import (${validRows.length})`}
                </button>
              </div>
              <ImportTable rows={validRows} />
            </div>
          )}

          {invalidRows.length > 0 && (
            <div className="mt-6 rounded-xl border border-red-200 bg-white">
              <div className="border-b border-red-200 bg-red-50 px-5 py-4">
                <h3 className="font-bold text-red-900">Invalid records ({invalidRows.length})</h3>
                <p className="mt-1 text-sm text-red-800">Correct these entries in the source file and upload it again. Invalid rows are never imported.</p>
              </div>
              <ImportTable rows={invalidRows} showReason />
            </div>
          )}
        </section>
      )}
    </section>
  )
}

async function readImportFile(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!worksheet) throw new Error('This workbook does not contain a readable worksheet.')

  const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false })[0]
  if (!Array.isArray(headerRow) || headerRow.length === 0) throw new Error('This file needs a header row before member records.')

  const headers = [...new Set(headerRow.map((header) => normalizeHeader(header)).filter(Boolean))]
  const rows = XLSX.utils
    .sheet_to_json(worksheet, { defval: '', blankrows: false })
    .map((row, index) => normalizeRow(row, index + 2))

  return { headers, rows }
}

function validateRows(rows, existingProfiles) {
  const existingStudentNumbers = new Set(existingProfiles.map((profile) => profile.student_number.trim().toLowerCase()))
  const existingEmails = new Set(existingProfiles.map((profile) => profile.email.trim().toLowerCase()))
  const seenStudentNumbers = new Set()
  const seenEmails = new Set()
  const validRows = []
  const invalidRows = []

  rows.forEach((row) => {
    const errors = []
    const studentNumber = row.student_number
    const email = row.email.toLowerCase()
    const yearLevel = Number(row.year_level)
    const studentNumberKey = studentNumber.toLowerCase()

    const missingFields = requiredFields.filter((field) => !row[field])
    if (missingFields.length > 0) errors.push(`Missing: ${formatColumnNames(missingFields)}`)
    if (email && !emailPattern.test(email)) errors.push('Email address is invalid')
    if (row.year_level && (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 10)) {
      errors.push('Year level must be a whole number from 1 to 10')
    }

    if (studentNumber && (seenStudentNumbers.has(studentNumberKey) || existingStudentNumbers.has(studentNumberKey))) {
      errors.push('Duplicate AWS SBG Member ID')
    }
    if (email && (seenEmails.has(email) || existingEmails.has(email))) errors.push('Duplicate email address')

    if (studentNumber) seenStudentNumbers.add(studentNumberKey)
    if (email) seenEmails.add(email)

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

function normalizeRow(row, rowNumber) {
  return Object.entries(row).reduce(
    (normalizedRow, [header, value]) => ({
      ...normalizedRow,
      [normalizeHeader(header)]: String(value).trim(),
    }),
    { row: rowNumber },
  )
}

function normalizeHeader(header) {
  const normalizedHeader = String(header).trim().toLowerCase().replace(/[\s-]+/g, '_')
  return headerAliases[normalizedHeader] || normalizedHeader
}

function formatColumnNames(columns) {
  return columns
    .map((column) => (column === 'student_number' ? 'member_id or student_number' : column))
    .join(', ')
}

function ImportTable({ rows, showReason = false }) {
  return (
    <div className="max-h-96 overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-50 text-slate-600">
          <tr>
            <th className="px-5 py-3 font-medium">Row</th>
            <th className="px-5 py-3 font-medium">AWS SBG Member ID</th>
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Course</th>
            <th className="px-5 py-3 font-medium">Year</th>
            <th className="px-5 py-3 font-medium">Section</th>
            {showReason && <th className="px-5 py-3 font-medium">Reason</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-700">
          {rows.map((row) => (
            <tr key={row.row}>
              <td className="px-5 py-3">{row.row}</td>
              <td className="px-5 py-3">{row.student_number || '—'}</td>
              <td className="px-5 py-3">{[row.first_name, row.last_name].filter(Boolean).join(' ') || '—'}</td>
              <td className="px-5 py-3">{row.email || '—'}</td>
              <td className="px-5 py-3">{row.course || '—'}</td>
              <td className="px-5 py-3">{row.year_level || '—'}</td>
              <td className="px-5 py-3">{row.section || 'Not set'}</td>
              {showReason && <td className="px-5 py-3 text-red-700">{row.reason}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
