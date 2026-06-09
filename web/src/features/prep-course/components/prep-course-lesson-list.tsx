import { Link } from "react-router-dom"

import type { PrepCourse, PrepCourseCurriculum, PrepLesson } from "@/lib/api/prep-course"

type PrepCourseLessonListProps = {
  course: PrepCourse
  lessons: PrepLesson[]
  curriculum?: PrepCourseCurriculum
  activeLessonSlug?: string
}

function LessonLink({
  course,
  lesson,
  active,
}: {
  course: PrepCourse
  lesson: PrepLesson
  active: boolean
}) {
  return (
    <Link
      to={`/app/prep-course/${course.slug}/${lesson.slug}`}
      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold tracking-[0.28px] ${
        active ? "ds-btn-sm border-[var(--primary-border)] text-white" : "border-[#dfe1e7] bg-[#f6f8fa] ds-text-heading"
      }`}
    >
      <span>{lesson.title}</span>
      <span className={active ? "text-white/80" : "ds-text-muted"}>{lesson.duration_minutes ?? 0}m</span>
    </Link>
  )
}

function PrepCourseLessonList({ course, lessons, curriculum, activeLessonSlug }: PrepCourseLessonListProps) {
  const hasCurriculum = curriculum && curriculum.modules.length > 0

  return (
    <aside className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
      <h2 className="ds-heading-3 ds-text-heading">Lessons</h2>
      <div className="mt-4 space-y-4">
        {hasCurriculum
          ? curriculum.modules.map((mod) => (
              <div key={mod.id}>
                <p className="text-xs font-bold uppercase tracking-wide text-[#666d80]">
                  Module {mod.sort_order}: {mod.title}
                </p>
                <div className="mt-2 space-y-3">
                  {mod.sections.map((section) => (
                    <div key={section.id}>
                      <p className="text-sm font-semibold text-[#1a1b25]">{section.title}</p>
                      <div className="mt-2 space-y-2">
                        {section.lessons.map((lesson) => (
                          <LessonLink
                            key={lesson.id}
                            course={course}
                            lesson={lesson}
                            active={lesson.slug === activeLessonSlug}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          : lessons.map((lesson) => (
              <LessonLink key={lesson.id} course={course} lesson={lesson} active={lesson.slug === activeLessonSlug} />
            ))}
      </div>
    </aside>
  )
}

export { PrepCourseLessonList }
