import type { DrillQuestion } from "@/features/student/drills/drill-types"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import type { PracticePassageSummary } from "@/features/student/practice-session/practice-results-list-layout"
import { formatScoreDelta } from "@/features/student/practice-session/practice-results-list-layout"
import type { PracticeSectionKind } from "@/features/student/practice-session/practice-results-summary-panel"
import {
  difficultyLabelFromLevel,
  formatMmSs,
  resolveQuestionResultTags,
  type PracticeDifficultyLabel,
} from "@/features/student/practice-session/practice-results-ui"

export type PracticeQuestionResultMeta = {
  question: DrillQuestion
  number: number
  detail: ExplanationDetailPayload | null
  isCorrect: boolean
  blindReviewCorrect?: boolean
  yourTimeSeconds: number
}

export type PracticePassageQuestionGroup = {
  passage: PracticePassageSummary
  questions: PracticeQuestionResultMeta[]
}

export type PracticeResultsSectionGroup = {
  id: string
  kind: PracticeSectionKind
  sectionTitle: string
  scoreDisplay: string
  blindReviewDisplay: string
  passages: PracticePassageQuestionGroup[]
  questions: PracticeQuestionResultMeta[]
}

function passageDifficulty(questions: PracticeQuestionResultMeta[]): PracticeDifficultyLabel {
  const maxLevel = questions.reduce((max, q) => Math.max(max, q.detail?.difficulty ?? 3), 0)
  return difficultyLabelFromLevel(maxLevel || 3)
}

function passageTiming(questions: PracticeQuestionResultMeta[]) {
  const targetSec = questions.reduce((sum, q) => {
    const label = difficultyLabelFromLevel(q.detail?.difficulty ?? 3)
    if (label === "Hardest" || label === "Hard") return sum + 105
    if (label === "Medium") return sum + 90
    return sum + 75
  }, 0)
  const yourSec = questions.reduce((sum, q) => sum + q.yourTimeSeconds, 0)
  const deltaSec = targetSec - yourSec
  const yourTimeNote =
    deltaSec > 0
      ? `(${formatMmSs(deltaSec)} under)`
      : deltaSec < 0
        ? `(${formatMmSs(-deltaSec)} over)`
        : ""
  const hardest = passageDifficulty(questions)
  return {
    targetTime: formatMmSs(targetSec),
    yourTime: formatMmSs(yourSec),
    yourTimeNote,
    difficulty: hardest,
  }
}

function buildPassageSummary(
  passageNumber: number,
  questions: PracticeQuestionResultMeta[],
): PracticePassageSummary {
  const first = questions[0]
  const detail = first?.detail
  const timing = passageTiming(questions)
  const tags = detail != null ? resolveQuestionResultTags(detail) : []
  return {
    id: detail?.passage.id ?? `passage-${passageNumber}`,
    passageLabel: `P${passageNumber}`,
    title: detail?.passage.title?.trim() || `Passage ${passageNumber}`,
    tags,
    difficulty: timing.difficulty,
    targetTime: timing.targetTime,
    yourTime: timing.yourTime,
    yourTimeNote: timing.yourTimeNote,
  }
}

export function buildPracticeResultsSectionGroups(input: {
  questions: DrillQuestion[]
  answersByQuestion: Map<string, { isCorrect: boolean }>
  blindReviewAnswersByQuestion: Map<string, { isCorrect: boolean }> | null
  detailsByQuestion: Record<string, ExplanationDetailPayload>
  defaultKind: PracticeSectionKind
  fallbackSectionNumber: number | null
  perQuestionSeconds: number
}): PracticeResultsSectionGroup[] {
  const hasBlindReview = input.blindReviewAnswersByQuestion != null
  const grouped = new Map<
    string,
    {
      kind: PracticeSectionKind
      sectionNumber: number | null
      metas: PracticeQuestionResultMeta[]
    }
  >()

  input.questions.forEach((question) => {
    const detail = input.detailsByQuestion[question.id] ?? null
    const kind: PracticeSectionKind =
      detail?.sectionType === "RC" ? "RC" : detail?.sectionType === "LR" ? "LR" : input.defaultKind
    const sectionNumber = detail?.sectionNumber ?? input.fallbackSectionNumber ?? null
    const key = `${kind}-${sectionNumber ?? "drill"}`
    const meta: PracticeQuestionResultMeta = {
      question,
      number: 0,
      detail,
      isCorrect: input.answersByQuestion.get(question.id)?.isCorrect ?? false,
      blindReviewCorrect: hasBlindReview
        ? (input.blindReviewAnswersByQuestion?.get(question.id)?.isCorrect ?? false)
        : undefined,
      yourTimeSeconds: input.perQuestionSeconds,
    }
    const existing = grouped.get(key)
    if (existing) {
      existing.metas.push(meta)
    } else {
      grouped.set(key, { kind, sectionNumber, metas: [meta] })
    }
  })

  return [...grouped.entries()].map(([key, group]) => {
    const numberedMetas = group.metas.map((meta, index) => ({ ...meta, number: index + 1 }))
    const incorrect = numberedMetas.filter((q) => !q.isCorrect).length
    const blindIncorrect = hasBlindReview
      ? numberedMetas.filter((q) => !q.blindReviewCorrect).length
      : 0
    const sectionTitle =
      group.sectionNumber != null ? `Section ${group.sectionNumber}` : group.kind === "LR" ? "Logical Reasoning" : "Reading Comprehension"

    if (group.kind === "RC") {
      const byPassage = new Map<number, PracticeQuestionResultMeta[]>()
      for (const meta of numberedMetas) {
        const passageNumber = meta.detail?.passage.displayNumber ?? 1
        const list = byPassage.get(passageNumber) ?? []
        list.push(meta)
        byPassage.set(passageNumber, list)
      }
      const passages = [...byPassage.entries()]
        .sort(([a], [b]) => a - b)
        .map(([passageNumber, questions]) => ({
          passage: buildPassageSummary(passageNumber, questions),
          questions,
        }))
      return {
        id: key,
        kind: group.kind,
        sectionTitle,
        scoreDisplay: formatScoreDelta(incorrect),
        blindReviewDisplay: formatScoreDelta(blindIncorrect),
        passages,
        questions: [],
      }
    }

    return {
      id: key,
      kind: group.kind,
      sectionTitle,
      scoreDisplay: formatScoreDelta(incorrect),
      blindReviewDisplay: formatScoreDelta(blindIncorrect),
      passages: [],
      questions: numberedMetas,
    }
  })
}
