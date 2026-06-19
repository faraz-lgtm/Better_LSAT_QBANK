import { Link } from "react-router-dom"
import { Bookmark, Check, ChevronRight } from "lucide-react"

import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import { formatDurationShort } from "@/features/prep-course/lib/prep-course-format"
import type { PrepCourse, PrepLesson } from "@/lib/api/prep-course"
import { cn } from "@/lib/utils"

type PrepCourseLessonRowProps = {
  course: PrepCourse
  lesson: PrepLesson
  active?: boolean
  completed?: boolean
  bookmarked?: boolean
  onToggleBookmark?: (next: boolean) => void
}

function PrepCourseLessonRow({
  course,
  lesson,
  active = false,
  completed = false,
  bookmarked = false,
  onToggleBookmark,
}: PrepCourseLessonRowProps) {
  const href = `/app/prep-course/${course.slug}/${lesson.slug}`
  const progressPercent = completed ? 100 : 0

  return (
    <div
      className={cn(
        "flex min-h-[56px] items-center gap-3 border-b border-[color:var(--greyscale-100)] px-6 py-3 transition-colors last:border-b-0",
        active ? "bg-[var(--primary-0)]" : "bg-white hover:bg-[var(--greyscale-25)]",
      )}
    >
      <Link to={href} className="flex min-w-0 flex-1 items-center gap-3">
        {completed && !active ? (
          <span
            className="flex size-9 shrink-0 items-center justify-center"
            aria-label="Completed"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-[#0d47a1]">
              <Check className="size-4 text-white" strokeWidth={2.5} aria-hidden />
            </span>
          </span>
        ) : (
          <ProgressRing
            value={progressPercent}
            size="sm"
            ringBg={active ? "var(--primary-0)" : "var(--greyscale-0)"}
          />
        )}
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]"
            title={lesson.title}
          >
            {lesson.title}
          </span>
        </span>
        <span className="shrink-0 text-xs leading-[1.5] tracking-[0.24px] text-[color:var(--greyscale-500)]">
          {formatDurationShort(lesson.duration_minutes)}
        </span>
        {active ? (
          <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold tracking-[0.24px] text-[#0d47a1]">
            Continue
            <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
          </span>
        ) : null}
      </Link>
      {onToggleBookmark ? (
        <button
          type="button"
          aria-label={bookmarked ? `Remove bookmark for ${lesson.title}` : `Bookmark ${lesson.title}`}
          aria-pressed={bookmarked}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-[8px] transition-colors",
            bookmarked ? "text-[#0d47a1]" : "text-[color:var(--greyscale-500)] hover:text-[#0d47a1]",
          )}
          onClick={() => onToggleBookmark(!bookmarked)}
        >
          <Bookmark className={cn("size-4", bookmarked && "fill-current")} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  )
}

export { PrepCourseLessonRow }
