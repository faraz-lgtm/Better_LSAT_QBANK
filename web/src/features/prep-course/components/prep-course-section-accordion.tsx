import { ChevronDown } from "lucide-react"

import { PrepCourseLessonRow } from "@/features/prep-course/components/prep-course-lesson-row"
import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import {
  countCompletedLessons,
  formatDurationShort,
  formatRemainingHoursLabel,
  incompleteDurationMinutes,
  lessonProgressPercent,
  sectionDurationMinutes,
} from "@/features/prep-course/lib/prep-course-format"
import type { PrepCourse, PrepCourseSection } from "@/lib/api/prep-course"
import { cn } from "@/lib/utils"

type PrepCourseSectionAccordionProps = {
  course: PrepCourse
  section: PrepCourseSection
  expanded: boolean
  activeLessonSlug?: string
  completedLessonSlugs: Set<string>
  onToggle: () => void
}

function PrepCourseSectionAccordion({
  course,
  section,
  expanded,
  activeLessonSlug,
  completedLessonSlugs,
  onToggle,
}: PrepCourseSectionAccordionProps) {
  const totalMinutes = sectionDurationMinutes(section)
  const lessonCount = section.lessons.length
  const completedCount = countCompletedLessons(section.lessons, completedLessonSlugs)
  const progressPercent = lessonProgressPercent(completedCount, lessonCount)
  const remainingMinutes = incompleteDurationMinutes(section.lessons, completedLessonSlugs)
  const remainingLabel = formatRemainingHoursLabel(remainingMinutes).replace(" left", " left in section")

  return (
    <div className="border-b border-l border-[color:var(--greyscale-100)] bg-[var(--greyscale-25)]">
      <button
        type="button"
        className="flex h-[100px] w-full items-center justify-between gap-3 p-[24px] text-left transition-colors"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          <ProgressRing value={progressPercent} size="sm" ringBg="var(--greyscale-25)" />
          <p className="truncate text-lg font-bold leading-[1.35] text-[#062357]" title={section.title}>
            {section.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right text-xs leading-[1.5] tracking-[0.24px] sm:block">
            <p className="text-[color:var(--greyscale-500)]">
              Total Time:{" "}
              <span className="font-semibold text-[color:var(--greyscale-500)]">{formatDurationShort(totalMinutes)}</span>
            </p>
            {remainingMinutes > 0 ? (
              <p className="mt-1.5 text-[color:var(--greyscale-400)]">{remainingLabel}</p>
            ) : null}
          </div>
          <ChevronDown
            className={cn("size-6 shrink-0 text-[color:var(--greyscale-500)] transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </div>
      </button>
      {expanded ? (
        <div className="border-t border-[color:var(--greyscale-100)] bg-white">
          {section.lessons.map((lesson) => (
            <PrepCourseLessonRow
              key={lesson.id}
              course={course}
              lesson={lesson}
              active={lesson.slug === activeLessonSlug}
              completed={completedLessonSlugs.has(lesson.slug)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export { PrepCourseSectionAccordion }
