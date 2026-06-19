import { Bookmark } from "lucide-react"

import { PrepCourseExpandButton } from "@/features/prep-course/components/prep-course-content-header"
import { PrepCourseLessonRow } from "@/features/prep-course/components/prep-course-lesson-row"
import { PrepCourseSectionAccordion } from "@/features/prep-course/components/prep-course-section-accordion"
import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import { Switch } from "@/components/ui/switch"
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
import { cn } from "@/lib/utils"

type PrepCourseModulePanelProps = {
  course: PrepCourse
  module: PrepCourseModule
  expandedSectionIds: Set<string>
  activeLessonSlug?: string
  completedLessonSlugs: Set<string>
  moduleBookmarked: boolean
  onToggleSection: (sectionId: string) => void
  onExpandModuleSections: () => void
  onToggleModuleBookmark: (next: boolean) => void
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
  moduleBookmarked,
  onToggleSection,
  onExpandModuleSections,
  onToggleModuleBookmark,
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
  const moduleSectionIds = module.sections.map((section) => section.id)
  const moduleSectionsExpanded =
    moduleSectionIds.length > 0 && moduleSectionIds.every((id) => expandedSectionIds.has(id))

  const statsBlock = (
    <div className="flex flex-col items-end justify-center gap-[14px]">
      <div className="text-right text-xs leading-[1.5] tracking-[0.24px]">
        <p className="text-[color:var(--greyscale-500)]">
          Total Time:{" "}
          <span className="font-semibold text-[color:var(--greyscale-500)]">{formatTotalHoursLabel(totalMinutes)}</span>
        </p>
        <p className="mt-1.5 text-[#0d47a1]">
          {completedCount} of {lessonCount} Lessons completed • {formatRemainingHoursLabel(remainingMinutes)}
        </p>
      </div>
      <PrepCourseExpandButton
        expandLabel="Expand this Sections"
        collapseLabel="Collapse this Sections"
        expanded={moduleSectionsExpanded}
        onClick={onExpandModuleSections}
      />
    </div>
  )

  const titleRow = (
    <div className="flex h-12 min-w-0 items-center gap-3">
      <ProgressRing value={progressPercent} size="sm" ringBg="var(--primary-0)" />
      <h2 className="min-w-0 truncate text-2xl font-bold leading-[1.3] text-[#062357]" title={module.title}>
        {module.title}
      </h2>
    </div>
  )

  const bookmarkRow = (
    <div className="flex h-8 items-center gap-2">
      <Bookmark
        className={cn("size-4 shrink-0", moduleBookmarked ? "fill-[#0d47a1] text-[#0d47a1]" : "text-[color:var(--greyscale-500)]")}
        strokeWidth={2}
        aria-hidden
      />
      <span className="text-xs font-medium tracking-[0.24px] text-[color:var(--greyscale-500)]">Bookmark</span>
      <Switch
        size="sm"
        checked={moduleBookmarked}
        onChange={(event) => onToggleModuleBookmark(event.target.checked)}
        className={moduleBookmarked ? "bg-[#0d47a1]!" : undefined}
        aria-label="Bookmark module"
      />
    </div>
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="shrink-0 overflow-hidden rounded-tl-[16px] border border-b-0 border-[color:var(--greyscale-100)] bg-[var(--primary-0)]">
        <div className="flex flex-wrap items-start justify-between gap-4 p-[24px]">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {flattenSections && flatSection ? (
              <button
                type="button"
                className="w-full text-left transition-colors hover:opacity-90"
                onClick={() => onToggleSection(flatSection.id)}
                aria-expanded={flatExpanded}
              >
                {titleRow}
              </button>
            ) : (
              titleRow
            )}
            {bookmarkRow}
          </div>
          <div className="shrink-0">{statsBlock}</div>
        </div>
      </div>

      <div className="practice-session-scroll-hidden min-h-0 flex-1 overflow-y-auto border border-t-0 border-[color:var(--greyscale-100)] bg-white">
        {flattenSections && flatSection && flatExpanded ? (
          <div className="bg-white">
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

        {!flattenSections
          ? module.sections.map((section) => (
              <PrepCourseSectionAccordion
                key={section.id}
                course={course}
                section={section}
                expanded={expandedSectionIds.has(section.id)}
                activeLessonSlug={activeLessonSlug}
                completedLessonSlugs={completedLessonSlugs}
                onToggle={() => onToggleSection(section.id)}
              />
            ))
          : null}
      </div>
    </div>
  )
}

export { PrepCourseModulePanel }
