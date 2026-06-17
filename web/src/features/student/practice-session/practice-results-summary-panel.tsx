import { CheckCircle2, XCircle } from "lucide-react"

import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { formatMmSs } from "@/features/student/practice-session/practice-results-ui"

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

const SECTION_BADGE: Record<PracticeSectionKind, { bg: string; text: string; short: string }> = {
  LR: { bg: "#fffbeb", text: "#ae8b00", short: "LR" },
  RC: { bg: "#fff3ea", text: "#ff9d51", short: "RC" },
}

function QuestionOutcomeIcon({ status }: { status: PracticeQuestionOutcome }) {
  if (status === "correct") {
    return <CheckCircle2 className="size-4 shrink-0 text-[#00d492]" aria-hidden />
  }
  return <XCircle className="size-4 shrink-0 text-[#df1c41]" aria-hidden />
}

function SectionResultCard({ section }: { section: PracticeSectionResultSummary }) {
  const badge = SECTION_BADGE[section.kind]
  return (
    <article className="flex w-[212px] shrink-0 flex-col gap-3 rounded-2xl border border-[#f6f8fa] bg-white p-4 shadow-[0px_1px_1px_rgba(13,13,18,0.04)]">
      <div className="flex h-8 items-center gap-1.5">
        <div
          className="flex size-6 items-center justify-center rounded-lg text-xs font-extrabold leading-[1.3]"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {badge.short}
        </div>
        <p className="text-[10px] font-bold leading-[1.5] tracking-[0.02em] text-[#062357]">{section.longName}</p>
      </div>
      <div className="flex h-8 items-center justify-between gap-2">
        <p className="text-xs font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">{section.sectionLabel}</p>
        <p className="text-2xl font-bold leading-[1.3] text-[#041a44]">{section.scoreDelta}</p>
      </div>
      <div className="flex flex-col gap-1">
        {section.questionRows.map((row, ri) => (
          <div key={ri} className="flex flex-wrap gap-1">
            {row.map((cell, ci) => (
              <QuestionOutcomeIcon key={`${ri}-${ci}`} status={cell} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex h-5 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-lg bg-[#f6f8fa]">
          <div className="h-full rounded-lg bg-[#0d47a1]" style={{ width: `${section.accuracyPct}%` }} />
        </div>
        <p className="w-10 text-right text-sm font-medium leading-[1.5] tracking-[0.02em] text-[#0d47a1]">
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
    <section className="mb-6 flex w-full flex-col gap-6 rounded-3xl border border-[#dfe1e7] bg-white p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[290px]">
          <div className="flex flex-col gap-1.5 rounded-2xl bg-[#0d47a1] p-6">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#edf3ff]">YOUR SCORE</p>
            <p className="text-5xl font-extrabold leading-[1.2] text-white">
              {scaledScore != null ? scaledScore : `${rawScore}/${questionCount}`}
            </p>
            <p className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#edf3ff]">
              {rawScore} CORRECT ({incorrect > 0 ? `-${incorrect}` : "0"})
            </p>
            {percentile != null ? (
              <p className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#edf3ff]">
                PERCENTILE: {percentile % 1 === 0 ? percentile : percentile.toFixed(1)}
              </p>
            ) : (
              <p className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#edf3ff]">
                TIME: {formatMmSs(elapsedSeconds)}
              </p>
            )}
          </div>
          {showBlindReview ? (
            <div className="rounded-2xl bg-[#f6f8fa] p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5 font-bold text-[#062357]">
                  <p className="text-xs font-bold leading-[1.5] tracking-[0.02em]">YOUR PREDICTION</p>
                  <p className="text-2xl font-bold leading-[1.3]">{prediction ?? "—"}</p>
                </div>
                <div className="h-8 w-0.5 shrink-0 bg-[#dfe1e7]" aria-hidden />
                <div className="flex flex-col gap-1.5 font-bold text-[#df1c41]">
                  <p className="text-xs font-bold leading-[1.5] tracking-[0.02em]">BLIND REVIEW</p>
                  <p className="text-2xl font-bold leading-[1.3]">{blindReviewScore ?? "—"}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex min-h-[200px] min-w-0 flex-1 flex-col gap-[18px] rounded-2xl bg-[#f6f8fa] p-6 lg:min-h-[316px]">
          <h2 className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">RESULTS BY SECTION</h2>
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((section) => (
              <SectionResultCard key={section.id} section={section} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export { PracticeResultsSummaryPanel, buildPracticeSectionSummaries }
