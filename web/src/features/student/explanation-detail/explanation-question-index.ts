import {
  mockExplanationPrepTests,
  type ExplanationPassageNode,
  type ExplanationPrepTestNode,
  type ExplanationQuestionNode,
  type ExplanationSectionNode,
} from "@/features/student/lib/mock-explanations-tree"

export type LocatedExplanationQuestion = {
  routeKey: string
  pt: ExplanationPrepTestNode
  sec: ExplanationSectionNode
  pass: ExplanationPassageNode
  q: ExplanationQuestionNode
}

export function buildExplanationQuestionRouteKey(ptId: string, secId: string, passageId: string, questionId: string): string {
  return `${ptId}-${secId}-${passageId}-${questionId}`
}

/** Absolute path for `<Link to={…} />` within the student app. */
export function explanationQuestionDetailHref(ptId: string, secId: string, passageId: string, questionId: string): string {
  return `/app/learn/explanations/q/${buildExplanationQuestionRouteKey(ptId, secId, passageId, questionId)}`
}

export function listExplanationQuestionsInOrder(
  prepTests: ExplanationPrepTestNode[] = mockExplanationPrepTests,
): LocatedExplanationQuestion[] {
  const out: LocatedExplanationQuestion[] = []
  for (const pt of prepTests) {
    for (const sec of pt.sections) {
      for (const pass of sec.passages) {
        for (const q of pass.questions) {
          out.push({
            routeKey: buildExplanationQuestionRouteKey(pt.id, sec.id, pass.id, q.id),
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

export function locateExplanationQuestion(routeKey: string): LocatedExplanationQuestion | null {
  return listExplanationQuestionsInOrder().find((l) => l.routeKey === routeKey) ?? null
}

export function getExplanationQuestionNeighbors(routeKey: string): { prevRouteKey: string | null; nextRouteKey: string | null } {
  const list = listExplanationQuestionsInOrder()
  const i = list.findIndex((l) => l.routeKey === routeKey)
  if (i < 0) return { prevRouteKey: null, nextRouteKey: null }
  return {
    prevRouteKey: i > 0 ? list[i - 1]!.routeKey : null,
    nextRouteKey: i < list.length - 1 ? list[i + 1]!.routeKey : null,
  }
}
