/** Matches references like PT133.S2.Q5 or PT 133 S2 Q5 */
const PT_QUESTION_REF = /PT\s*0*(\d+)\s*[.\s]*S\s*(\d+)\s*[.\s]*Q\s*(\d+)/i

export function extractPrepTestQuestionRef(...sources: Array<string | null | undefined>): string | null {
  for (const raw of sources) {
    const text = raw?.trim()
    if (!text) continue
    const match = text.match(PT_QUESTION_REF)
    if (match) {
      const pt = match[1]!
      const section = match[2]!
      const question = match[3]!
      return `PT${pt}.S${section}.Q${question}`
    }
  }
  return null
}
