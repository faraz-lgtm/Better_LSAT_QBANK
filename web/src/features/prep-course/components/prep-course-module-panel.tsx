import { PrepCourseSectionAccordion } from "@/features/prep-course/components/prep-course-section-accordion"
import { ProgressRing } from "@/features/prep-course/components/prep-course-lesson-sidebar"
import {
  countCompletedLessons,
  formatCourseHoursLabel,
  formatTotalHoursLabel,
  lessonProgressPercent,
  moduleDurationMinutes,
  moduleLessonCount,
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

  return (
    <div className="min-w-0 flex-1 space-y-4">
      <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
        <ProgressRing value={progressPercent} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#062357]">{module.title}</h2>
          <p className="mt-1 text-xs text-[#666d80]">
            Total Time: {formatTotalHoursLabel(totalMinutes)}
          </p>
          <p className="mt-0.5 text-xs text-[#666d80]">
            {completedCount} of {lessonCount} lessons completed · {formatCourseHoursLabel(totalMinutes)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
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
    </div>
  )
}

export { PrepCourseModulePanel }
