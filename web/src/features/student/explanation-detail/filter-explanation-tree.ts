import { passagesInQuestionOrder } from "@/features/student/explanation-detail/order-explanation-passages"
import type { ExplanationPrepTestNode } from "@/features/student/explanation-detail/explanation-tree-types"

export function filterPrepTestTreeToQuestionIds(
  tree: ExplanationPrepTestNode,
  questionIds: ReadonlySet<string>,
): ExplanationPrepTestNode | null {
  if (questionIds.size === 0) return null
  const sections = tree.sections
    .map((sec) => ({
      ...sec,
      passages: passagesInQuestionOrder(sec.passages)
        .map((pass) => ({
          ...pass,
          questions: pass.questions.filter((q) => questionIds.has(q.id)),
        }))
        .filter((pass) => pass.questions.length > 0),
    }))
    .filter((sec) => sec.passages.length > 0)
  if (sections.length === 0) return null
  return { ...tree, sections }
}
