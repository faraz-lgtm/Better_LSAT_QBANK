import type { PracticeSessionSummary } from "@/lib/api/analytics"
import {
  DEFAULT_SECTION_QUESTION_COUNT,
  sessionSectionQuestionCount,
} from "@/features/student/analytics/section-progress-axis"

/** Current LawHub LSAT: one scored LR (~24–26) and one scored RC (~26–28). */
const LAWHUB_SCORED_SECTION_QUESTION_MAX = {
  LR: 26,
  RC: 28,
} as const

export type PrepTestLrRcScores = {
  lrCorrect: number
  lrMax: number
  rcCorrect: number
  rcMax: number
}

const UNKNOWN_LR_RC_SCORES: PrepTestLrRcScores = {
  lrCorrect: 0,
  lrMax: 0,
  rcCorrect: 0,
  rcMax: 0,
}

function readMetaNumber(metadata: Record<string, unknown>, key: string): number | null {
  const value = metadata[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function sectionSessionLooksExperimental(session: PracticeSessionSummary): boolean {
  if (session.metadata.isExperimental === true) return true
  const title =
    session.sectionTitle ??
    (typeof session.metadata.sectionTitle === "string" ? session.metadata.sectionTitle : "")
  return /\bEXP\b/i.test(title) || /experimental/i.test(title)
}

function clampToLawHubSectionMax(kind: "LR" | "RC", questionCount: number): number {
  const max = LAWHUB_SCORED_SECTION_QUESTION_MAX[kind]
  const typical = DEFAULT_SECTION_QUESTION_COUNT[kind]
  if (!Number.isFinite(questionCount) || questionCount <= 0) return typical
  if (questionCount <= max) return Math.round(questionCount)
  const sectionCount = Math.max(2, Math.round(questionCount / typical))
  return Math.min(max, Math.round(questionCount / sectionCount))
}

function normalizeLawHubPair(
  kind: "LR" | "RC",
  correct: number,
  max: number,
): { correct: number; max: number } {
  const normalizedMax = clampToLawHubSectionMax(kind, max)
  const scale = max > 0 && max !== normalizedMax ? normalizedMax / max : 1
  const scaledCorrect = Math.round(correct * scale)
  return {
    max: normalizedMax,
    correct: Math.max(0, Math.min(normalizedMax, scaledCorrect)),
  }
}

function scoresFromMetadata(metadata: Record<string, unknown>): PrepTestLrRcScores | null {
  const lrCorrect = readMetaNumber(metadata, "lrCorrect")
  const lrMax = readMetaNumber(metadata, "lrMax")
  const rcCorrect = readMetaNumber(metadata, "rcCorrect")
  const rcMax = readMetaNumber(metadata, "rcMax")
  if (lrMax == null && rcMax == null) return null
  const lr =
    lrMax != null && lrMax > 0
      ? normalizeLawHubPair("LR", lrCorrect ?? 0, lrMax)
      : { correct: 0, max: 0 }
  const rc =
    rcMax != null && rcMax > 0
      ? normalizeLawHubPair("RC", rcCorrect ?? 0, rcMax)
      : { correct: 0, max: 0 }
  if (lr.max === 0 && rc.max === 0) return null
  return { lrCorrect: lr.correct, lrMax: lr.max, rcCorrect: rc.correct, rcMax: rc.max }
}

function filterSectionSessionsForPrepTestAttempt(
  sections: readonly PracticeSessionSummary[],
  prepTest: PracticeSessionSummary,
): PracticeSessionSummary[] {
  const prepTestId = prepTest.prepTestId
  const startMs = Date.parse(prepTest.startedAt)
  const endMs = prepTest.completedAt ? Date.parse(prepTest.completedAt) : Number.NaN
  return sections.filter((s) => {
    if (s.kind !== "SECTION" || !s.completedAt) return false
    if (prepTestId) {
      if (s.prepTestId !== prepTestId) return false
    } else if (s.prepTestId) {
      return false
    }
    const startedMs = Date.parse(s.startedAt)
    if (!Number.isFinite(startedMs)) return false
    if (Number.isFinite(startMs) && startedMs < startMs) return false
    if (Number.isFinite(endMs)) {
      const completedMs = Date.parse(s.completedAt)
      if (Number.isFinite(completedMs) && completedMs > endMs + 60_000) return false
    }
    return true
  })
}

function pickLawHubScoredSection(
  sessions: PracticeSessionSummary[],
  kind: "LR" | "RC",
): PracticeSessionSummary | null {
  const ofKind = sessions.filter((s) => s.sectionType === kind)
  if (ofKind.length === 0) return null
  const nonExperimental = ofKind.filter((s) => !sectionSessionLooksExperimental(s))
  const pool = nonExperimental.length > 0 ? nonExperimental : ofKind
  const inRange = pool.filter(
    (s) => sessionSectionQuestionCount(s, kind) <= LAWHUB_SCORED_SECTION_QUESTION_MAX[kind],
  )
  const candidates = inRange.length > 0 ? inRange : pool
  return [...candidates].sort(
    (a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt) || a.id.localeCompare(b.id),
  )[0] ?? null
}

function scoresFromSection(session: PracticeSessionSummary, kind: "LR" | "RC"): { correct: number; max: number } {
  const max = clampToLawHubSectionMax(kind, sessionSectionQuestionCount(session, kind))
  const correct = Math.max(0, Math.min(max, session.rawScore ?? 0))
  return { correct, max }
}

function scoresFromSectionSessions(
  prepTest: PracticeSessionSummary,
  sectionSessions: readonly PracticeSessionSummary[],
): PrepTestLrRcScores | null {
  const attempt = filterSectionSessionsForPrepTestAttempt(sectionSessions, prepTest)
  const lrSession = pickLawHubScoredSection(attempt, "LR")
  const rcSession = pickLawHubScoredSection(attempt, "RC")
  if (!lrSession && !rcSession) return null
  const lr = lrSession ? scoresFromSection(lrSession, "LR") : { correct: 0, max: 0 }
  const rc = rcSession ? scoresFromSection(rcSession, "RC") : { correct: 0, max: 0 }
  return { lrCorrect: lr.correct, lrMax: lr.max, rcCorrect: rc.correct, rcMax: rc.max }
}

function resolvePrepTestLrRcScores(
  prepTest: PracticeSessionSummary,
  sectionSessions: readonly PracticeSessionSummary[] = [],
): PrepTestLrRcScores {
  return (
    scoresFromSectionSessions(prepTest, sectionSessions) ??
    scoresFromMetadata(prepTest.metadata) ??
    UNKNOWN_LR_RC_SCORES
  )
}

function hasLawHubLrStats(lrMax: number): boolean {
  return lrMax > 0 && lrMax <= LAWHUB_SCORED_SECTION_QUESTION_MAX.LR
}

function hasLawHubRcStats(rcMax: number): boolean {
  return rcMax > 0 && rcMax <= LAWHUB_SCORED_SECTION_QUESTION_MAX.RC
}

export {
  LAWHUB_SCORED_SECTION_QUESTION_MAX,
  UNKNOWN_LR_RC_SCORES,
  hasLawHubLrStats,
  hasLawHubRcStats,
  resolvePrepTestLrRcScores,
}
