import { ChevronDown, ChevronUp } from "lucide-react"

import { PrepCourseLessonRow } from "@/features/prep-course/components/prep-course-lesson-row"
import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import {
  countCompletedLessons,
  formatSectionTimeLabel,
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

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <ProgressRing value={progressPercent} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#062357]">{section.title}</p>
          <p className="mt-0.5 text-xs text-[#666d80]">
            Total Time: {formatSectionTimeLabel(totalMinutes)}
            {totalMinutes > 0 ? ` · Time left in section: ${formatSectionTimeLabel(totalMinutes)}` : null}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="size-5 shrink-0 text-[#666d80]" aria-hidden />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-[#666d80]" aria-hidden />
        )}
      </button>
      {expanded ? (
        <div className="space-y-1 border-t border-[#dfe1e7] px-2 py-2">
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
