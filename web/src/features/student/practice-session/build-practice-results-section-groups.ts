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
import { isPracticeAnswerUnanswered } from "@/features/student/practice-session/practice-result-outcome-icon"
import { passageNavGroupKey } from "@/features/student/practice-session/question-nav-passage-breaks"

export type PracticeQuestionResultMeta = {
  question: DrillQuestion
  number: number
  detail: ExplanationDetailPayload | null
  isCorrect: boolean
  isUnanswered: boolean
  selectedAnswer: string | null
  blindReviewCorrect?: boolean
  blindReviewUnanswered?: boolean
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

function rcPassageGroupKey(meta: PracticeQuestionResultMeta): string {
  const fromQuestion = passageNavGroupKey({
    passage: meta.question.passage,
    sourceGroupId: meta.question.sourceGroupId,
  })
  if (fromQuestion) return fromQuestion
  const fromDetail = passageNavGroupKey({
    passage: meta.detail?.passage ?? null,
  })
  if (fromDetail) return fromDetail
  const displayNumber = meta.question.passage?.displayNumber ?? meta.detail?.passage.displayNumber
  if (displayNumber != null && displayNumber > 0) return `dn:${displayNumber}`
  return "passage-fallback"
}

function rcPassageTitle(passageNumber: number, questions: PracticeQuestionResultMeta[]): string {
  const raw =
    questions[0]?.detail?.passage.title?.trim() ||
    questions[0]?.question.passage?.title?.trim() ||
    ""
  if (!raw || /^passage\s*\d+$/i.test(raw)) return `Passage ${passageNumber}`
  return raw
}

function buildPassageSummary(
  passageNumber: number,
  questions: PracticeQuestionResultMeta[],
  groupKey: string,
): PracticePassageSummary {
  const first = questions[0]
  const detail = first?.detail
  const timing = passageTiming(questions)
  const tags = detail != null ? resolveQuestionResultTags(detail) : []
  return {
    id: `${groupKey}-${passageNumber}`,
    passageLabel: `P${passageNumber}`,
    title: rcPassageTitle(passageNumber, questions),
    tags,
    difficulty: timing.difficulty,
    targetTime: timing.targetTime,
    yourTime: timing.yourTime,
    yourTimeNote: timing.yourTimeNote,
  }
}

export function buildPracticeResultsSectionGroups(input: {
  questions: DrillQuestion[]
  answersByQuestion: Map<string, { selectedAnswer: string; isCorrect: boolean }>
  blindReviewAnswersByQuestion: Map<string, { selectedAnswer: string; isCorrect: boolean }> | null
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
    const answer = input.answersByQuestion.get(question.id)
    const isUnanswered = isPracticeAnswerUnanswered(answer)
    const blindReviewAnswer = hasBlindReview
      ? input.blindReviewAnswersByQuestion?.get(question.id)
      : undefined
    const blindReviewUnanswered = hasBlindReview
      ? isPracticeAnswerUnanswered(blindReviewAnswer)
      : false
    const meta: PracticeQuestionResultMeta = {
      question,
      number: 0,
      detail,
      isUnanswered,
      isCorrect: isUnanswered ? false : (answer?.isCorrect ?? false),
      selectedAnswer: answer?.selectedAnswer?.trim() ? answer.selectedAnswer : null,
      blindReviewUnanswered: hasBlindReview ? blindReviewUnanswered : undefined,
      blindReviewCorrect: hasBlindReview
        ? blindReviewUnanswered
          ? false
          : (blindReviewAnswer?.isCorrect ?? false)
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
    const incorrect = numberedMetas.filter((q) => !q.isCorrect && !q.isUnanswered).length
    const unanswered = numberedMetas.filter((q) => q.isUnanswered).length
    const blindIncorrect = hasBlindReview
      ? numberedMetas.filter((q) => q.blindReviewUnanswered || !q.blindReviewCorrect).length
      : 0
    const scoreDelta = formatScoreDelta(incorrect + unanswered)
    const sectionTitle =
      group.sectionNumber != null ? `Section ${group.sectionNumber}` : group.kind === "LR" ? "Logical Reasoning" : "Reading Comprehension"

    if (group.kind === "RC") {
      const byPassage = new Map<string, PracticeQuestionResultMeta[]>()
      const passageOrder: string[] = []
      for (const meta of numberedMetas) {
        const key = rcPassageGroupKey(meta)
        const list = byPassage.get(key)
        if (list) {
          list.push(meta)
        } else {
          passageOrder.push(key)
          byPassage.set(key, [meta])
        }
      }
      const passages = passageOrder.map((key, index) => {
        const questions = byPassage.get(key) ?? []
        const passageNumber = index + 1
        return {
          passage: buildPassageSummary(passageNumber, questions, key),
          questions,
        }
      })
      return {
        id: key,
        kind: group.kind,
        sectionTitle,
        scoreDisplay: scoreDelta,
        blindReviewDisplay: formatScoreDelta(blindIncorrect),
        passages,
        questions: [],
      }
    }

    return {
      id: key,
      kind: group.kind,
      sectionTitle,
      scoreDisplay: scoreDelta,
      blindReviewDisplay: formatScoreDelta(blindIncorrect),
      passages: [],
      questions: numberedMetas,
    }
  })
}
