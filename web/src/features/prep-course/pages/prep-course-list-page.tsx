import { Navigate } from "react-router-dom"

import { PREP_COURSE_ESSENTIALS_SLUG } from "@/features/prep-course/lib/prep-course-nav"

function PrepCourseListPage() {
  return <Navigate to={`/app/prep-course/${PREP_COURSE_ESSENTIALS_SLUG}`} replace />
}

export { PrepCourseListPage }
