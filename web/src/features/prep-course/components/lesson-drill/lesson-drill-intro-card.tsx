import { ArrowRight, Bookmark } from "lucide-react"

import { Button } from "@/components/ui/button"
import { lessonDrillIntroCopy } from "@/features/prep-course/lib/lesson-drill-intro-copy"
import { cn } from "@/lib/utils"
import type { PrepLesson, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type LessonDrillIntroCardProps = {
  lesson: PrepLesson
  linked?: PrepLessonLinkedQuestionRef[]
  sectionSubtitle?: string | null
  lessonBookmarked?: boolean
  onToggleLessonBookmark?: (next: boolean) => void
  onStartDrill?: () => void
  startingDrill?: boolean
  drillStartError?: string | null
}

function LessonDrillIntroCard({
  lesson,
  sectionSubtitle = null,
  lessonBookmarked = false,
  onToggleLessonBookmark,
  onStartDrill,
  startingDrill = false,
  drillStartError = null,
}: LessonDrillIntroCardProps) {
  const body = lessonDrillIntroCopy(lesson)

  return (
    <article className="mx-auto w-full max-w-[672px] rounded-2xl border border-[#dfe1e7] bg-white p-8 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#dfe1e7] pb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-[1.3] text-[#062357] md:text-[28px]">{lesson.title}</h2>
          {sectionSubtitle ? (
            <p className="mt-2 text-sm font-normal leading-normal tracking-[0.02em] text-[#666d80]">
              {sectionSubtitle}
            </p>
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
      </div>

      <div className="pt-6">
        <p className="ds-body-sm leading-7 text-[#36394a]">{body}</p>

        {drillStartError ? (
          <p className="mt-6 text-sm text-[#95122b]" role="alert">
            {drillStartError}
          </p>
        ) : null}

        <div className="mt-8 flex justify-end">
          <Button
            type="button"
            onClick={onStartDrill}
            disabled={startingDrill || !onStartDrill}
            className="ds-btn-sm h-12 cursor-pointer gap-1 rounded-2xl px-6 text-base disabled:pointer-events-auto disabled:cursor-not-allowed"
          >
            {startingDrill ? "Starting…" : "Start"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  )
}

export { LessonDrillIntroCard }
