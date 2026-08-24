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
  inLessonCard?: boolean
  drillResultsPart?: DrillResultsPart
  moduleLessonLine?: string | null
  lessonSequence?: { current: number; total: number } | null
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
  inLessonCard = false,
  drillResultsPart = "full",
  moduleLessonLine = null,
  lessonSequence = null,
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

  const durationReadLabel =
    lesson && (lesson.duration_minutes ?? 0) > 0 ? `${lesson.duration_minutes} min read` : null
  const videoMetaLabel = hasVideo ? "video" : "no video"
  const rightMeta = [durationReadLabel, videoMetaLabel].filter(Boolean).join(" · ")

  const renderLessonHeader = () => (
    <header className="flex min-w-0 flex-col items-center px-16 pb-8 pt-12">
      <div className="flex w-full max-w-[640px] min-w-0 flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            {moduleLessonLine ? (
              <p className="m-0 text-xs font-bold leading-[1.5] tracking-[0.24px] text-[#0d47a1]">{moduleLessonLine}</p>
            ) : null}
            <h2 className="m-0 text-[24px] font-bold leading-[1.3] text-[#36394a]">{lesson?.title}</h2>
            {subtitle ? (
              <p className="m-0 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[#666d80]">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3">
            <button
              type="button"
              aria-label={lessonBookmarked ? "Remove lesson bookmark" : "Save lesson"}
              aria-pressed={lessonBookmarked}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-[14px] text-xs font-medium leading-[1.5] tracking-[0.24px] transition-colors",
                lessonBookmarked ? "text-[#0d47a1]" : "text-[#666d80] hover:text-[#0d47a1]",
              )}
              onClick={() => onToggleLessonBookmark?.(!lessonBookmarked)}
            >
              <Bookmark className={cn("size-4", lessonBookmarked && "fill-current")} strokeWidth={2} />
              <span>Save lesson</span>
            </button>
            <p className="m-0 text-xs font-normal leading-[1.5] tracking-[0.24px] text-[#666d80]">{rightMeta}</p>
          </div>
        </div>
        {lessonSequence ? (
          <div className="flex items-center gap-[14px]">
            <div className="flex min-w-0 flex-1 items-start gap-[3px]">
              {Array.from({ length: lessonSequence.total }).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-[5px] min-w-0 flex-1 rounded-full ${idx < lessonSequence.current ? "bg-[#0d47a1]" : "bg-[#dfe1e7]"}`}
                />
              ))}
            </div>
            <p className="m-0 text-xs font-bold leading-[1.5] tracking-[0.24px] text-[#062357]">
              {lessonSequence.current} / {lessonSequence.total}
            </p>
          </div>
        ) : null}
      </div>
    </header>
  )

  const titleBlock =
    lesson && !loading && !hideHeaderForDrillResults && !hideHeaderForDrillIntro ? (
      renderLessonHeader()
    ) : null

  const belowVideoTitleBlock =
    lesson && !loading && hasVideo && !hideHeaderForDrillIntro ? (
      renderLessonHeader()
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
      inLessonCard={inLessonCard}
      sectionSubtitle={subtitle}
      lessonBookmarked={lessonBookmarked}
      onToggleLessonBookmark={onToggleLessonBookmark}
      drillResultsPart={drillResultsPart}
    />
  ) : null

  const contentPaddingClass = inLessonCard ? "p-0" : sidebarAdjacent ? "pt-6 pb-6 pl-6 pr-0" : "p-6"
  const paneBgClass = inLessonCard ? "bg-white" : "bg-[var(--primary-0)]"

  if (lesson && hideHeaderForDrillResults && drillResultsPart === "cards") {
    return (
      <div className="box-border w-full shrink-0 bg-[var(--primary-0)]">
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
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading lesson…" />
      ) : lesson ? (
        isRepWorkLesson ? (
          <div
            ref={contentScrollRef}
            className={cn(
              "practice-session-pane practice-session-scroll-hidden h-0 min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain [overflow-anchor:none]",
              paneBgClass,
              contentPaddingClass,
              sidebarAdjacent && !inLessonCard && "min-h-full",
            )}
          >
            {inLessonCard ? (
              <div className="box-border flex min-w-0 max-w-full flex-col gap-5 overflow-x-clip">
                {titleBlock}
                {lessonBody}
              </div>
            ) : (
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
            )}
          </div>
        ) : isAdaptiveDrillIntro ? (
          <div
            ref={contentScrollRef}
            className={cn(
              "practice-session-pane practice-session-scroll-hidden flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain [overflow-anchor:none]",
              paneBgClass,
              contentPaddingClass,
            )}
          >
            <div className="flex w-full flex-1 flex-col items-center justify-start pt-2">{lessonBody}</div>
          </div>
        ) : useLessonArticleShell ? (
          <div
            ref={contentScrollRef}
            className={cn(
              "practice-session-pane practice-session-scroll-hidden h-0 min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain [overflow-anchor:none]",
              paneBgClass,
              contentPaddingClass,
              (sidebarAdjacent || inLessonCard) && "min-h-full",
            )}
          >
            <div className="box-border flex min-w-0 max-w-full flex-col gap-0 overflow-x-clip">
              {titleBlock}
              <div className="mx-auto box-border w-full max-w-[640px] px-6 pb-8 pt-8 md:px-0">
                {lessonBody}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {!hasVideo ? (
              <div className={cn("shrink-0 bg-transparent", contentPaddingClass, "pb-0")}>{titleBlock}</div>
            ) : null}
            <div
              ref={contentScrollRef}
              className={cn(
                "practice-session-pane practice-session-scroll-hidden h-0 min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain [overflow-anchor:none]",
                inLessonCard ? "bg-white" : paneBgClass,
                inLessonCard && hasVideo ? "p-0" : contentPaddingClass,
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
