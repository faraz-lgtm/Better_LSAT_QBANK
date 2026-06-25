import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import {
  PT_RESULTS_BY_SECTION_PANEL_CLASS,
  PT_RESULTS_SUMMARY_ROW_CLASS,
} from "@/features/student/analytics/prep-test-results-section-styles"
import { formatMmSs } from "@/features/student/practice-session/practice-results-ui"
import { PrepTestSectionResultCard } from "@/features/student/practice-session/prep-test-section-result-card"

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
    <section className={PT_RESULTS_SUMMARY_ROW_CLASS}>
      <div className="flex w-full shrink-0 flex-col gap-[24px] lg:w-[290px]">
        <div className="flex w-full flex-col gap-[5px] rounded-[16px] bg-[#0d47a1] p-[24px]">
          <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#edf3ff]">YOUR SCORE</p>
          <p className="text-[48px] font-extrabold leading-[1.2] text-white">
            {scaledScore != null ? scaledScore : `${rawScore}/${questionCount}`}
          </p>
          <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
            {rawScore} CORRECT ({incorrect > 0 ? `-${incorrect}` : "0"})
          </p>
          {percentile != null ? (
            <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
              PERCENTILE: {percentile % 1 === 0 ? percentile : percentile.toFixed(1)}
            </p>
          ) : (
            <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
              TIME: {formatMmSs(elapsedSeconds)}
            </p>
          )}
        </div>
        {showBlindReview ? (
          <div className="w-full rounded-[16px] bg-[#f6f8fa] p-[24px]">
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col gap-[5px] font-bold text-[#062357]">
                <p className="text-xs font-bold leading-[1.5] tracking-[0.24px]">YOUR PREDICTION</p>
                <p className="text-2xl font-bold leading-[1.3]">{prediction ?? "—"}</p>
              </div>
              <div className="h-[32px] w-[2px] shrink-0 bg-[#dfe1e7]" aria-hidden />
              <div className="flex flex-col gap-[5px] font-bold text-[#df1c41]">
                <p className="text-xs font-bold leading-[1.5] tracking-[0.24px]">BLIND REVIEW</p>
                <p className="text-2xl font-bold leading-[1.3]">{blindReviewScore ?? "—"}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className={PT_RESULTS_BY_SECTION_PANEL_CLASS}>
        <h2 className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#062357]">RESULTS BY SECTION</h2>
        <div className="flex min-w-0 gap-[7px] overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section) => (
            <PrepTestSectionResultCard
              key={section.id}
              kind={section.kind}
              longName={section.longName}
              sectionLabel={section.sectionLabel}
              scoreDelta={section.scoreDelta}
              questionRows={section.questionRows}
              accuracyPct={section.accuracyPct}
            />
          ))}
        </div>
    </section>
  )
}

export { PracticeResultsSummaryPanel, buildPracticeSectionSummaries }
