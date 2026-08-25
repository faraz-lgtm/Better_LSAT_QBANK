/** Parses header labels like "1 of 26" into 1-based question progress. */
function parseQuestionProgressLabel(
  label: string | null | undefined,
): { current: number; total: number } | null {
  if (!label) return null
  const match = /^(\d+)\s+of\s+(\d+)$/i.exec(label.trim())
  if (!match) return null
  const current = Number(match[1])
  const total = Number(match[2])
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) return null
  return { current: Math.min(Math.max(current, 0), total), total }
}

/** Figma `20268:105580` — header bar fill is exam position, not remaining time. */
function resolveExamProgress(options: {
  current?: number
  total?: number
  label?: string | null
}): { current: number; total: number; ratio: number } {
  const fromNumbers =
    options.total != null && options.total > 0 && options.current != null
      ? {
          current: Math.min(Math.max(options.current, 0), options.total),
          total: options.total,
        }
      : null
  const parsed = fromNumbers ?? parseQuestionProgressLabel(options.label)
  if (!parsed) return { current: 0, total: 0, ratio: 0 }
  return { ...parsed, ratio: parsed.current / parsed.total }
}

export { parseQuestionProgressLabel, resolveExamProgress }
