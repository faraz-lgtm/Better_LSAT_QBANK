/** Citation on the explanations tree, e.g. PT158.S1.P1.Q1 */
export function explanationListQuestionLabel(question: { code?: string | null; number: number }): string {
  const code = question.code?.trim()
  if (!code) return `Q${question.number}`
  return code.replace(/\.LR(?=\.Q\d+$)/i, "")
}
