import { Button } from "@/components/ui/button"
import { activeDrillIntroCopy } from "@/features/prep-course/lib/active-drill-intro-copy"
import { cn } from "@/lib/utils"
import type { PrepLesson, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type ActiveDrillIntroCardProps = {
  lesson: PrepLesson
  linked?: PrepLessonLinkedQuestionRef | null
  hideTitle?: boolean
  onStartDrill?: () => void
  startingDrill?: boolean
  drillStartError?: string | null
}

function formatPtRef(linked: PrepLessonLinkedQuestionRef): string {
  const pt = linked.prep_test_module_id ?? linked.prep_test_title ?? "PrepTest"
  const section = linked.section_number != null ? `S${linked.section_number}` : "S—"
  const q = linked.question_number != null ? `Q${linked.question_number}` : "Q—"
  return `${pt} · ${section} · ${q}`
}

/** Fallback intro only — lesson body HTML unlocks after the singular drill + results. */
function ActiveDrillIntroCard({
  lesson,
  linked,
  hideTitle = false,
  onStartDrill,
  startingDrill = false,
  drillStartError = null,
}: ActiveDrillIntroCardProps) {
  const body = activeDrillIntroCopy(lesson)

  return (
    <article className="w-full bg-transparent">
      {hideTitle ? null : (
        <h2 className="text-2xl font-bold text-[var(--color-student-heading)] md:text-[28px]">{lesson.title}</h2>
      )}
      {linked ? (
        <p className={`text-sm font-medium tracking-[0.02em] text-[var(--greyscale-500)] ${hideTitle ? "" : "mt-2"}`}>
          {formatPtRef(linked)}
        </p>
      ) : null}
      <p
        className={cn(
          "text-[18px] font-normal leading-[1.4] tracking-[0.36px] text-[var(--color-student-heading)]",
          hideTitle ? "mt-0" : "mt-6",
          linked && hideTitle && "mt-6",
        )}
      >
        {body}
      </p>
      {drillStartError ? (
        <p className="mt-6 text-sm text-[#95122b]" role="alert">
          {drillStartError}
        </p>
      ) : null}
      <div className="mt-8 flex justify-end">
        <Button
          type="button"
          onClick={() => onStartDrill?.()}
          disabled={startingDrill || !onStartDrill}
          className="ds-btn-sm h-10 cursor-pointer gap-2 rounded-[14px] px-4 py-2 text-sm font-semibold tracking-[0.28px] disabled:pointer-events-auto disabled:cursor-not-allowed"
        >
          {startingDrill ? "Starting…" : "Start Active Drill"}
          {startingDrill ? null : (
            <img src="/figma/active-drill/chevron-right.svg" alt="" className="size-4 shrink-0" />
          )}
        </Button>
      </div>
    </article>
  )
}

export { ActiveDrillIntroCard }
