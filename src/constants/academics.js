export const TIP_MANILA_COURSES = [
  'BS Electrical Engineering (BS EE)',
  'BS Computer Science (BS CS)',
  'BS Information Technology (BS IT)',
  'BS Information Systems (BS IS)',
  'BS Computer Engineering (BS CPE)',
  'BS Data Science and Analytics (BS DSA)',
  'BS Entertainment and Multimedia Computing (BS EMC)',
]

export const YEAR_LEVELS = [1, 2, 3, 4]

const courseByKey = new Map(TIP_MANILA_COURSES.map((course) => [courseKey(course), course]))

export function normalizeCourse(course) {
  if (!course) return ''
  return courseByKey.get(courseKey(course)) || course
}

function courseKey(course) {
  const compactCourse = course.toUpperCase().replace(/[^A-Z0-9]/g, '')

  const abbreviationMatch = compactCourse.match(/\(?(BSEE|BSCS|BSIT|BSIS|BSCPE|BSDSA|BSEMC)\)?$/)
  return abbreviationMatch?.[1] || compactCourse
}
