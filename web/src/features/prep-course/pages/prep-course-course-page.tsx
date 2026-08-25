import { useParams } from "react-router-dom"

import { isPrepCourseComingSoonSlug } from "@/features/prep-course/lib/prep-course-nav"
import { PrepCourseComingSoonPage } from "@/features/prep-course/pages/prep-course-coming-soon-page"
import { PrepCourseContentPage } from "@/features/prep-course/pages/prep-course-content-page"

/** Routes available courses to content; mastery placeholders to coming soon. */
function PrepCourseCoursePage() {
  const { courseSlug: courseSlugParam } = useParams<{ courseSlug: string }>()
  const courseSlug = courseSlugParam?.trim() ?? ""

  if (isPrepCourseComingSoonSlug(courseSlug)) {
    return <PrepCourseComingSoonPage />
  }

  return <PrepCourseContentPage />
}

export { PrepCourseCoursePage }
