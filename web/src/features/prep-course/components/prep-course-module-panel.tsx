import { useMemo } from "react"

import { Switch } from "@/components/ui/switch"
import { PrepCourseExpandButton } from "@/features/prep-course/components/prep-course-content-header"
import {
  PREP_COURSE_FIGMA,
  PrepCourseFigmaIcon,
} from "@/features/prep-course/components/prep-course-figma-icons"
import { PrepCourseLessonRow } from "@/features/prep-course/components/prep-course-lesson-row"
import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import { PrepCourseSectionAccordion } from "@/features/prep-course/components/prep-course-section-accordion"
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
  showBookmarksOnly?: boolean
  bookmarkedLessonSlugs?: ReadonlySet<string>
  onToggleLessonBookmark?: (lessonSlug: string, next: boolean) => void
  onToggleSection: (sectionId: string) => void
  onExpandModuleSections: () => void
  onToggleModuleBookmark: (next: boolean) => void
}

function moduleLessons(mod: PrepCourseModule): PrepLesson[] {
  return mod.sections.flatMap((section) => section.lessons)
}

function filterLessonsForBookmarks(
  lessons: PrepLesson[],
  filterToBookmarkedLessons: boolean,
  bookmarkedLessonSlugs: ReadonlySet<string>,
): PrepLesson[] {
  if (!filterToBookmarkedLessons) return lessons
  return lessons.filter((lesson) => bookmarkedLessonSlugs.has(lesson.slug))
}

function PrepCourseModulePanel({
  course,
  module,
  expandedSectionIds,
  activeLessonSlug,
  completedLessonSlugs,
  moduleBookmarked,
  showBookmarksOnly = false,
  bookmarkedLessonSlugs = new Set<string>(),
  onToggleLessonBookmark,
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

  const filterToBookmarkedLessons = showBookmarksOnly || moduleBookmarked

  const visibleSections = useMemo(() => {
    if (!filterToBookmarkedLessons) return module.sections
    return module.sections
      .map((section) => ({
        ...section,
        lessons: filterLessonsForBookmarks(section.lessons, filterToBookmarkedLessons, bookmarkedLessonSlugs),
      }))
      .filter((section) => section.lessons.length > 0)
  }, [bookmarkedLessonSlugs, filterToBookmarkedLessons, module.sections])

  const visibleFlatLessons = useMemo(() => {
    if (!flatSection) return []
    return filterLessonsForBookmarks(flatSection.lessons, filterToBookmarkedLessons, bookmarkedLessonSlugs)
  }, [bookmarkedLessonSlugs, filterToBookmarkedLessons, flatSection])

  const hasVisibleBookmarkedLessons = filterToBookmarkedLessons
    ? visibleSections.some((section) => section.lessons.length > 0) || visibleFlatLessons.length > 0
    : true

  const statsBlock = (
    <div className="flex h-[88px] flex-col items-end justify-center gap-[14px]">
      <div className="flex flex-col items-end justify-center gap-1.5 text-right text-xs leading-[1.5] tracking-[0.24px]">
        <p className="text-[color:var(--greyscale-500)]">
          Total Time:{" "}
          <span className="font-semibold text-[color:var(--greyscale-500)]">{formatTotalHoursLabel(totalMinutes)}</span>
        </p>
        <p className="text-[#0d47a1]">
          {completedCount} of {lessonCount} Lessons completed • {formatRemainingHoursLabel(remainingMinutes)}
        </p>
      </div>
      <PrepCourseExpandButton
        expandLabel="Expand this Sections"
        collapseLabel="Collapse this Section"
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
      <PrepCourseFigmaIcon
        src={`${PREP_COURSE_FIGMA}/icon-bookmark.svg`}
        className={cn("size-4", moduleBookmarked && "opacity-100")}
      />
      <span className="text-xs font-medium tracking-[0.24px] text-[color:var(--greyscale-500)]">Bookmark</span>
      <Switch
        size="sm"
        checked={moduleBookmarked}
        onChange={(event) => onToggleModuleBookmark(event.target.checked)}
        className={cn(
          "h-5 w-9 border border-[#dfe1e7] bg-white p-0.5",
          moduleBookmarked ? "bg-[#0d47a1]! border-[#0d47a1]!" : undefined,
        )}
        aria-label="Bookmark module"
      />
    </div>
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#dfe1e7] bg-[var(--primary-0)] p-[24px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
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

      <div className="practice-session-pane--scroll-visible min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white">
        {!hasVisibleBookmarkedLessons ? (
          <p className="ds-body-sm ds-text-muted p-6">No bookmarked lessons in this module.</p>
        ) : null}

        {flattenSections && flatSection && flatExpanded && hasVisibleBookmarkedLessons ? (
          <div className="bg-white">
            {visibleFlatLessons.map((lesson) => (
              <PrepCourseLessonRow
                key={lesson.id}
                course={course}
                lesson={lesson}
                active={lesson.slug === activeLessonSlug}
                completed={completedLessonSlugs.has(lesson.slug)}
                bookmarked={bookmarkedLessonSlugs.has(lesson.slug)}
                onToggleBookmark={
                  onToggleLessonBookmark
                    ? (next) => onToggleLessonBookmark(lesson.slug, next)
                    : undefined
                }
              />
            ))}
          </div>
        ) : null}

        {!flattenSections && hasVisibleBookmarkedLessons
          ? visibleSections.map((section) => (
              <PrepCourseSectionAccordion
                key={section.id}
                course={course}
                section={section}
                expanded={expandedSectionIds.has(section.id)}
                activeLessonSlug={activeLessonSlug}
                completedLessonSlugs={completedLessonSlugs}
                bookmarkedLessonSlugs={bookmarkedLessonSlugs}
                onToggleLessonBookmark={onToggleLessonBookmark}
                onToggle={() => onToggleSection(section.id)}
              />
            ))
          : null}
      </div>
    </div>
  )
}

export { PrepCourseModulePanel }
