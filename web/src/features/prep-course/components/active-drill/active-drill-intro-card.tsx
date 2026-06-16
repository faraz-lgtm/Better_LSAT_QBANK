import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { activeDrillIntroCopy } from "@/features/prep-course/lib/active-drill-intro-copy"
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
    <article className="rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
      {hideTitle ? null : (
        <h2 className="text-2xl font-bold text-[#062357] md:text-[28px]">{lesson.title}</h2>
      )}
      {linked ? (
        <p className={`text-sm font-medium tracking-[0.02em] text-[#666d80] ${hideTitle ? "" : "mt-2"}`}>
          {formatPtRef(linked)}
        </p>
      ) : null}
      <p className={`text-sm leading-7 text-[#36394a] ${hideTitle ? "mt-0" : "mt-6"}`}>{body}</p>
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
          className="ds-btn-sm cursor-pointer gap-1 px-5 text-sm disabled:pointer-events-auto disabled:cursor-not-allowed"
        >
          {startingDrill ? "Starting…" : "Start"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </article>
  )
}

export { ActiveDrillIntroCard }
