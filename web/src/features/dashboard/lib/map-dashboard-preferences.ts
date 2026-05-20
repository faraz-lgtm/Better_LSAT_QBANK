import type { StudentStudyPreferences } from "@/lib/api/users"

const PLANNED_WINDOW_LABELS: Record<string, string> = {
  within_1_month: "Within 1 month",
  "1_3_months": "1–3 months",
  "3_6_months": "3–6 months",
  "6_plus_months": "6+ months",
  not_sure: "Not sure yet",
}

export function formatPlannedLsatHeadline(preferences: StudentStudyPreferences | null): string {
  if (!preferences) return "Set your test date"
  if (preferences.plannedLsatDate) {
    try {
      return new Date(`${preferences.plannedLsatDate}T12:00:00`).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    } catch {
      return preferences.plannedLsatDate
    }
  }
  if (preferences.plannedLsatWindow) {
    return PLANNED_WINDOW_LABELS[preferences.plannedLsatWindow] ?? preferences.plannedLsatWindow
  }
  return "Set your test date"
}

export function formatLawSchoolCycle(preferences: StudentStudyPreferences | null): string {
  if (preferences?.lawSchoolCycle?.trim()) return preferences.lawSchoolCycle.trim()
  return "—"
}
