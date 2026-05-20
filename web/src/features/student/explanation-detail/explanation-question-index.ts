import {
  getCachedExplanationPrepTestTree,
  listCachedExplanationPrepTestTrees,
} from "@/features/student/explanation-detail/explanation-tree-cache"
import type {
  ExplanationPassageNode,
  ExplanationPrepTestNode,
  ExplanationQuestionNode,
  ExplanationSectionNode,
} from "@/features/student/explanation-detail/explanation-tree-types"

export type LocatedExplanationQuestion = {
  routeKey: string
  pt: ExplanationPrepTestNode
  sec: ExplanationSectionNode
  pass: ExplanationPassageNode
  q: ExplanationQuestionNode
}

/** Absolute path for `<Link to={…} />` within the student app. */
export function explanationQuestionDetailHref(questionId: string): string {
  return `/app/learn/explanations/q/${encodeURIComponent(questionId)}`
}

export function listExplanationQuestionsInOrder(
  prepTests: ExplanationPrepTestNode[] = listCachedExplanationPrepTestTrees(),
): LocatedExplanationQuestion[] {
  const out: LocatedExplanationQuestion[] = []
  for (const pt of prepTests) {
    for (const sec of pt.sections) {
      for (const pass of sec.passages) {
        for (const q of pass.questions) {
          out.push({
            routeKey: q.id,
            pt,
            sec,
            pass,
            q,
          })
        }
      }
    }
  }
  return out
}

export function locateExplanationQuestion(questionId: string): LocatedExplanationQuestion | null {
  return listExplanationQuestionsInOrder().find((l) => l.q.id === questionId) ?? null
}

/** Resolve location when only one prep test tree is cached (detail deep-link). */
export function locateExplanationQuestionInPrepTest(
  prepTestId: string,
  questionId: string,
): LocatedExplanationQuestion | null {
  const pt = getCachedExplanationPrepTestTree(prepTestId)
  if (!pt) return locateExplanationQuestion(questionId)
  return listExplanationQuestionsInOrder([pt]).find((l) => l.q.id === questionId) ?? null
}

export function getExplanationQuestionNeighbors(questionId: string): {
  prevRouteKey: string | null
  nextRouteKey: string | null
} {
  const list = listExplanationQuestionsInOrder()
  const i = list.findIndex((l) => l.q.id === questionId)
  if (i < 0) return { prevRouteKey: null, nextRouteKey: null }
  return {
    prevRouteKey: i > 0 ? list[i - 1]!.q.id : null,
    nextRouteKey: i < list.length - 1 ? list[i + 1]!.q.id : null,
  }
}
