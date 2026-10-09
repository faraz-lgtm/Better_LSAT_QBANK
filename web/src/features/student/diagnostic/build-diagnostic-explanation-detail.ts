import {
  getDiagnosticStimulusAnalysisHtml,
  resolveDiagnosticSourceQuestion,
} from "@/features/guest/diagnostic/mini-diagnostic-content"
import { parseAnswerChoiceExplanationMap, splitDiagnosticExplanationHtml } from "@/features/guest/diagnostic/split-diagnostic-explanation-html"
import { buildDiagnosticAnswerPopularity } from "@/features/guest/diagnostic/diagnostic-answer-popularity"
import {
  getDiagnosticExplanationNeighbors,
  locateDiagnosticExplanationQuestion,
} from "@/features/student/diagnostic/build-diagnostic-explanation-catalog"
import {
  buildDiagnosticExplanationHistoryRows,
  getDiagnosticExplanationQuestionProgress,
  type DiagnosticExplanationProgressMap,
} from "@/features/student/diagnostic/diagnostic-explanation-progress"
import type { GuestDiagnosticResult } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import type { LocatedExplanationQuestion } from "@/features/student/explanation-detail/explanation-question-index"
import { buildExplanationQuestionDetailView } from "@/features/student/explanation-detail/build-explanation-detail-view"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"

/** Resolve marketing question — re-export for pages/tests. */
export { resolveDiagnosticSourceQuestion }

export function buildDiagnosticExplanationLocation(
  questionId: string,
  progress?: DiagnosticExplanationProgressMap,
): LocatedExplanationQuestion | null {
  const located = locateDiagnosticExplanationQuestion(questionId, progress)
  if (!located) return null
  const sec = located.tree.sections[0]
  const pass = sec?.passages[0]
  if (!sec || !pass) return null
  return {
    routeKey: questionId,
    pt: located.tree,
    sec,
    pass,
    q: located.question,
  }
}

export function buildDiagnosticExplanationDetailPayload(
  questionId: string,
  progress?: DiagnosticExplanationProgressMap,
  videoUrl: string | null = null,
  videoAspectRatio: string | null = null,
): ExplanationDetailPayload | null {
  const source = resolveDiagnosticSourceQuestion(questionId)
  const loc = buildDiagnosticExplanationLocation(questionId, progress)
  if (!source || !loc) return null

  const { stimulusAnalysisHtml, answerChoiceAnalysisHtml } = splitDiagnosticExplanationHtml(
    source.explanationHtml,
  )
  const choiceMap = parseAnswerChoiceExplanationMap(answerChoiceAnalysisHtml)
  const letters = source.choices.map((c) => c.letter)
  const popularity = buildDiagnosticAnswerPopularity(questionId, source.correctAnswer, letters)
  const { userSelectedLetter } = getDiagnosticExplanationQuestionProgress(
    progress ?? new Map(),
    questionId,
  )
  const resolvedVideoUrl = videoUrl?.trim() || null
  const resolvedAspectRatio = videoAspectRatio?.trim() || null

  return {
    questionId,
    prepTestId: loc.pt.id,
    prepTestTitle: loc.pass.title,
    prepTestNumber: loc.pt.prepTestNumber,
    sectionId: loc.sec.id,
    sectionType: loc.sec.kind,
    sectionNumber: loc.sec.sectionNumber,
    questionNumber: source.questionNumber,
    topicName: source.questionType || "Logical Reasoning",
    tags: source.questionType ? ["LR", source.questionType] : ["LR"],
    explanationHtml: stimulusAnalysisHtml.trim() || source.explanationHtml || null,
    videoUrl: resolvedVideoUrl,
    videoAspectRatio: resolvedAspectRatio,
    stimulusText: source.stimulusText,
    stemText: source.stemText,
    choices: source.choices.map((choice, index) => ({
      id: choice.letter,
      index: index + 1,
      text: choice.text,
      explanationHtml: choiceMap[choice.letter] ?? choice.explanation ?? null,
    })),
    correctChoiceId: source.correctAnswer,
    passage: {
      id: loc.pass.id,
      displayNumber: 1,
      title: loc.pass.title,
      body: source.stimulusText?.trim() || "",
    },
    passageAnalysis: null,
    answerPopularity: popularity,
    answerPopularityTotal: popularity.reduce((sum, row) => sum + row.count, 0),
    userSelectedLetter,
    difficulty: source.difficulty,
  }
}

export function buildDiagnosticExplanationQuestionDetailView(
  questionId: string,
  progress?: DiagnosticExplanationProgressMap,
  attempts: readonly GuestDiagnosticResult[] = [],
  videoUrl: string | null = null,
  videoAspectRatio: string | null = null,
): ExplanationQuestionDetailView | null {
  const loc = buildDiagnosticExplanationLocation(questionId, progress)
  const detail = buildDiagnosticExplanationDetailPayload(
    questionId,
    progress,
    videoUrl,
    videoAspectRatio,
  )
  if (!loc || !detail) return null

  const view = buildExplanationQuestionDetailView(loc, detail)
  const neighbors = getDiagnosticExplanationNeighbors(questionId)
  const stimulusOnly = getDiagnosticStimulusAnalysisHtml(questionId)
  const { yourTimeSeconds } = getDiagnosticExplanationQuestionProgress(
    progress ?? new Map(),
    questionId,
  )

  return {
    ...view,
    headingCode: `${loc.pass.title} · Q${view.questionNumber}`,
    subtitleTrail: `${loc.pass.title} - Question ${view.questionNumber}`,
    neighbors,
    questionExplanationHtml: stimulusOnly?.trim() || view.questionExplanationHtml,
    analytics: {
      ...view.analytics,
      yourTimeSeconds,
      history: buildDiagnosticExplanationHistoryRows(questionId, attempts),
    },
  }
}
