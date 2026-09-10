type QuestionWithPassage = {
  passage?: { id: string } | null
  sourceGroupId?: string | null
}

function passageNavGroupKey(question: QuestionWithPassage): string | null {
  const passageId = question.passage?.id?.trim()
  // LR mapper uses `lr-{sectionId}` for every stimulus. Ignore source_group_id so
  // mixed-section LR drills don't get RC-style dividers between LSAC groups.
  if (passageId?.startsWith("lr-")) return `p:${passageId}`
  const sourceGroupId = question.sourceGroupId?.trim()
  if (sourceGroupId) return `sg:${sourceGroupId}`
  return passageId ? `p:${passageId}` : null
}

/** 0-based indices after which a LawHub-style passage divider should appear. */
function passageBreakAfterIndices(
  questions: ReadonlyArray<QuestionWithPassage>,
): ReadonlySet<number> {
  const keys = questions.map(passageNavGroupKey)
  const groupSizes = new Map<string, number>()
  for (const key of keys) {
    if (key == null) continue
    groupSizes.set(key, (groupSizes.get(key) ?? 0) + 1)
  }

  const breaks = new Set<number>()
  for (let i = 0; i < questions.length - 1; i += 1) {
    const currentKey = keys[i]
    const nextKey = keys[i + 1]
    if (currentKey == null || nextKey == null || currentKey === nextKey) continue
    const currentSize = groupSizes.get(currentKey) ?? 0
    const nextSize = groupSizes.get(nextKey) ?? 0
    // LR stimuli are one question per "passage"; don't draw RC-style dividers between them.
    if (currentSize < 2 && nextSize < 2) continue
    breaks.add(i)
  }
  return breaks
}

export { passageBreakAfterIndices, passageNavGroupKey }
export type { QuestionWithPassage }
