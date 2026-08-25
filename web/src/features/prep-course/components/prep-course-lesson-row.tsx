import { Link } from "react-router-dom"

import {
  PREP_COURSE_FIGMA,
  PrepCourseFigmaIcon,
} from "@/features/prep-course/components/prep-course-figma-icons"
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
  locked?: boolean
  onLockedClick?: () => void
  onToggleBookmark?: (next: boolean) => void
}

function PrepCourseLessonRow({
  course,
  lesson,
  active = false,
  completed = false,
  bookmarked = false,
  locked = false,
  onLockedClick,
  onToggleBookmark,
}: PrepCourseLessonRowProps) {
  const href = `/app/prep-course/${course.slug}/${lesson.slug}`
  const markerVariant = locked ? "locked" : active ? "active" : completed ? "complete" : "incomplete"
  const { title, iconType, subtitle } = resolveLessonRowDisplay(lesson)
  const durationMeta = lessonMetaLine(lesson)

  const titleBlock = (
    <>
      <LessonStatusMarker variant={markerVariant} />
      <PrepCourseLessonTypeIcon lessonType={iconType} />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-medium leading-[1.5] tracking-[0.28px]",
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
    </>
  )

  return (
    <div
      className={cn(
        "flex min-h-[68px] items-center justify-between gap-3 border-b border-[#dfe1e7] px-6 py-3 transition-colors last:border-b-0",
        active ? "bg-[var(--primary-0)]" : "bg-white hover:bg-[var(--greyscale-25)]",
      )}
    >
      {locked ? (
        <button
          type="button"
          onClick={onLockedClick}
          aria-label={`${title} (locked)`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {titleBlock}
        </button>
      ) : (
        <Link to={href} className="flex min-w-0 flex-1 items-center gap-3">
          {titleBlock}
        </Link>
      )}
      <div className="flex shrink-0 items-center gap-3">
        {active && !locked ? (
          <Link
            to={href}
            className="inline-flex h-8 items-center justify-end gap-2 text-xs font-semibold tracking-[0.24px] text-[#0d47a1]"
          >
            Continue
            <PrepCourseFigmaIcon src={`${PREP_COURSE_FIGMA}/icon-continue.svg`} className="size-4" />
          </Link>
        ) : null}
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
            <PrepCourseFigmaIcon
              src={`${PREP_COURSE_FIGMA}/icon-bookmark-sm.svg`}
              className={cn("size-[18px]", bookmarked && "opacity-100")}
            />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export { PrepCourseLessonRow }
