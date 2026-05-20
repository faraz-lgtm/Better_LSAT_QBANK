import {
  isDrillLessonType,
  LESSON_TYPE_LABEL,
  lessonTypeBadgeClass,
} from "@/features/prep-course/lib/prep-course-format"
import type { PrepLesson } from "@/lib/api/prep-course"

type PrepCourseLessonTypeBadgeProps = {
  lessonType: PrepLesson["lesson_type"]
  variant?: "default" | "onPrimary"
  className?: string
}

function PrepCourseLessonTypeBadge({
  lessonType,
  variant = "default",
  className = "",
}: PrepCourseLessonTypeBadgeProps) {
  if (!isDrillLessonType(lessonType)) return null

  return (
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ${lessonTypeBadgeClass(lessonType, variant)} ${className}`}
    >
      {LESSON_TYPE_LABEL[lessonType]}
    </span>
  )
}

export { PrepCourseLessonTypeBadge }
