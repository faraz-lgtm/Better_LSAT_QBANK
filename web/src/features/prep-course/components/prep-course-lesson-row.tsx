import { Link } from "react-router-dom"
import { Bookmark, ChevronRight } from "lucide-react"

import { PrepCourseLessonTypeIcon } from "@/features/prep-course/components/prep-course-lesson-type-icon"
import { LessonStatusMarker } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import { lessonMetaLine, resolveLessonRowDisplay } from "@/features/prep-course/lib/prep-course-format"
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
  const markerVariant = active ? "active" : completed ? "complete" : "incomplete"
  const { title, iconType, subtitle } = resolveLessonRowDisplay(lesson)
  const durationMeta = lessonMetaLine(lesson)

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-[color:var(--greyscale-100)] px-6 py-3 transition-colors last:border-b-0",
        active ? "bg-[var(--primary-0)]" : "bg-white hover:bg-[var(--greyscale-25)]",
      )}
    >
      <Link to={href} className="flex min-w-0 flex-1 items-center gap-3">
        <LessonStatusMarker variant={markerVariant} />
        <PrepCourseLessonTypeIcon lessonType={iconType} />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-semibold leading-[1.5] tracking-[0.02em]",
              completed && !active ? "text-[color:var(--greyscale-500)]" : "text-[#062357]",
            )}
            title={title}
          >
            {title}
          </span>
          {subtitle ? (
            <span
              className="mt-0.5 block truncate text-xs leading-[1.5] tracking-[0.24px]"
              title={`${subtitle.label} - ${subtitle.duration}`}
            >
              <span className={cn("font-bold", subtitle.accentClass)}>{subtitle.label}</span>
              <span className="text-[color:var(--greyscale-500)]"> - {subtitle.duration}</span>
            </span>
          ) : durationMeta ? (
            <span className="mt-0.5 block text-xs font-medium leading-[1.5] tracking-[0.24px] text-[color:var(--greyscale-500)]">
              {durationMeta}
            </span>
          ) : null}
        </span>
        {active ? (
          <span className="flex shrink-0 items-center gap-2 text-xs font-semibold tracking-[0.24px] text-[#0d47a1]">
            Continue
            <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
          </span>
        ) : null}
      </Link>
      {onToggleBookmark ? (
        <button
          type="button"
          aria-label={bookmarked ? `Remove bookmark for ${title}` : `Bookmark ${title}`}
          aria-pressed={bookmarked}
          className={cn(
            "flex size-[34px] shrink-0 items-center justify-center rounded-[12px] border border-[#dfe1e6] bg-[#f9f9fb] transition-colors",
            bookmarked ? "text-[#0d47a1]" : "text-[color:var(--greyscale-500)] hover:text-[#0d47a1]",
          )}
          onClick={() => onToggleBookmark(!bookmarked)}
        >
          <Bookmark className={cn("size-[18px]", bookmarked && "fill-current")} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  )
}

export { PrepCourseLessonRow }
