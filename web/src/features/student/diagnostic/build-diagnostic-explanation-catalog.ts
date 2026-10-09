import type { MiniDiagnosticQuestion } from "@data/diagnostics/mini-marketing-types.ts"

import {
  MINI_DIAGNOSTIC_MARKETING_SET,
  SECTION_DIAGNOSTIC_MARKETING_SET,
} from "@/features/guest/diagnostic/mini-diagnostic-content"
import {
  getDiagnosticExplanationQuestionProgress,
  type DiagnosticExplanationProgressMap,
} from "@/features/student/diagnostic/diagnostic-explanation-progress"
import type {
  ExplanationPrepTestListItem,
  ExplanationPrepTestNode,
  ExplanationQuestionNode,
  ExplanationQuestionStatus,
  ExplanationStatusCounts,
} from "@/features/student/explanation-detail/explanation-tree-types"

export const DIAGNOSTIC_EXPLANATION_SET_IDS = {
  mini: "diagnostic-mini",
  section: "diagnostic-section",
} as const

function clampDifficulty(level: number): ExplanationQuestionNode["difficulty"] {
  const n = Math.round(level)
  if (n <= 1) return 1
  if (n === 2) return 2
  if (n === 3) return 3
  if (n === 4) return 4
  return 5
}

function mapQuestion(
  question: MiniDiagnosticQuestion,
  status: ExplanationQuestionStatus = "fresh",
  videoUrlByQuestionId?: ReadonlyMap<string, string>,
): ExplanationQuestionNode {
  const snippet = question.stemText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  return {
    id: question.sourceItemId,
    number: question.questionNumber,
    code: `Q${question.questionNumber}`,
    snippet: snippet.slice(0, 120) || `Question ${question.questionNumber}`,
    topicName: question.questionType || "LR",
    status,
    source: "Diagnostic",
    difficulty: clampDifficulty(question.difficulty),
    hasWrittenExplanation: Boolean(question.explanationHtml?.trim()),
    hasVideo: Boolean(videoUrlByQuestionId?.get(question.sourceItemId)?.trim()),
  }
}

function buildSetTree(args: {
  id: string
  prepTestNumber: string
  rowSubtitle: string
  title: string
  questions: MiniDiagnosticQuestion[]
  progress?: DiagnosticExplanationProgressMap
  videoUrlByQuestionId?: ReadonlyMap<string, string>
}): ExplanationPrepTestNode {
  const questions = args.questions.map((question) =>
    mapQuestion(
      question,
      getDiagnosticExplanationQuestionProgress(args.progress ?? new Map(), question.sourceItemId)
        .status,
      args.videoUrlByQuestionId,
    ),
  )
  return {
    id: args.id,
    prepTestNumber: args.prepTestNumber,
    rowSubtitle: args.rowSubtitle,
    sections: [
      {
        id: `${args.id}-lr`,
        sectionNumber: 1,
        kind: "LR",
        sectionTitle: "Logical Reasoning",
        passages: [
          {
            id: `${args.id}-p1`,
            label: "P1",
            title: args.title,
            snippet: args.title,
            questions,
          },
        ],
      },
    ],
  }
}

function listItemFromTree(
  tree: ExplanationPrepTestNode,
  title: string,
  moduleId: string,
): ExplanationPrepTestListItem {
  const questions = tree.sections.flatMap((sec) => sec.passages.flatMap((pass) => pass.questions))
  return {
    id: tree.id,
    title,
    moduleId,
    prepTestNumber: tree.prepTestNumber,
    questionCount: questions.length,
    explainedCount: questions.filter((q) => q.hasWrittenExplanation).length,
    rowSubtitle: tree.rowSubtitle,
  }
}

/** Catalog trees for Mini + Section diagnostic question banks. */
export function buildDiagnosticExplanationTrees(
  progress?: DiagnosticExplanationProgressMap,
  videoUrlByQuestionId?: ReadonlyMap<string, string>,
): ExplanationPrepTestNode[] {
  return [
    buildSetTree({
      id: DIAGNOSTIC_EXPLANATION_SET_IDS.mini,
      prepTestNumber: "Mini",
      rowSubtitle: "Mini Diagnostic",
      title: "Mini Diagnostic",
      questions: MINI_DIAGNOSTIC_MARKETING_SET.questions,
      progress,
      videoUrlByQuestionId,
    }),
    buildSetTree({
      id: DIAGNOSTIC_EXPLANATION_SET_IDS.section,
      prepTestNumber: "Full",
      rowSubtitle: "Section Diagnostic",
      title: "Section Diagnostic",
      questions: SECTION_DIAGNOSTIC_MARKETING_SET.questions,
      progress,
      videoUrlByQuestionId,
    }),
  ]
}

export function buildDiagnosticExplanationListItems(
  progress?: DiagnosticExplanationProgressMap,
  videoUrlByQuestionId?: ReadonlyMap<string, string>,
): ExplanationPrepTestListItem[] {
  const [mini, section] = buildDiagnosticExplanationTrees(progress, videoUrlByQuestionId)
  return [
    listItemFromTree(mini!, "Mini Diagnostic", MINI_DIAGNOSTIC_MARKETING_SET.moduleId),
    listItemFromTree(section!, "Section Diagnostic", SECTION_DIAGNOSTIC_MARKETING_SET.moduleId),
  ]
}

export function getDiagnosticExplanationTree(
  setId: string,
  progress?: DiagnosticExplanationProgressMap,
  videoUrlByQuestionId?: ReadonlyMap<string, string>,
): ExplanationPrepTestNode | null {
  return (
    buildDiagnosticExplanationTrees(progress, videoUrlByQuestionId).find((tree) => tree.id === setId) ??
    null
  )
}

export function locateDiagnosticExplanationQuestion(
  questionId: string,
  progress?: DiagnosticExplanationProgressMap,
  videoUrlByQuestionId?: ReadonlyMap<string, string>,
): {
  tree: ExplanationPrepTestNode
  question: ExplanationQuestionNode
} | null {
  for (const tree of buildDiagnosticExplanationTrees(progress, videoUrlByQuestionId)) {
    for (const sec of tree.sections) {
      for (const pass of sec.passages) {
        const question = pass.questions.find((q) => q.id === questionId)
        if (question) return { tree, question }
      }
    }
  }
  return null
}

export function listDiagnosticExplanationQuestionIdsInOrder(
  progress?: DiagnosticExplanationProgressMap,
): string[] {
  return buildDiagnosticExplanationTrees(progress).flatMap((tree) =>
    tree.sections.flatMap((sec) => sec.passages.flatMap((pass) => pass.questions.map((q) => q.id))),
  )
}

export function getDiagnosticExplanationNeighbors(questionId: string): {
  prevRouteKey: string | null
  nextRouteKey: string | null
} {
  const ids = listDiagnosticExplanationQuestionIdsInOrder()
  const index = ids.indexOf(questionId)
  if (index < 0) return { prevRouteKey: null, nextRouteKey: null }
  return {
    prevRouteKey: index > 0 ? (ids[index - 1] ?? null) : null,
    nextRouteKey: index < ids.length - 1 ? (ids[index + 1] ?? null) : null,
  }
}

export function countDiagnosticExplanationStatus(
  progress?: DiagnosticExplanationProgressMap,
): ExplanationStatusCounts {
  const trees = buildDiagnosticExplanationTrees(progress)
  const counts: ExplanationStatusCounts = { in_process: 0, fresh: 0, answered: 0, seen: 0 }
  for (const tree of trees) {
    for (const sec of tree.sections) {
      for (const pass of sec.passages) {
        for (const q of pass.questions) {
          if (q.status === "in_process") counts.in_process += 1
          else if (q.status === "answered") counts.answered += 1
          else if (q.status === "seen") counts.seen += 1
          else counts.fresh += 1
        }
      }
    }
  }
  return counts
}
