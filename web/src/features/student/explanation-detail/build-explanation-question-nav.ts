import {
  passagesInQuestionOrder,
  shouldFlattenExplanationPassages,
} from "@/features/student/explanation-detail/order-explanation-passages"
import type {
  ExplanationPrepTestNode,
  ExplanationQuestionStatus,
} from "@/features/student/explanation-detail/explanation-tree-types"

export type ExplanationQuestionNavItem = {
  id: string
  number: number
  status: ExplanationQuestionStatus
}

export type ExplanationQuestionNavPassage = {
  key: string
  /** e.g. "PASSAGE 1" / "GAME 1"; null when LR is flattened under the section. */
  heading: string | null
  questions: ExplanationQuestionNavItem[]
}

export type ExplanationQuestionNavSection = {
  key: string
  /** e.g. "SECTION 1 · RC" */
  heading: string
  passages: ExplanationQuestionNavPassage[]
}

function passageHeading(label: string, title: string, index: number): string {
  if (/^G\d+$/i.test(label)) return `GAME ${index}`
  if (/^P\d+$/i.test(label)) return `PASSAGE ${index}`
  const gameMatch = /Game\s+(\d+)/i.exec(title)
  if (gameMatch) return `GAME ${gameMatch[1]}`
  const passageMatch = /Passage\s+(\d+)/i.exec(title)
  if (passageMatch) return `PASSAGE ${passageMatch[1]}`
  return `PASSAGE ${index}`
}

/** Full PrepTest question jump list — sections → passages → questions (7Sage-style). */
export function buildExplanationQuestionNav(
  prepTest: Pick<ExplanationPrepTestNode, "sections">,
): ExplanationQuestionNavSection[] {
  return prepTest.sections.map((sec) => {
    const flatten = shouldFlattenExplanationPassages(sec)
    const orderedPassages = passagesInQuestionOrder(sec.passages)

    const passages: ExplanationQuestionNavPassage[] = flatten
      ? [
          {
            key: `${sec.id}-flat`,
            heading: null,
            questions: orderedPassages.flatMap((pass) =>
              [...pass.questions]
                .sort((a, b) => a.number - b.number)
                .map((q) => ({ id: q.id, number: q.number, status: q.status })),
            ),
          },
        ]
      : orderedPassages.map((pass, i) => ({
          key: pass.id,
          heading: passageHeading(pass.label, pass.title, i + 1),
          questions: [...pass.questions]
            .sort((a, b) => a.number - b.number)
            .map((q) => ({ id: q.id, number: q.number, status: q.status })),
        }))

    return {
      key: sec.id,
      heading: `SECTION ${sec.sectionNumber} · ${sec.kind}`,
      passages,
    }
  })
}
