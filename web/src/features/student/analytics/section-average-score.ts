import type { PracticeSessionSummary } from "@/lib/api/analytics"
import { sessionSectionQuestionCount } from "@/features/student/analytics/section-progress-axis"

function formatSignedMissedAverage(missed: number): string {
  const rounded = Math.round(missed)
  if (rounded > 0) return `-${rounded}`
  if (rounded < 0) return `+${Math.abs(rounded)}`
  return "0"
}

/**
 * Average section score in PrepTest LR/RC style: signed missed count (e.g. -11),
 * not an accuracy percentage.
 */
function averageSectionMissedDisplay(
  sessions: PracticeSessionSummary[],
  sectionType: "LR" | "RC",
): string {
  const filtered = sessions.filter((s) => s.sectionType === sectionType && s.completedAt)
  if (filtered.length === 0) return "—"

  const missed = filtered.map((s) => {
    const questionCount = sessionSectionQuestionCount(s, sectionType)
    return Math.max(0, questionCount - (s.rawScore ?? 0))
  })
  const averageMissed = missed.reduce((sum, value) => sum + value, 0) / missed.length
  return formatSignedMissedAverage(averageMissed)
}

export { averageSectionMissedDisplay, formatSignedMissedAverage }
