import {
  PREP_COURSE_FIGMA,
  PrepCourseFigmaIcon,
} from "@/features/prep-course/components/prep-course-figma-icons"
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
  bookmarkedLessonSlugs?: ReadonlySet<string>
  onToggleLessonBookmark?: (lessonSlug: string, next: boolean) => void
  onToggle: () => void
  lessonsLocked?: boolean
  onLockedLessonClick?: () => void
}

function PrepCourseSectionAccordion({
  course,
  section,
  expanded,
  activeLessonSlug,
  completedLessonSlugs,
  bookmarkedLessonSlugs = new Set<string>(),
  onToggleLessonBookmark,
  onToggle,
  lessonsLocked = false,
  onLockedLessonClick,
}: PrepCourseSectionAccordionProps) {
  const totalMinutes = sectionDurationMinutes(section)
  const lessonCount = section.lessons.length
  const completedCount = countCompletedLessons(section.lessons, completedLessonSlugs)
  const progressPercent = lessonProgressPercent(completedCount, lessonCount)
  const remainingMinutes = incompleteDurationMinutes(section.lessons, completedLessonSlugs)
  const remainingLabel = formatRemainingHoursLabel(remainingMinutes).replace(" left", " left in section")

  return (
    <div className="border-b border-[var(--greyscale-100)] bg-[var(--greyscale-25)]">
      <button
        type="button"
        className="flex h-[100px] w-full items-center justify-between gap-3 p-[24px] text-left transition-colors"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          <ProgressRing value={progressPercent} size="sm" ringBg="var(--greyscale-25)" />
          <p className="truncate text-lg font-bold leading-[1.35] text-[var(--color-student-heading)]" title={section.title}>
            {section.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden flex-col items-end justify-center gap-1.5 text-right text-xs leading-[1.5] tracking-[0.24px] sm:flex">
            <p className="text-[color:var(--greyscale-500)]">
              Total Time:{" "}
              <span className="font-semibold text-[color:var(--greyscale-500)]">
                {formatDurationShort(totalMinutes).replace(/\s+/g, "")}
              </span>
            </p>
            {remainingMinutes > 0 ? (
              <p className="text-[color:var(--greyscale-400)]">{remainingLabel}</p>
            ) : null}
          </div>
          <PrepCourseFigmaIcon
            src={`${PREP_COURSE_FIGMA}/icon-chevron.svg`}
            className={cn("size-6 shrink-0 transition-transform", !expanded && "rotate-180")}
          />
        </div>
      </button>
      {expanded ? (
        <div className="bg-[var(--greyscale-0)]">
          {section.lessons.map((lesson) => (
            <PrepCourseLessonRow
              key={lesson.id}
              course={course}
              lesson={lesson}
              active={lesson.slug === activeLessonSlug}
              completed={completedLessonSlugs.has(lesson.slug)}
              bookmarked={bookmarkedLessonSlugs.has(lesson.slug)}
              locked={lessonsLocked}
              onLockedClick={onLockedLessonClick}
              onToggleBookmark={
                onToggleLessonBookmark
                  ? (next) => onToggleLessonBookmark(lesson.slug, next)
                  : undefined
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export { PrepCourseSectionAccordion }
