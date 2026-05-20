import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { activeDrillIntroCopy } from "@/features/prep-course/lib/active-drill-intro-copy"
import type { PrepLesson, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type ActiveDrillIntroCardProps = {
  lesson: PrepLesson
  linked?: PrepLessonLinkedQuestionRef | null
  onStartDrill?: () => void
  startingDrill?: boolean
}

function formatPtRef(linked: PrepLessonLinkedQuestionRef): string {
  const pt = linked.prep_test_module_id ?? linked.prep_test_title ?? "PrepTest"
  const section = linked.section_number != null ? `S${linked.section_number}` : "S—"
  const q = linked.question_number != null ? `Q${linked.question_number}` : "Q—"
  return `${pt} · ${section} · ${q}`
}

function ActiveDrillIntroCard({ lesson, linked, onStartDrill, startingDrill = false }: ActiveDrillIntroCardProps) {
  const body = activeDrillIntroCopy(lesson)

  return (
    <article className="mx-auto max-w-2xl rounded-2xl border border-[#dfe1e7] bg-white p-8 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="font-serif text-2xl font-bold text-[#062357] md:text-[28px]">{lesson.title}</h2>
      {linked ? (
        <p className="mt-2 text-sm font-medium tracking-[0.02em] text-[#666d80]">{formatPtRef(linked)}</p>
      ) : null}
      <p className="ds-body-sm mt-6 leading-7 text-[#36394a]">{body}</p>
      <div className="mt-8 flex justify-end">
        <Button
          type="button"
          onClick={onStartDrill}
          disabled={startingDrill || !onStartDrill}
          className="h-10 cursor-pointer gap-1 rounded-2xl bg-[#0d47a1] px-5 text-sm font-semibold text-white hover:bg-[#0b3d8c] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
        >
          {startingDrill ? "Starting…" : "Start"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </article>
  )
}

export { ActiveDrillIntroCard }
