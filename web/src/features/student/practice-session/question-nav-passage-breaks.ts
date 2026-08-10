type QuestionWithPassage = {
  passage?: { id: string } | null
  sourceGroupId?: string | null
}

function passageNavGroupKey(question: QuestionWithPassage): string | null {
  const sourceGroupId = question.sourceGroupId?.trim()
  if (sourceGroupId) return `sg:${sourceGroupId}`
  const passageId = question.passage?.id?.trim()
  return passageId ? `p:${passageId}` : null
}

/** 0-based indices after which a LawHub-style passage divider should appear. */
function passageBreakAfterIndices(
  questions: ReadonlyArray<QuestionWithPassage>,
): ReadonlySet<number> {
  const breaks = new Set<number>()
  for (let i = 0; i < questions.length - 1; i += 1) {
    const currentKey = passageNavGroupKey(questions[i]!)
    const nextKey = passageNavGroupKey(questions[i + 1]!)
    if (currentKey != null && nextKey != null && currentKey !== nextKey) {
      breaks.add(i)
    }
  }
  return breaks
}

export { passageBreakAfterIndices, passageNavGroupKey }
export type { QuestionWithPassage }
