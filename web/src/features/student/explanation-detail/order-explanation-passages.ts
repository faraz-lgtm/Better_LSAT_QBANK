import type { ExplanationPassageNode, ExplanationQuestionNode } from "@/features/student/explanation-detail/explanation-tree-types"

function firstQuestionNumber(questions: ExplanationQuestionNode[]): number {
  let min = Number.POSITIVE_INFINITY
  for (const q of questions) {
    if (q.number > 0 && q.number < min) min = q.number
  }
  return Number.isFinite(min) ? min : Number.MAX_SAFE_INTEGER
}

function rewritePassageIndexInCode(code: string, label: string): string {
  if (/^P\d+$/i.test(label)) return code.replace(/\.P\d+\.Q/i, `.${label}.Q`)
  if (/^G\d+$/i.test(label)) return code.replace(/\.G\d+\.Q/i, `.${label}.Q`)
  return code
}

/** Display order: Passage 1 holds the lowest question numbers, then Passage 2, and so on. */
export function passagesInQuestionOrder(passages: ExplanationPassageNode[]): ExplanationPassageNode[] {
  const ordered = [...passages].sort((a, b) => firstQuestionNumber(a.questions) - firstQuestionNumber(b.questions))
  return ordered.map((pass, i) => {
    const index = i + 1
    const isGame = /^G\d+$/i.test(pass.label)
    const isPassage = /^P\d+$/i.test(pass.label)
    if (!isGame && !isPassage) return pass

    const labelPrefix = isGame ? "G" : "P"
    const titlePrefix = isGame ? "Game" : "Passage"
    const label = `${labelPrefix}${index}`
    const genericTitle = /^(Passage|Game) \d+$/i.test(pass.title.trim())
    const questions = [...pass.questions]
      .sort((a, b) => a.number - b.number)
      .map((q) => ({ ...q, code: rewritePassageIndexInCode(q.code, label) }))

    return {
      ...pass,
      label,
      title: genericTitle ? `${titlePrefix} ${index}` : pass.title,
      questions,
    }
  })
}
