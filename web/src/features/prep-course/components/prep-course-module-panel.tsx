import { ChevronDown, ChevronUp } from "lucide-react"

import { PrepCourseLessonRow } from "@/features/prep-course/components/prep-course-lesson-row"
import { PrepCourseSectionAccordion } from "@/features/prep-course/components/prep-course-section-accordion"
import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import {
  countCompletedLessons,
  formatRemainingHoursLabel,
  formatTotalHoursLabel,
  incompleteDurationMinutes,
  lessonProgressPercent,
  moduleDurationMinutes,
  moduleLessonCount,
  shouldFlattenModuleSections,
} from "@/features/prep-course/lib/prep-course-format"
import type { PrepCourse, PrepCourseModule, PrepLesson } from "@/lib/api/prep-course"

type PrepCourseModulePanelProps = {
  course: PrepCourse
  module: PrepCourseModule
  expandedSectionIds: Set<string>
  activeLessonSlug?: string
  completedLessonSlugs: Set<string>
  onToggleSection: (sectionId: string) => void
}

function moduleLessons(mod: PrepCourseModule): PrepLesson[] {
  return mod.sections.flatMap((section) => section.lessons)
}

function PrepCourseModulePanel({
  course,
  module,
  expandedSectionIds,
  activeLessonSlug,
  completedLessonSlugs,
  onToggleSection,
}: PrepCourseModulePanelProps) {
  const lessons = moduleLessons(module)
  const lessonCount = moduleLessonCount(module)
  const completedCount = countCompletedLessons(lessons, completedLessonSlugs)
  const progressPercent = lessonProgressPercent(completedCount, lessonCount)
  const totalMinutes = moduleDurationMinutes(module)
  const remainingMinutes = incompleteDurationMinutes(lessons, completedLessonSlugs)
  const flattenSections = shouldFlattenModuleSections(module)
  const flatSection = flattenSections ? module.sections[0] : null
  const flatExpanded = flatSection ? expandedSectionIds.has(flatSection.id) : false

  const headerContent = (
    <>
      <div className="flex min-w-0 items-start gap-4">
        <ProgressRing value={progressPercent} />
        <h2 className="min-w-0 truncate text-xl font-bold tracking-[0.02em] text-[#062357]" title={module.title}>
          {module.title}
        </h2>
      </div>
      <div className="flex shrink-0 items-start gap-3">
        <div className="text-right text-xs font-medium tracking-[0.02em] text-[#666d80]">
          <p>Total Time: {formatTotalHoursLabel(totalMinutes)}</p>
          <p className="mt-1">
            {completedCount} of {lessonCount} Lessons completed
          </p>
          <p className="mt-1">{formatRemainingHoursLabel(remainingMinutes)}</p>
        </div>
        {flattenSections ? (
          flatExpanded ? (
            <ChevronUp className="size-5 shrink-0 text-[#666d80]" aria-hidden />
          ) : (
            <ChevronDown className="size-5 shrink-0 text-[#666d80]" aria-hidden />
          )
        ) : null}
      </div>
    </>
  )

  return (
    <div className="min-w-0 flex-1 bg-white">
      {flattenSections && flatSection ? (
        <button
          type="button"
          className="flex w-full flex-wrap items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[#f6f8fa]"
          onClick={() => onToggleSection(flatSection.id)}
          aria-expanded={flatExpanded}
        >
          {headerContent}
        </button>
      ) : (
        <div className="border-b border-[#dfe1e7] px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">{headerContent}</div>
        </div>
      )}

      {flattenSections && flatSection && flatExpanded ? (
        <div className="space-y-0.5 border-t border-[#dfe1e7] px-4 pb-4 pt-2">
          {flatSection.lessons.map((lesson) => (
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

      {!flattenSections ? (
        <div className="divide-y divide-[#dfe1e7]">
          {module.sections.map((section) => (
            <PrepCourseSectionAccordion
              key={section.id}
              course={course}
              section={section}
              expanded={expandedSectionIds.has(section.id)}
              activeLessonSlug={activeLessonSlug}
              completedLessonSlugs={completedLessonSlugs}
              onToggle={() => onToggleSection(section.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export { PrepCourseModulePanel }
