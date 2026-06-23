import type { AnalyticsOverview } from "@/lib/api/analytics"

import { formatStudyTime } from "@/features/student/drills/drill-dashboard-mappers"

export type DashboardStatCard = {
  id: string
  value: string
  label: string
  badge?: string
}

export function mapOverviewToDashboardStats(
  overview: AnalyticsOverview,
  studyMinutes: number,
): DashboardStatCard[] {
  return [
    {
      id: "study-time",
      value: formatStudyTime(studyMinutes),
      label: "Total Study Time",
      badge: "All time",
    },
    {
      id: "drill-accuracy",
      value: overview.drillAccuracyPct != null ? `${overview.drillAccuracyPct}%` : "—",
      label: "Overall Accuracy",
      badge: overview.drillAccuracyPct != null ? "Drills" : undefined,
    },
    {
      id: "questions-answered",
      value: String(overview.totalQuestionsAnswered),
      label: "Questions Answered",
      badge: "Practice + Tests",
    },
  ]
}
