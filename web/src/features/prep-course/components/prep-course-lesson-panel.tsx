import { Bookmark } from "lucide-react"
import type { RefObject } from "react"

import { LessonContentRenderer } from "@/features/prep-course/components/lesson-content-renderer"
import { cn } from "@/lib/utils"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import {
  isResolvedAdaptiveDrillLesson,
  isResolvedPrepCourseDrillLesson,
  resolveDrillLessonType,
  lessonMetaLine,
} from "@/features/prep-course/lib/prep-course-format"
import type {
  PrepCourse,
  PrepLesson,
  PrepLessonActiveDrillAttempt,
  PrepLessonLinkedQuestionRef,
} from "@/lib/api/prep-course"

type DrillResultsPart = "cards" | "below" | "full"

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
  sidebarAdjacent?: boolean
  drillResultsPart?: DrillResultsPart
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
  sidebarAdjacent = false,
  drillResultsPart = "full",
}: PrepCourseLessonPanelProps) {
  const isPrepCourseDrill = lesson ? isResolvedPrepCourseDrillLesson(lesson) : false
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
      isResolvedPrepCourseDrillLesson(lesson))
  const isRepWorkLesson = lesson != null && resolveDrillLessonType(lesson) === "rep_work"
  const isAdaptiveDrillIntro =
    lesson != null && isResolvedAdaptiveDrillLesson(lesson) && !activeDrillAttempt
  const hideHeaderForDrillIntro = isAdaptiveDrillIntro
  const hideHeaderForDrillResults =
    Boolean(activeDrillAttempt) &&
    lesson != null &&
    isResolvedPrepCourseDrillLesson(lesson)
  const useLessonArticleShell = Boolean(
    lesson && !loading && !hasVideo && !isRepWorkLesson && !hideHeaderForDrillResults && !hideHeaderForDrillIntro,
  )

  const titleBlock =
    lesson && !loading && !hideHeaderForDrillResults && !hideHeaderForDrillIntro ? (
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

  const belowVideoTitleBlock =
    lesson && !loading && hasVideo && !hideHeaderForDrillIntro ? (
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
      belowVideo={hasVideo ? belowVideoTitleBlock : undefined}
      onReviewDrill={onReviewDrill}
      onStartDrill={onStartDrill}
      startingDrill={startingDrill}
      drillStartError={drillStartError}
      edgeToSidebar={false}
      skipArticleShell={useLessonArticleShell}
      sectionSubtitle={subtitle}
      lessonBookmarked={lessonBookmarked}
      onToggleLessonBookmark={onToggleLessonBookmark}
      drillResultsPart={drillResultsPart}
    />
  ) : null

  const contentPaddingClass = sidebarAdjacent ? "pt-6 pb-6 pl-6 pr-0" : "p-6"

  if (lesson && hideHeaderForDrillResults && drillResultsPart === "cards") {
    return (
      <div className="box-border w-full shrink-0 bg-[var(--primary-0)] px-6 pt-6">
        <LessonContentRenderer
          lesson={lesson}
          linkedQuestionRefs={linkedQuestionRefs}
          activeDrillAttempt={activeDrillAttempt}
          hideTitle
          belowVideo={hasVideo ? belowVideoTitleBlock : undefined}
          onReviewDrill={onReviewDrill}
          onStartDrill={onStartDrill}
          startingDrill={startingDrill}
          drillStartError={drillStartError}
          edgeToSidebar={false}
          skipArticleShell={false}
          sectionSubtitle={subtitle}
          lessonBookmarked={lessonBookmarked}
          onToggleLessonBookmark={onToggleLessonBookmark}
          drillResultsPart="cards"
        />
      </div>
    )
  }

  if (lesson && hideHeaderForDrillResults && drillResultsPart === "below") {
    const belowContent = (
      <LessonContentRenderer
        lesson={lesson}
        linkedQuestionRefs={linkedQuestionRefs}
        activeDrillAttempt={activeDrillAttempt}
        hideTitle
        belowVideo={hasVideo ? belowVideoTitleBlock : undefined}
        onReviewDrill={onReviewDrill}
        onStartDrill={onStartDrill}
        startingDrill={startingDrill}
        drillStartError={drillStartError}
        edgeToSidebar={false}
        skipArticleShell={false}
        sectionSubtitle={subtitle}
        lessonBookmarked={lessonBookmarked}
        onToggleLessonBookmark={onToggleLessonBookmark}
        drillResultsPart="below"
      />
    )

    if (contentScrollRef) {
      return (
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            ref={contentScrollRef}
            className={cn(
              "practice-session-pane practice-session-scroll-hidden h-0 min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain bg-[var(--primary-0)] [overflow-anchor:none]",
              contentPaddingClass,
            )}
          >
            {belowContent}
          </div>
        </div>
      )
    }

    return (
      <div className="box-border min-w-0 bg-[var(--primary-0)]">
        {belowContent}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {loading && !lesson ? (
        <StudentPageLoader centered label="Loading lesson…" />
      ) : lesson ? (
        isRepWorkLesson ? (
          <div
            ref={contentScrollRef}
            className={cn(
              "practice-session-pane practice-session-scroll-hidden h-0 min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain bg-[var(--primary-0)] [overflow-anchor:none]",
              contentPaddingClass,
            )}
          >
            <article
              className={cn(
                "box-border min-w-0 max-w-full overflow-x-clip rounded-[16px] border border-[#dfe1e7] bg-white shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]",
                sidebarAdjacent && "min-h-full",
              )}
            >
              <div className="box-border flex min-w-0 max-w-full flex-col gap-5 overflow-x-clip p-6">
                {titleBlock}
                {lessonBody}
              </div>
            </article>
          </div>
        ) : isAdaptiveDrillIntro ? (
          <div
            ref={contentScrollRef}
            className={cn(
              "practice-session-pane practice-session-scroll-hidden flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[var(--primary-0)] [overflow-anchor:none]",
              contentPaddingClass,
            )}
          >
            <div className="flex w-full flex-1 flex-col items-center justify-start pt-2">{lessonBody}</div>
          </div>
        ) : useLessonArticleShell ? (
          <div
            ref={contentScrollRef}
            className={cn(
              "practice-session-pane practice-session-scroll-hidden h-0 min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--primary-0)] [overflow-anchor:none]",
              contentPaddingClass,
            )}
          >
            <article
              className={cn(
                "box-border min-w-0 max-w-full overflow-x-clip rounded-[16px] border border-[#dfe1e7] bg-white shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]",
                sidebarAdjacent && "min-h-full",
              )}
            >
              <div className="box-border flex min-w-0 max-w-full flex-col gap-6 overflow-x-clip p-6">
                {titleBlock}
                {lessonBody}
              </div>
            </article>
          </div>
        ) : (
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {!hasVideo ? (
              <div className={cn("shrink-0 bg-transparent", contentPaddingClass, "pb-0")}>{titleBlock}</div>
            ) : null}
            <div
              ref={contentScrollRef}
              className={cn(
                "practice-session-pane practice-session-scroll-hidden h-0 min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain bg-[var(--primary-0)] [overflow-anchor:none]",
                contentPaddingClass,
                !hasVideo && "pt-0",
              )}
            >
              {lessonBody}
            </div>
          </div>
        )
      ) : (
        <p className="ds-body-sm ds-text-muted">Select a lesson to view its content.</p>
      )}
    </div>
  )
}

export { PrepCourseLessonPanel }
