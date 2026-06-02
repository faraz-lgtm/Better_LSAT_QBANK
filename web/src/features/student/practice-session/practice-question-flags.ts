export function parseFlaggedQuestionIds(metadata: Record<string, unknown> | undefined): string[] {
  const raw = metadata?.flaggedQuestionIds
  if (!Array.isArray(raw)) return []
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0)
}

export function toggleFlaggedId(flaggedIds: string[], questionId: string): string[] {
  const set = new Set(flaggedIds)
  if (set.has(questionId)) set.delete(questionId)
  else set.add(questionId)
  return [...set]
}
