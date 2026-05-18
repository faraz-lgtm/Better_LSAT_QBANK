import { Link } from "react-router-dom"

import type { PrepCourse, PrepLesson } from "@/lib/api/prep-course"

type PrepCourseLessonListProps = {
  course: PrepCourse
  lessons: PrepLesson[]
  activeLessonSlug?: string
}

function PrepCourseLessonList({ course, lessons, activeLessonSlug }: PrepCourseLessonListProps) {
  return (
    <aside className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
      <h2 className="ds-heading-3 ds-text-heading">Lessons</h2>
      <div className="mt-4 space-y-2">
        {lessons.map((lesson) => {
          const active = lesson.slug === activeLessonSlug
          return (
            <Link
              key={lesson.id}
              to={`/app/prep-course/${course.slug}/${lesson.slug}`}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold tracking-[0.28px] ${
                active
                  ? "border-[#0d47a1] bg-[#0d47a1] text-white"
                  : "border-[#dfe1e7] bg-[#f6f8fa] ds-text-heading"
              }`}
            >
              <span>{lesson.title}</span>
              <span className={active ? "text-white/80" : "ds-text-muted"}>{lesson.duration_minutes ?? 0}m</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}

export { PrepCourseLessonList }
