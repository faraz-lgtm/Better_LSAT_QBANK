import { Button } from "@/components/ui/button"
import { PrepCourseLessonSectionHeader } from "@/features/prep-course/components/prep-course-lesson-section-header"
import { activeDrillIntroCopy } from "@/features/prep-course/lib/active-drill-intro-copy"
import { activeDrillStartMetaLine } from "@/features/prep-course/lib/start-lesson-drill-request"
import type { PrepLesson } from "@/lib/api/prep-course"

type ActiveDrillStartScreenProps = {
  lesson: PrepLesson
  moduleLessonLine?: string | null
  sectionSubtitle?: string | null
  lessonSequence?: { current: number; total: number } | null
  lessonBookmarked?: boolean
  onToggleLessonBookmark?: (next: boolean) => void
  onStartDrill: () => void
  startingDrill?: boolean
  drillStartError?: string | null
}

function ActiveDrillStartScreen({
  lesson,
  moduleLessonLine = null,
  sectionSubtitle = null,
  lessonSequence = null,
  lessonBookmarked = false,
  onToggleLessonBookmark,
  onStartDrill,
  startingDrill = false,
  drillStartError = null,
}: ActiveDrillStartScreenProps) {
  const body = activeDrillIntroCopy(lesson)
  const rightMeta = activeDrillStartMetaLine(lesson)

  return (
    <article className="flex w-full min-w-0 flex-col bg-[var(--greyscale-0)]">
      <header className="flex w-full min-w-0 flex-col items-center px-8 pb-8 pt-12 md:px-16">
        <PrepCourseLessonSectionHeader
          title={lesson.title}
          moduleLessonLine={moduleLessonLine}
          subtitle={sectionSubtitle}
          rightMeta={rightMeta}
          lessonSequence={lessonSequence}
          lessonBookmarked={lessonBookmarked}
          onToggleLessonBookmark={onToggleLessonBookmark}
          bookmarkVariant="figma"
          contentClassName="w-full max-w-[640px]"
        />
      </header>

      <div className="flex w-full min-w-0 flex-col items-center px-8 py-8 md:px-[124px]">
        <div className="flex w-full max-w-[640px] flex-col items-end gap-[72px]">
          <div className="flex w-full flex-col gap-4">
            <p className="m-0 w-full text-[18px] font-normal leading-[1.4] tracking-[0.36px] text-[#1a1b25] dark:text-[var(--color-student-heading)]">
              {body}
            </p>
            {drillStartError ? (
              <p className="m-0 text-sm text-[#95122b]" role="alert">
                {drillStartError}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onStartDrill}
            disabled={startingDrill}
            className="ds-btn-sm h-10 cursor-pointer gap-2 rounded-[14px] px-4 py-2 text-sm font-semibold tracking-[0.28px] disabled:pointer-events-auto disabled:cursor-not-allowed"
          >
            {startingDrill ? "Starting…" : "Start Active Drill"}
            {startingDrill ? null : (
              <img src="/figma/active-drill/chevron-right.svg" alt="" className="size-4 shrink-0" />
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}

export { ActiveDrillStartScreen }
