import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { formatMmSs } from "@/features/student/practice-session/practice-results-ui"
import { PracticeResultOutcomeIcon } from "@/features/student/practice-session/practice-result-outcome-icon"

export type PracticeSectionKind = "LR" | "RC"
export type PracticeQuestionOutcome = "correct" | "incorrect"

export type PracticeSectionResultSummary = {
  id: string
  kind: PracticeSectionKind
  longName: string
  sectionLabel: string
  scoreDelta: number
  questionRows: PracticeQuestionOutcome[][]
  accuracyPct: number
}

const SECTION_BADGE: Record<PracticeSectionKind, { bg: string; text: string; border: string; short: string }> = {
  LR: { bg: "#eafff4", text: "#00bc54", border: "#00bc54", short: "LR" },
  RC: { bg: "#e5fdff", text: "#0bbcc9", border: "#0bbcc9", short: "RC" },
}

function QuestionOutcomeIcon({ status }: { status: PracticeQuestionOutcome }) {
  return (
    <PracticeResultOutcomeIcon
      correct={status === "correct"}
      variant="filled"
      className="size-6 shrink-0"
    />
  )
}

function SectionResultCard({ section }: { section: PracticeSectionResultSummary }) {
  const badge = SECTION_BADGE[section.kind]

  return (
    <article className="flex w-[220px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white p-5 shadow-[0px_1px_1px_rgba(13,13,18,0.04)]">
      <div className="flex items-center gap-2">
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-extrabold leading-none"
          style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
        >
          {badge.short}
        </div>
        <p className="min-w-0 truncate text-sm font-bold leading-[1.35] text-[#062357]">{section.longName}</p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-sm font-semibold leading-none text-[#062357]">{section.sectionLabel}</p>
        <p className="text-2xl font-bold leading-none text-[#041a44]">{section.scoreDelta}</p>
      </div>

      <div className="mt-4 flex min-h-[72px] flex-col justify-center gap-2">
        {section.questionRows.map((row, ri) => (
          <div key={ri} className="flex flex-wrap gap-2">
            {row.map((cell, ci) => (
              <QuestionOutcomeIcon key={`${ri}-${ci}`} status={cell} />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#edf3ff]">
          <div className="h-full rounded-full bg-[#0d47a1]" style={{ width: `${section.accuracyPct}%` }} />
        </div>
        <p className="w-11 shrink-0 text-right text-sm font-semibold leading-none text-[#0d47a1]">
          {section.accuracyPct}%
        </p>
      </div>
    </article>
  )
}

function buildPracticeSectionSummaries(input: {
  questionIds: string[]
  answersByQuestion: Map<string, { isCorrect: boolean }>
  detailsByQuestion: Record<string, ExplanationDetailPayload>
  defaultKind: PracticeSectionKind
  fallbackSectionNumber?: number | null
}): PracticeSectionResultSummary[] {
  const grouped = new Map<
    string,
    { kind: PracticeSectionKind; sectionNumber: number | null; ids: string[] }
  >()

  for (const questionId of input.questionIds) {
    const detail = input.detailsByQuestion[questionId]
    const kind: PracticeSectionKind =
      detail?.sectionType === "RC" ? "RC" : detail?.sectionType === "LR" ? "LR" : input.defaultKind
    const sectionNumber = detail?.sectionNumber ?? input.fallbackSectionNumber ?? null
    const key = `${kind}-${sectionNumber ?? "drill"}`
    const existing = grouped.get(key)
    if (existing) {
      existing.ids.push(questionId)
    } else {
      grouped.set(key, { kind, sectionNumber, ids: [questionId] })
    }
  }

  return [...grouped.entries()].map(([key, group]) => {
    const statuses: PracticeQuestionOutcome[] = group.ids.map((id) =>
      input.answersByQuestion.get(id)?.isCorrect ? "correct" : "incorrect",
    )
    const correct = statuses.filter((s) => s === "correct").length
    const total = statuses.length
    const incorrect = total - correct
    const questionRows: PracticeQuestionOutcome[][] = []
    for (let i = 0; i < statuses.length; i += 7) {
      questionRows.push(statuses.slice(i, i + 7))
    }
    return {
      id: key,
      kind: group.kind,
      longName: group.kind === "LR" ? "Logical Reasoning" : "Reading Comprehension",
      sectionLabel: group.sectionNumber != null ? `Section ${group.sectionNumber}` : "Drill",
      scoreDelta: -incorrect,
      questionRows,
      accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
    }
  })
}

type PracticeResultsSummaryPanelProps = {
  rawScore: number
  questionCount: number
  elapsedSeconds: number
  sections: PracticeSectionResultSummary[]
  scaledScore?: number | null
  percentile?: number | null
  prediction?: number | null
  blindReviewScore?: number | null
}

function PracticeResultsSummaryPanel({
  rawScore,
  questionCount,
  elapsedSeconds,
  sections,
  scaledScore = null,
  percentile = null,
  prediction = null,
  blindReviewScore = null,
}: PracticeResultsSummaryPanelProps) {
  const incorrect = Math.max(0, questionCount - rawScore)
  const showBlindReview = prediction != null || blindReviewScore != null

  return (
    <section className="mb-6 w-full rounded-[20px] border border-[#dfe1e7] bg-white p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[290px]">
          <div className="flex flex-col gap-3 rounded-[20px] bg-[#0d47a1] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24px] text-[#edf3ff]">YOUR SCORE</p>
            <p className="text-[48px] font-bold leading-[1.15] text-white">
              {scaledScore != null ? scaledScore : `${rawScore}/${questionCount}`}
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.02em] text-[#edf3ff]">
              {rawScore} CORRECT ({incorrect > 0 ? `-${incorrect}` : "0"})
            </p>
            {percentile != null ? (
              <p className="text-sm font-semibold uppercase tracking-[0.02em] text-[#edf3ff]">
                PERCENTILE: {percentile % 1 === 0 ? percentile : percentile.toFixed(1)}
              </p>
            ) : (
              <p className="text-sm font-semibold uppercase tracking-[0.02em] text-[#edf3ff]">
                TIME: {formatMmSs(elapsedSeconds)}
              </p>
            )}
          </div>
          {showBlindReview ? (
            <div className="rounded-[20px] bg-[#f6f8fa] p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2 font-bold text-[#062357]">
                  <p className="text-xs font-bold uppercase tracking-[0.24px]">YOUR PREDICTION</p>
                  <p className="text-[28px] font-bold leading-none">{prediction ?? "—"}</p>
                </div>
                <div className="h-10 w-px shrink-0 bg-[#dfe1e7]" aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col gap-2 font-bold text-[#df1c41]">
                  <p className="text-xs font-bold uppercase tracking-[0.24px]">BLIND REVIEW</p>
                  <p className="text-[28px] font-bold leading-none">{blindReviewScore ?? "—"}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex min-h-[280px] min-w-0 flex-1 flex-col gap-5 overflow-hidden rounded-[20px] bg-[#f6f8fa] p-6 lg:min-h-[316px]">
          <h2 className="text-xs font-semibold uppercase tracking-[0.24px] text-[#062357]">RESULTS BY SECTION</h2>
          <div className="-mx-1 min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full gap-4 pe-2">
              {sections.map((section) => (
                <SectionResultCard key={section.id} section={section} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { PracticeResultsSummaryPanel, buildPracticeSectionSummaries }
