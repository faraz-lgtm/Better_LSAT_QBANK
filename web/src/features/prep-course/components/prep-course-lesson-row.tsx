import { Link } from "react-router-dom"
import { Bookmark, Check, ChevronRight, Circle, FileText, SquarePlay } from "lucide-react"

import { PrepCourseLessonTypeBadge } from "@/features/prep-course/components/prep-course-lesson-type-badge"
import { formatDurationShort, lessonMetaLine } from "@/features/prep-course/lib/prep-course-format"
import type { PrepCourse, PrepLesson } from "@/lib/api/prep-course"

type PrepCourseLessonRowProps = {
  course: PrepCourse
  lesson: PrepLesson
  active?: boolean
  completed?: boolean
}

function lessonTypeIcon(type: PrepLesson["lesson_type"]) {
  if (type === "video" || type === "video_text") {
    return <SquarePlay className="size-4 text-[#666d80]" aria-hidden />
  }
  return <FileText className="size-4 text-[#666d80]" aria-hidden />
}

function PrepCourseLessonRow({ course, lesson, active = false, completed = false }: PrepCourseLessonRowProps) {
  const href = `/app/prep-course/${course.slug}/${lesson.slug}`
  const showComplete = completed && !active
  const meta = lessonMetaLine(lesson) ?? formatDurationShort(lesson.duration_minutes)

  return (
    <Link
      to={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
        active ? "bg-[#F3F7FF]" : "hover:bg-[#f6f8fa]"
      }`}
    >
      <span
        className="flex size-5 shrink-0 items-center justify-center"
        aria-label={showComplete ? "Completed" : undefined}
        aria-hidden={showComplete ? undefined : true}
      >
        {showComplete ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-[#0d47a1]">
            <Check className="size-3 text-white" strokeWidth={2.5} aria-hidden />
          </span>
        ) : (
          <Circle
            className={`size-2.5 fill-current ${active ? "text-[#0d47a1]" : "text-[#c5cee0]"}`}
            strokeWidth={0}
          />
        )}
      </span>
      {lessonTypeIcon(lesson.lesson_type)}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold tracking-[0.02em] text-[#062357]" title={lesson.title}>
          {lesson.title}
        </span>
        <span className="mt-0.5 block text-xs font-medium tracking-[0.02em] text-[#666d80]">{meta}</span>
      </span>
      <PrepCourseLessonTypeBadge lessonType={lesson.lesson_type} />
      {active ? (
        <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#0d47a1]">
          Continue
          <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
        </span>
      ) : (
        <Bookmark className="size-4 shrink-0 text-[#c5cee0]" strokeWidth={2} aria-hidden />
      )}
    </Link>
  )
}

export { PrepCourseLessonRow }
