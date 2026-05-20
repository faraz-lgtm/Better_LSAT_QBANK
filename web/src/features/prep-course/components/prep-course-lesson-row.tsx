import { Link } from "react-router-dom"
import { Check, Circle, FileText, SquarePlay } from "lucide-react"

import { PrepCourseLessonTypeBadge } from "@/features/prep-course/components/prep-course-lesson-type-badge"
import { formatDurationShort } from "@/features/prep-course/lib/prep-course-format"
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

  return (
    <Link
      to={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        active ? "bg-[#edf3ff] ring-1 ring-[#0d47a1]/20" : "hover:bg-[#f6f8fa]"
      }`}
    >
      <span
        className="flex size-5 shrink-0 items-center justify-center"
        aria-label={showComplete ? "Completed" : undefined}
        aria-hidden={showComplete ? undefined : true}
      >
        {showComplete ? (
          <Check className="size-4 text-[#0d47a1]" strokeWidth={2.5} aria-hidden />
        ) : (
          <Circle
            className={`size-2.5 fill-current ${active ? "text-[#0d47a1]" : "text-[#c5cee0]"}`}
            strokeWidth={0}
          />
        )}
      </span>
      {lessonTypeIcon(lesson.lesson_type)}
      <span className="min-w-0 flex-1 text-sm font-medium text-[#062357]">{lesson.title}</span>
      <PrepCourseLessonTypeBadge lessonType={lesson.lesson_type} />
      <span className="shrink-0 text-xs text-[#666d80]">{formatDurationShort(lesson.duration_minutes)}</span>
    </Link>
  )
}

export { PrepCourseLessonRow }
