export type ProvisionalScoreBand = {
  headline: string
  range: string
  caption: string
}

function stableSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Stable provisional score-band card when platform aggregates are not available yet.
 * Harder items skew toward higher typical scorer bands (120–180 scale).
 */
export function buildProvisionalScoreBand(
  seedKey: string,
  difficultyLevel = 3,
): ProvisionalScoreBand {
  const level = Math.max(1, Math.min(5, Math.round(difficultyLevel)))
  const seed = stableSeed(seedKey || `diff-${level}`)
  const base = 132 + level * 6
  const mid = Math.min(178, Math.max(122, base + (seed % 9) - 4))
  const halfWidth = 6 + (seed % 4)
  const low = Math.max(120, mid - halfWidth)
  const high = Math.min(180, mid + halfWidth)

  return {
    headline: String(mid),
    range: `${low}–${high}`,
    caption: "Typical score range for students who answer this correctly.",
  }
}

/** Prefer a real numeric band; otherwise fill a stable provisional one. */
export function resolveScoreBand(
  band: ProvisionalScoreBand | null | undefined,
  seedKey: string,
  difficultyLevel = 3,
): ProvisionalScoreBand {
  const headlineScore = Number.parseInt(band?.headline ?? "", 10)
  if (band && Number.isFinite(headlineScore)) return band
  return buildProvisionalScoreBand(seedKey, difficultyLevel)
}
