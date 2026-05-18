import { Link } from "react-router-dom"
import { Bookmark } from "lucide-react"

import { LessonContentRenderer } from "@/features/prep-course/components/lesson-content-renderer"
import { lessonMetaLine } from "@/features/prep-course/lib/prep-course-format"
import type { PrepCourse, PrepLesson, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type PrepCourseLessonPanelProps = {
  course: PrepCourse
  lesson: PrepLesson | null
  linkedQuestionRefs?: PrepLessonLinkedQuestionRef[]
  loading?: boolean
  courseContentHref: string
}

function PrepCourseLessonPanel({
  course,
  lesson,
  linkedQuestionRefs = [],
  loading = false,
  courseContentHref,
}: PrepCourseLessonPanelProps) {
  const breadcrumbTopic = lesson?.summary?.trim() || lesson?.title || "Lesson"

  return (
    <div className="min-w-0 space-y-6">
      <nav
        className="flex flex-wrap items-center justify-end gap-1 text-xs font-medium tracking-[0.02em] text-[#666d80]"
        aria-label="Breadcrumb"
      >
        <span>Learn</span>
        <span className="text-[#dfe1e7]">/</span>
        <Link to="/app/prep-course" className="hover:text-[#0d47a1]">
          Prep Course
        </Link>
        <span className="text-[#dfe1e7]">/</span>
        <Link to={courseContentHref} className="hover:text-[#0d47a1]">
          Course Content
        </Link>
        <span className="text-[#dfe1e7]">/</span>
        <span className="font-semibold text-[#0d47a1]">{breadcrumbTopic}</span>
      </nav>

      {loading && !lesson ? (
        <p className="ds-body-sm ds-text-muted">Loading lesson...</p>
      ) : lesson ? (
        <>
          <header className="flex items-start justify-between gap-4 border-b border-[#dfe1e7] pb-6">
            <div className="min-w-0">
              <h1 className="font-serif text-[32px] font-bold leading-[1.25] text-[#062357] md:text-[40px]">
                {lesson.title}
              </h1>
              <p className="mt-2 text-sm tracking-[0.02em] text-[#666d80]">{lessonMetaLine(lesson, course.title)}</p>
            </div>
            <button
              type="button"
              aria-label="Bookmark lesson"
              className="shrink-0 rounded-lg border border-[#dfe1e7] bg-white p-2 text-[#666d80] transition-colors hover:border-[#0d47a1] hover:text-[#0d47a1]"
            >
              <Bookmark className="size-5" />
            </button>
          </header>

          <LessonContentRenderer
            lesson={lesson}
            linkedQuestionRefs={linkedQuestionRefs}
            hideTitle
          />
        </>
      ) : (
        <p className="ds-body-sm ds-text-muted">Select a lesson to view its content.</p>
      )}
    </div>
  )
}

export { PrepCourseLessonPanel }
