import { Link, useParams } from "react-router-dom"

import {
  findPrepCourseNavItem,
  PREP_COURSE_ESSENTIALS_SLUG,
} from "@/features/prep-course/lib/prep-course-nav"
import { StudentMain } from "@/features/student/components/student-main"

function PrepCourseComingSoonPage() {
  const { courseSlug: courseSlugParam } = useParams<{ courseSlug: string }>()
  const courseSlug = courseSlugParam?.trim() ?? ""
  const navItem = findPrepCourseNavItem(courseSlug)
  const title = navItem?.title ?? "Prep Course"

  return (
    <StudentMain contentClassName="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0d47a1]">Prep Course</p>
      <h1 className="student-page-heading mt-2">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#666d80]">
        This course is coming soon. Check back later, or continue with LSAT Essential Course.
      </p>
      <Link
        to={`/app/prep-course/${PREP_COURSE_ESSENTIALS_SLUG}`}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-[#0d47a1] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0a3a82]"
      >
        Open LSAT Essential Course
      </Link>
    </StudentMain>
  )
}

export { PrepCourseComingSoonPage }
