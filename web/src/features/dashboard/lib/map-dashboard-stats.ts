import type { AnalyticsOverview } from "@/lib/api/analytics"

import { formatStudyTime } from "@/features/student/drills/drill-dashboard-mappers"

export type DashboardStatCard = {
  id: string
  value: string
  label: string
  caption: string
  iconSrc: string
}

export type DashboardPerformanceMetric = {
  id: string
  label: string
  value: string
  valueClassName?: string
}

export type DashboardPerformanceOverview = {
  metrics: DashboardPerformanceMetric[]
  practiceTestCount: number
}

function formatStudyHoursCompact(totalMinutes: number): string {
  const minutes = Number.isFinite(totalMinutes) ? Math.max(0, Math.floor(totalMinutes)) : 0
  if (minutes < 60) return formatStudyTime(minutes)
  const hours = Math.floor(minutes / 60)
  return `${hours}h`
}

function formatAvgTimePerQuestion(totalStudyMinutes: number, questionsAnswered: number): string {
  if (!Number.isFinite(totalStudyMinutes) || !Number.isFinite(questionsAnswered) || questionsAnswered <= 0) {
    return "—"
  }
  const totalSeconds = Math.max(0, Math.floor(totalStudyMinutes * 60))
  const avgSeconds = Math.round(totalSeconds / questionsAnswered)
  const minutes = Math.floor(avgSeconds / 60)
  const seconds = avgSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function accuracyCaption(accuracyPct: number | null): string {
  if (accuracyPct == null) return "No drill data yet"
  if (accuracyPct < 70) return "Needs improvement"
  if (accuracyPct < 85) return "On track"
  return "Strong"
}

function studyTimeCaption(totalMinutes: number): string {
  if (totalMinutes < 60) return "Needs improvement"
  if (totalMinutes < 600) return "Building momentum"
  return "All time"
}

export function mapOverviewToDashboardStats(overview: AnalyticsOverview): DashboardStatCard[] {
  return [
    {
      id: "study-time",
      value: formatStudyHoursCompact(overview.totalStudyMinutes),
      label: "Total Study Time",
      caption: studyTimeCaption(overview.totalStudyMinutes),
      iconSrc: "/dashboard/stat-study.svg",
    },
    {
      id: "questions-done",
      value: String(overview.totalQuestionsAnswered),
      label: "Questions Done",
      caption: "Practice + Tests",
      iconSrc: "/dashboard/stat-questions.svg",
    },
    {
      id: "avg-time",
      value: formatAvgTimePerQuestion(overview.totalStudyMinutes, overview.totalQuestionsAnswered),
      label: "Avg Time / Q",
      caption: "Per question",
      iconSrc: "/dashboard/stat-avg-time.svg",
    },
    {
      id: "overall-accuracy",
      value: overview.drillAccuracyPct != null ? `${overview.drillAccuracyPct}%` : "—",
      label: "Overall Accuracy",
      caption: accuracyCaption(overview.drillAccuracyPct),
      iconSrc: "/dashboard/stat-accuracy.svg",
    },
  ]
}

function formatMissedAverage(value: number | null): string {
  if (value == null) return "—"
  const rounded = Math.round(value)
  return rounded > 0 ? `-${rounded}` : String(rounded)
}

export function mapOverviewToPerformance(overview: AnalyticsOverview): DashboardPerformanceOverview {
  return {
    practiceTestCount: overview.completedPrepTestCount,
    metrics: [
      {
        id: "best-score",
        label: "Best Score",
        value: overview.bestScaledScore != null ? String(Math.round(overview.bestScaledScore)) : "—",
      },
      {
        id: "avg-score",
        label: "Avg Score",
        value: overview.averageScaledScore != null ? String(Math.round(overview.averageScaledScore)) : "—",
      },
      {
        id: "avg-lr",
        label: "Average LR",
        value: formatMissedAverage(overview.averageLrMissedPerPrepTest),
        valueClassName: "text-[#00bc54]",
      },
      {
        id: "avg-rc",
        label: "Average RC",
        value: formatMissedAverage(overview.averageRcMissedPerPrepTest),
        valueClassName: "text-[#0bbcc9]",
      },
      {
        id: "questions-drilled",
        label: "Questions Drilled",
        value: String(overview.totalDrillQuestionsAnswered),
      },
      {
        id: "drilled-accuracy",
        label: "Drilled Accuracy",
        value: overview.drillAccuracyPct != null ? `${overview.drillAccuracyPct}%` : "—",
      },
    ],
  }
}

export function daysUntilDate(isoDate: string | null | undefined, now = new Date()): number | null {
  if (!isoDate?.trim()) return null
  const target = new Date(`${isoDate.trim()}T12:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const start = new Date(now)
  start.setHours(12, 0, 0, 0)
  const diffMs = target.getTime() - start.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

export function formatTestDateInputValue(isoDate: string | null | undefined): string {
  if (!isoDate?.trim()) return "—"
  try {
    const d = new Date(`${isoDate.trim()}T12:00:00`)
    if (Number.isNaN(d.getTime())) return isoDate
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${mm}/${dd}/${yyyy}`
  } catch {
    return isoDate
  }
}

export function formatLsacTestMeta(isoDate: string | null | undefined): string {
  if (!isoDate?.trim()) return "Set your LSAC test date to start the countdown"
  try {
    const d = new Date(`${isoDate.trim()}T12:00:00`)
    if (Number.isNaN(d.getTime())) return `LSAC · ${isoDate}`
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    return `LSAC · ${label}`
  } catch {
    return `LSAC · ${isoDate}`
  }
}
