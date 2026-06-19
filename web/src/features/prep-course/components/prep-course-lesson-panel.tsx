import { Bookmark } from "lucide-react"
import type { RefObject } from "react"

import { LessonContentRenderer } from "@/features/prep-course/components/lesson-content-renderer"
import { cn } from "@/lib/utils"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { isPrepCourseDrillLessonType, lessonMetaLine } from "@/features/prep-course/lib/prep-course-format"
import type {
  PrepCourse,
  PrepLesson,
  PrepLessonActiveDrillAttempt,
  PrepLessonLinkedQuestionRef,
} from "@/lib/api/prep-course"

type PrepCourseLessonPanelProps = {
  course: PrepCourse
  lesson: PrepLesson | null
  linkedQuestionRefs?: PrepLessonLinkedQuestionRef[]
  activeDrillAttempt?: PrepLessonActiveDrillAttempt | null
  loading?: boolean
  sectionSubtitle?: string | null
  contentScrollRef?: RefObject<HTMLDivElement | null>
  onReviewDrill?: () => void
  onStartDrill?: () => void
  startingDrill?: boolean
  drillStartError?: string | null
  lessonBookmarked?: boolean
  onToggleLessonBookmark?: (next: boolean) => void
}

function PrepCourseLessonPanel({
  course: _course,
  lesson,
  linkedQuestionRefs = [],
  activeDrillAttempt = null,
  loading = false,
  sectionSubtitle = null,
  contentScrollRef,
  onReviewDrill,
  onStartDrill,
  startingDrill = false,
  drillStartError = null,
  lessonBookmarked = false,
  onToggleLessonBookmark,
}: PrepCourseLessonPanelProps) {
  const isPrepCourseDrill = lesson ? isPrepCourseDrillLessonType(lesson.lesson_type) : false
  const headerMeta =
    lesson && !loading
      ? lessonMetaLine(lesson, {
          activeDrillAttempted: isPrepCourseDrill ? Boolean(activeDrillAttempt) : true,
        })
      : null
  const subtitle = sectionSubtitle ?? headerMeta
  const hasVideo =
    Boolean(lesson?.video_url?.trim()) &&
    lesson != null &&
    (lesson.lesson_type === "video" ||
      lesson.lesson_type === "video_text" ||
      lesson.lesson_type === "active_drill" ||
      lesson.lesson_type === "adaptive_drill")
  const isRepWorkLesson = lesson != null && lesson.lesson_type === "rep_work"
  const hideHeaderForDrillResults =
    Boolean(activeDrillAttempt) &&
    lesson != null &&
    (lesson.lesson_type === "active_drill" || lesson.lesson_type === "adaptive_drill")

  const titleBlock =
    lesson && !loading && !hideHeaderForDrillResults ? (
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="student-page-heading">{lesson.title}</h1>
          {subtitle ? (
            <p className="m-0 text-sm font-normal leading-normal tracking-[0.02em] text-[#666d80]">{subtitle}</p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={lessonBookmarked ? "Remove lesson bookmark" : "Bookmark lesson"}
          aria-pressed={lessonBookmarked}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors",
            lessonBookmarked ? "text-[#0d47a1]" : "text-[#666d80] hover:text-[#0d47a1]",
          )}
          onClick={() => onToggleLessonBookmark?.(!lessonBookmarked)}
        >
          <Bookmark className={cn("size-6", lessonBookmarked && "fill-current")} strokeWidth={2} />
        </button>
      </header>
    ) : null

  const lessonBody = lesson ? (
    <LessonContentRenderer
      lesson={lesson}
      linkedQuestionRefs={linkedQuestionRefs}
      activeDrillAttempt={activeDrillAttempt}
      hideTitle
      belowVideo={hasVideo ? titleBlock : undefined}
      onReviewDrill={onReviewDrill}
      onStartDrill={onStartDrill}
      startingDrill={startingDrill}
      drillStartError={drillStartError}
    />
  ) : null

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {loading && !lesson ? (
        <StudentPageLoader centered label="Loading lesson…" />
      ) : lesson ? (
        isRepWorkLesson ? (
          <div
            ref={contentScrollRef}
            className="practice-session-pane practice-session-scroll-hidden h-0 min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain bg-[var(--greyscale-25)] p-6 [overflow-anchor:none]"
          >
            <article className="box-border min-w-0 max-w-full overflow-x-clip rounded-[14px] border border-[#e2e8f0] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
              <div className="box-border flex min-w-0 max-w-full flex-col gap-5 overflow-x-clip p-6">
                {titleBlock}
                {lessonBody}
              </div>
            </article>
          </div>
        ) : (
          <>
            {!hasVideo ? <div className="shrink-0">{titleBlock}</div> : null}
            <div
              ref={contentScrollRef}
              className={`practice-session-pane practice-session-scroll-hidden h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain [overflow-anchor:none] pb-6 ${!hasVideo ? "pt-8" : ""}`}
            >
              {lessonBody}
            </div>
          </>
        )
      ) : (
        <p className="ds-body-sm ds-text-muted">Select a lesson to view its content.</p>
      )}
    </div>
  )
}

export { PrepCourseLessonPanel }
