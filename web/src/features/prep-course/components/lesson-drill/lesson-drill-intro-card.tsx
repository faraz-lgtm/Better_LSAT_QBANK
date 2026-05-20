import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatDurationShort } from "@/features/prep-course/lib/prep-course-format"
import { lessonDrillIntroCopy } from "@/features/prep-course/lib/lesson-drill-intro-copy"
import type { PrepLesson, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type LessonDrillIntroCardProps = {
  lesson: PrepLesson
  linked?: PrepLessonLinkedQuestionRef[]
  onStartDrill?: () => void
  startingDrill?: boolean
}

function formatPtRef(linked: PrepLessonLinkedQuestionRef): string {
  const pt = linked.prep_test_module_id ?? linked.prep_test_title ?? "PrepTest"
  const section = linked.section_number != null ? `S${linked.section_number}` : "S—"
  const q = linked.question_number != null ? `Q${linked.question_number}` : "Q—"
  return `${pt} · ${section} · ${q}`
}

function LessonDrillIntroCard({ lesson, linked = [], onStartDrill, startingDrill = false }: LessonDrillIntroCardProps) {
  const body = lessonDrillIntroCopy(lesson)
  const isAdaptive = lesson.lesson_type === "adaptive_drill"
  const questionCount = linked.length
  const duration = formatDurationShort(lesson.duration_minutes)

  const metaLine = isAdaptive
    ? questionCount > 0
      ? `${questionCount} question${questionCount === 1 ? "" : "s"} · ${duration}`
      : duration
    : linked[0]
      ? formatPtRef(linked[0])
      : null

  return (
    <article className="mx-auto max-w-2xl rounded-2xl border border-[#dfe1e7] bg-white p-8 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="font-serif text-2xl font-bold text-[#062357] md:text-[28px]">{lesson.title}</h2>
      {metaLine ? (
        <p className="mt-2 text-sm font-medium tracking-[0.02em] text-[#666d80]">{metaLine}</p>
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

export { LessonDrillIntroCard }
