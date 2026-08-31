import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BackLink from '../../components/BackLink.jsx'
import { supabase } from '../../services/supabase/client.js'

const blankMember = {
  student_number: '',
  first_name: '',
  last_name: '',
  email: '',
  course: '',
  year_level: '',
}

const initialFilters = {
  search: '',
  course: 'ALL',
  yearLevel: 'ALL',
  section: 'ALL',
  role: 'ALL',
}

const memberFields = [
  { key: 'student_number', label: 'AWS SBG Member ID', type: 'text' },
  { key: 'first_name', label: 'First name', type: 'text' },
  { key: 'last_name', label: 'Last name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'course', label: 'Course', type: 'text' },
  { key: 'year_level', label: 'Year level', type: 'number' },
]

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(blankMember)
  const [filters, setFilters] = useState(initialFilters)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, student_number, first_name, last_name, email, course, year_level, section, role, auth_user_id')
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMessage(error.message || 'We could not load members.')
    } else {
      setMembers(data)
    }

    setIsLoading(false)
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  async function addMember(event) {
    event.preventDefault()
    setErrorMessage('')

    if (Object.values(form).some((value) => !String(value).trim())) {
      setErrorMessage('All member fields are required.')
      return
    }

    const yearLevel = Number(form.year_level)
    if (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 10) {
      setErrorMessage('Year level must be a whole number from 1 to 10.')
      return
    }

    setIsSaving(true)

    const { error } = await supabase
      .from('profiles')
      .insert({
        ...form,
        student_number: form.student_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        course: form.course.trim(),
        year_level: yearLevel,
        role: 'MEMBER',
      })

    setIsSaving(false)

    if (error) {
      setErrorMessage(error.message || 'We could not add the member.')
    } else {
      setForm(blankMember)
      loadMembers()
    }
  }

  const filteredMembers = members.filter((member) => {
    const searchText = `${member.student_number} ${member.first_name} ${member.last_name} ${member.email} ${member.course}`.toLowerCase()

    return (
      searchText.includes(filters.search.trim().toLowerCase())
      && (filters.course === 'ALL' || member.course === filters.course)
      && (filters.yearLevel === 'ALL' || String(member.year_level) === filters.yearLevel)
      && (filters.section === 'ALL' || (member.section || '') === filters.section)
      && (filters.role === 'ALL' || member.role === filters.role)
    )
  })

  const courses = getFilterOptions(members.map((member) => member.course))
  const yearLevels = [...new Set(members.map((member) => member.year_level).filter(Boolean))].sort((left, right) => left - right)
  const sections = getFilterOptions(members.map((member) => member.section))
  const roles = getFilterOptions(members.map((member) => member.role))
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => value !== initialFilters[key])

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
      <BackLink to="/admin">Back to dashboard</BackLink>

      <div className="mt-6 grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={addMember}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Member management</p>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">Add member</h1>
          </div>

          {errorMessage && <p className="text-sm text-red-700" role="alert">{errorMessage}</p>}

          {memberFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor={`member-${field.key}`}>
                {field.label}
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                id={`member-${field.key}`}
                min={field.key === 'year_level' ? '1' : undefined}
                name={field.key}
                onChange={handleFormChange}
                step={field.key === 'year_level' ? '1' : undefined}
                type={field.type}
                value={form[field.key]}
              />
            </div>
          ))}

          <button
            className="w-full rounded-md bg-indigo-700 py-2.5 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-indigo-400"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Adding...' : 'Add member'}
          </button>
          <Link className="block text-center text-sm font-medium text-indigo-700 hover:text-indigo-900" to="/admin/members/import">
            Import CSV/XLSX
          </Link>
        </form>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Directory</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Members</h2>
            </div>
            <p className="text-sm text-slate-600" role="status">
              {isLoading ? 'Loading members...' : `Showing ${filteredMembers.length} of ${members.length} members`}
            </p>
          </div>

          <fieldset className="mt-6 border border-slate-200 bg-white p-5" disabled={isLoading}>
            <legend className="px-1 text-sm font-semibold text-slate-900">Filter members</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <FilterField label="Search" htmlFor="member-search">
                <input
                  className={filterClassName}
                  id="member-search"
                  name="search"
                  onChange={handleFilterChange}
                  placeholder="Name, email, or ID"
                  type="search"
                  value={filters.search}
                />
              </FilterField>
              <FilterField label="Course" htmlFor="member-course-filter">
                <select className={filterClassName} id="member-course-filter" name="course" onChange={handleFilterChange} value={filters.course}>
                  <option value="ALL">All courses</option>
                  {courses.map((course) => <option key={course} value={course}>{course}</option>)}
                </select>
              </FilterField>
              <FilterField label="Year level" htmlFor="member-year-filter">
                <select className={filterClassName} id="member-year-filter" name="yearLevel" onChange={handleFilterChange} value={filters.yearLevel}>
                  <option value="ALL">All years</option>
                  {yearLevels.map((yearLevel) => <option key={yearLevel} value={yearLevel}>Year {yearLevel}</option>)}
                </select>
              </FilterField>
              <FilterField label="Section" htmlFor="member-section-filter">
                <select className={filterClassName} id="member-section-filter" name="section" onChange={handleFilterChange} value={filters.section}>
                  <option value="ALL">All sections</option>
                  {sections.map((section) => <option key={section} value={section}>{section}</option>)}
                </select>
              </FilterField>
              <FilterField label="Role" htmlFor="member-role-filter">
                <select className={filterClassName} id="member-role-filter" name="role" onChange={handleFilterChange} value={filters.role}>
                  <option value="ALL">All roles</option>
                  {roles.map((role) => <option key={role} value={role}>{formatRole(role)}</option>)}
                </select>
              </FilterField>
            </div>
            {hasActiveFilters && (
              <button className="mt-4 text-sm font-medium text-indigo-700 hover:text-indigo-900" onClick={() => setFilters(initialFilters)} type="button">
                Reset filters
              </button>
            )}
          </fieldset>

          {!isLoading && filteredMembers.length === 0 && (
            <p className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-600">No members match the current filters.</p>
          )}

          {!isLoading && filteredMembers.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-[900px] text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="p-3 text-left font-medium">AWS SBG Member ID</th>
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-left font-medium">Email</th>
                    <th className="p-3 text-left font-medium">Course</th>
                    <th className="p-3 text-left font-medium">Year</th>
                    <th className="p-3 text-left font-medium">Section</th>
                    <th className="p-3 text-left font-medium">Role</th>
                    <th className="p-3 text-left font-medium">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr className="border-t border-slate-200" key={member.id}>
                      <td className="p-3">{member.student_number}</td>
                      <td className="p-3">{member.first_name} {member.last_name}</td>
                      <td className="p-3">{member.email}</td>
                      <td className="p-3">{member.course}</td>
                      <td className="p-3">Year {member.year_level}</td>
                      <td className="p-3">{member.section || 'Not set'}</td>
                      <td className="p-3">{formatRole(member.role)}</td>
                      <td className="p-3">{member.auth_user_id ? 'Linked' : 'Not registered'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function FilterField({ children, htmlFor, label }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}

function getFilterOptions(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function formatRole(role) {
  return `${role.slice(0, 1)}${role.slice(1).toLowerCase()}`
}

const filterClassName = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-indigo-500'
