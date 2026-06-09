import { ChevronDown, ChevronUp } from "lucide-react"

import { PrepCourseLessonRow } from "@/features/prep-course/components/prep-course-lesson-row"
import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import {
  countCompletedLessons,
  formatRemainingHoursLabel,
  formatSectionTimeLabel,
  incompleteDurationMinutes,
  lessonProgressPercent,
  sectionDurationMinutes,
} from "@/features/prep-course/lib/prep-course-format"
import type { PrepCourse, PrepCourseSection } from "@/lib/api/prep-course"

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

  return (
    <div className="bg-white">
      <button
        type="button"
        className="flex w-full items-center gap-4 px-6 py-4 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <ProgressRing value={progressPercent} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-[0.02em] text-[#062357]" title={section.title}>
            {section.title}
          </p>
        </div>
        <div className="hidden shrink-0 text-right text-xs font-medium tracking-[0.02em] text-[#666d80] sm:block">
          <p>Total Time: {formatSectionTimeLabel(totalMinutes)}</p>
          {remainingMinutes > 0 ? (
            <p className="mt-0.5">{formatRemainingHoursLabel(remainingMinutes)} in section</p>
          ) : null}
        </div>
        {expanded ? (
          <ChevronUp className="size-5 shrink-0 text-[#666d80]" aria-hidden />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-[#666d80]" aria-hidden />
        )}
      </button>
      {expanded ? (
        <div className="space-y-0.5 px-4 pb-4">
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
