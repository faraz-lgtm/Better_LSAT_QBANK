import type { PracticeSessionSummary } from "@/lib/api/analytics"
import { sessionSectionQuestionCount } from "@/features/student/analytics/section-progress-axis"
import { formatSectionHistoryLabel } from "@/features/student/analytics/map-analytics"
import { rollingAverageSeries } from "@/features/student/analytics/prep-test-insights"

export type SectionInsightKind = "LR" | "RC"

export type SectionInsightStats = {
  peakMissed: number
  peakLabel: string
  trailingAvgMissed: number
  attemptCount: number
  accuracyPct: number
  correctTotal: number
  questionTotal: number
  momentum: number | null
}

export type SectionInsightAttempt = {
  id: string
  testLabel: string
  dateLabel: string
  takenAt: string
  bookmarked: boolean
  sectionType: SectionInsightKind
  correct: number
  questionCount: number
  missed: number
  scaledEstimate: number | null
  /** Always a 120–180 PT-equivalent for display/charting. */
  ptEquivalent: number
  /** Untimed-review correct count when completed; otherwise null. */
  untimedCorrect: number | null
  untimedCorrectDelta: number | null
  /** Correct minus mean correct of up to 5 prior attempts (same section). */
  momentum: number | null
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function missedQuestions(session: PracticeSessionSummary, kind: SectionInsightKind): number {
  const max = sessionSectionQuestionCount(session, kind)
  return Math.max(0, max - (session.rawScore ?? 0))
}

export function formatSectionMissedSigned(missed: number, digits = 0): string {
  const abs = digits === 0 ? String(Math.round(Math.abs(missed))) : Math.abs(missed).toFixed(digits)
  if (missed > 0) return `\u2212${abs}`
  if (missed < 0) return `+${abs}`
  return digits === 0 ? "0" : (0).toFixed(digits)
}

function formatPeakDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatArchiveDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function filterSectionSessions(
  sessions: readonly PracticeSessionSummary[],
  kind: SectionInsightKind,
): PracticeSessionSummary[] {
  return sessions
    .filter((s) => s.kind === "SECTION" && s.sectionType === kind && s.completedAt)
    .sort((a, b) => Date.parse(a.completedAt!) - Date.parse(b.completedAt!))
}

export function computeSectionInsightStats(
  sessions: readonly PracticeSessionSummary[],
  kind: SectionInsightKind,
): SectionInsightStats | null {
  const filtered = filterSectionSessions(sessions, kind)
  if (filtered.length === 0) return null

  let peak = filtered[0]!
  let peakMissed = missedQuestions(peak, kind)
  for (const session of filtered) {
    const missed = missedQuestions(session, kind)
    if (missed < peakMissed) {
      peak = session
      peakMissed = missed
    }
  }

  const missedValues = filtered.map((s) => missedQuestions(s, kind))
  const trailingAvgMissed = round1(missedValues.reduce((sum, n) => sum + n, 0) / missedValues.length)

  let correctTotal = 0
  let questionTotal = 0
  for (const session of filtered) {
    const max = sessionSectionQuestionCount(session, kind)
    correctTotal += Math.max(0, Math.min(max, session.rawScore ?? 0))
    questionTotal += max
  }
  const accuracyPct = questionTotal > 0 ? Math.round((correctTotal / questionTotal) * 100) : 0

  let momentum: number | null = null
  if (filtered.length >= 2) {
    const mid = Math.floor(filtered.length / 2)
    const earlier = missedValues.slice(0, mid)
    const recent = missedValues.slice(mid)
    if (earlier.length > 0 && recent.length > 0) {
      const earlierAvg = earlier.reduce((sum, n) => sum + n, 0) / earlier.length
      const recentAvg = recent.reduce((sum, n) => sum + n, 0) / recent.length
      // Positive = fewer misses recently (improvement).
      momentum = round1(earlierAvg - recentAvg)
    }
  }

  const peakLabel = `${formatSectionHistoryLabel({
    sectionTitle: peak.sectionTitle,
    prepTestTitle: peak.prepTestTitle,
    prepTestId: peak.prepTestId,
    metadata: peak.metadata,
  })} \u00b7 ${formatPeakDate(peak.completedAt!)}`

  return {
    peakMissed,
    peakLabel,
    trailingAvgMissed,
    attemptCount: filtered.length,
    accuracyPct,
    correctTotal,
    questionTotal,
    momentum,
  }
}

function attemptMomentum(
  session: PracticeSessionSummary,
  chronological: readonly PracticeSessionSummary[],
): number | null {
  const correct = session.rawScore ?? 0
  const prior: number[] = []
  for (const row of chronological) {
    if (row.id === session.id) break
    prior.push(row.rawScore ?? 0)
  }
  if (prior.length === 0) return null
  const window = prior.slice(-5)
  const avg = window.reduce((sum, n) => sum + n, 0) / window.length
  return round1(correct - avg)
}

/** Prefer API column; section BR historically lived only in metadata. */
export function resolveSectionBlindReviewRawScore(
  session: Pick<PracticeSessionSummary, "blindReviewRawScore" | "metadata">,
): number | null {
  const fromColumn = session.blindReviewRawScore
  if (typeof fromColumn === "number" && Number.isFinite(fromColumn)) {
    return Math.round(fromColumn)
  }
  const fromMeta = session.metadata?.sectionBlindReviewRawScore
  if (typeof fromMeta === "number" && Number.isFinite(fromMeta)) {
    return Math.round(fromMeta)
  }
  return null
}

export function buildSectionInsightAttempts(
  sessions: readonly PracticeSessionSummary[],
  kind: SectionInsightKind,
): SectionInsightAttempt[] {
  const chronological = filterSectionSessions(sessions, kind)
  return chronological
    .map((session) => {
      const questionCount = sessionSectionQuestionCount(session, kind)
      const correct = Math.max(0, Math.min(questionCount, session.rawScore ?? 0))
      const br = resolveSectionBlindReviewRawScore(session)
      const untimedCorrectDelta =
        br != null ? Math.round(br - correct) : null
      const scaled =
        session.scaledScore != null && session.scaledScore >= 120 && session.scaledScore <= 180
          ? session.scaledScore
          : null
      return {
        id: session.id,
        testLabel: formatSectionHistoryLabel({
          sectionTitle: session.sectionTitle,
          prepTestTitle: session.prepTestTitle,
          prepTestId: session.prepTestId,
          metadata: session.metadata,
        }),
        dateLabel: formatArchiveDate(session.completedAt!),
        takenAt: session.completedAt!,
        bookmarked: Boolean(session.bookmarked),
        sectionType: kind,
        correct,
        questionCount,
        missed: Math.max(0, questionCount - correct),
        scaledEstimate: scaled,
        ptEquivalent: sectionPtEquivalentScore(correct, questionCount, scaled),
        untimedCorrect: br,
        untimedCorrectDelta,
        momentum: attemptMomentum(session, chronological),
      } satisfies SectionInsightAttempt
    })
    .reverse()
}

export function sortSectionInsightAttempts(
  attempts: readonly SectionInsightAttempt[],
  mode: "recent" | "gains",
): SectionInsightAttempt[] {
  const copy = [...attempts]
  if (mode === "gains") {
    return copy.sort((a, b) => {
      const ag = a.momentum ?? Number.NEGATIVE_INFINITY
      const bg = b.momentum ?? Number.NEGATIVE_INFINITY
      if (bg !== ag) return bg - ag
      return Date.parse(b.takenAt) - Date.parse(a.takenAt)
    })
  }
  return copy.sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt))
}

export type SectionTrajectoryPoint = {
  id: string
  label: string
  takenAt: string
  correct: number
  questionCount: number
  /** Real LSAT scaled when present; otherwise null. */
  scaledEstimate: number | null
  /** Always a 120–180 PT-equivalent for charting. */
  ptEquivalent: number
}

/** Map section raw accuracy onto the LSAT 120–180 scale when no official conversion exists. */
export function sectionPtEquivalentScore(
  correct: number,
  questionCount: number,
  scaledScore: number | null | undefined,
): number {
  if (scaledScore != null && scaledScore >= 120 && scaledScore <= 180) {
    return Math.round(scaledScore)
  }
  const max = Math.max(1, questionCount)
  const ratio = Math.max(0, Math.min(1, correct / max))
  return Math.round(120 + ratio * 60)
}

export function buildSectionTrajectoryPoints(
  sessions: readonly PracticeSessionSummary[],
  kind: SectionInsightKind,
): SectionTrajectoryPoint[] {
  return filterSectionSessions(sessions, kind).map((session) => {
    const questionCount = sessionSectionQuestionCount(session, kind)
    const correct = Math.max(0, Math.min(questionCount, session.rawScore ?? 0))
    const scaled =
      session.scaledScore != null && session.scaledScore >= 120 && session.scaledScore <= 180
        ? session.scaledScore
        : null
    return {
      id: session.id,
      label: formatSectionHistoryLabel({
        sectionTitle: session.sectionTitle,
        prepTestTitle: session.prepTestTitle,
        prepTestId: session.prepTestId,
        metadata: session.metadata,
      }),
      takenAt: session.completedAt!,
      correct,
      questionCount,
      scaledEstimate: scaled,
      ptEquivalent: sectionPtEquivalentScore(correct, questionCount, scaled),
    }
  })
}

export function sectionTrajectoryValues(
  points: readonly SectionTrajectoryPoint[],
  tab: "correct" | "scaled",
): number[] {
  return points.map((point) => (tab === "correct" ? point.correct : point.ptEquivalent))
}

export { rollingAverageSeries }
