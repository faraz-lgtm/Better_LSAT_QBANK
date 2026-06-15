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
    <div className="border-b border-l border-[#dfe1e7] bg-[#f6f8fa]">
      <button
        type="button"
        className="flex h-[100px] w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-[#f0f2f5]"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          <ProgressRing value={progressPercent} size="sm" ringBg="#f6f8fa" />
          <p className="truncate text-lg font-bold leading-[1.35] text-[#062357]" title={section.title}>
            {section.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right text-xs leading-[1.5] tracking-[0.24px] sm:block">
            <p className="text-[#666d80]">
              Total Time:{" "}
              <span className="font-semibold text-[#666d80]">{formatSectionTimeLabel(totalMinutes)}</span>
            </p>
            {remainingMinutes > 0 ? (
              <p className="mt-1.5 text-[#818898]">
                {formatRemainingHoursLabel(remainingMinutes).replace(" left", " left in section")}
              </p>
            ) : null}
          </div>
          {expanded ? (
            <ChevronUp className="size-6 shrink-0 text-[#666d80]" aria-hidden />
          ) : (
            <ChevronDown className="size-6 shrink-0 text-[#666d80]" aria-hidden />
          )}
        </div>
      </button>
      {expanded ? (
        <div className="space-y-0.5 border-t border-[#dfe1e7] bg-white px-4 pb-4 pt-2">
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
