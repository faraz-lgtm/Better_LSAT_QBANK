import type { PracticeSessionSummary } from "@/lib/api/analytics"
import { sessionSectionQuestionCount } from "@/features/student/analytics/section-progress-axis"

function formatSignedMissedAverage(missed: number): string {
  const rounded = Math.round(missed)
  if (rounded > 0) return `-${rounded}`
  if (rounded < 0) return `+${Math.abs(rounded)}`
  return "0"
}

function completedSectionSessions(
  sessions: PracticeSessionSummary[],
  sectionType: "LR" | "RC",
): PracticeSessionSummary[] {
  return sessions.filter((s) => s.sectionType === sectionType && s.completedAt)
}

function missedQuestions(
  session: PracticeSessionSummary,
  sectionType: "LR" | "RC",
): number {
  const questionCount = sessionSectionQuestionCount(session, sectionType)
  return Math.max(0, questionCount - (session.rawScore ?? 0))
}

/**
 * Average section score in PrepTest LR/RC style: signed missed count (e.g. -11),
 * not an accuracy percentage.
 */
function averageSectionMissedDisplay(
  sessions: PracticeSessionSummary[],
  sectionType: "LR" | "RC",
): string {
  const filtered = completedSectionSessions(sessions, sectionType)
  if (filtered.length === 0) return "—"

  const missed = filtered.map((s) => missedQuestions(s, sectionType))
  const averageMissed = missed.reduce((sum, value) => sum + value, 0) / missed.length
  return formatSignedMissedAverage(averageMissed)
}

/** Best section score: fewest missed questions, same minus format as average. */
function bestSectionMissedDisplay(
  sessions: PracticeSessionSummary[],
  sectionType: "LR" | "RC",
): string {
  const filtered = completedSectionSessions(sessions, sectionType)
  if (filtered.length === 0) return "—"

  const bestMissed = Math.min(...filtered.map((s) => missedQuestions(s, sectionType)))
  return formatSignedMissedAverage(bestMissed)
}

export { averageSectionMissedDisplay, bestSectionMissedDisplay, formatSignedMissedAverage }
