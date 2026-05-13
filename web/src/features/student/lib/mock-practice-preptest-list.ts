export type PracticePrepTestListFilter = "all" | "in_progress" | "fresh" | "completed" | "blind_review"

export type PracticePrepTestListVariant =
  | "ready"
  | "in_process"
  | "locked"
  | "drill_only"
  | "not_available"
  | "drills_and_section"
  | "completed"

export type PrepTestCompletedAttempt = {
  headline: string
  detail: string
  /** e.g. "160" or "139 · 139 BR" (BR = blind review) */
  scoreLabel: string
  /** Opens analytics results for this attempt / test id */
  resultTestId: string
}

export type PracticePrepTestListRow = {
  id: string
  prepTestNumber: number
  variant: PracticePrepTestListVariant
  /** Primary status line (Figma: Ready to Take, In Process, …). */
  title: string
  /** Secondary line under title. */
  subtitle: string
  /** Which filter tabs include this row. */
  filters: PracticePrepTestListFilter[]
  /** When `variant === "completed"`: summary score in collapsed header (Figma PT 123). */
  completedSummaryScore?: number
  /** Attempt rows shown when expanded (Figma PT 122). */
  completedAttempts?: PrepTestCompletedAttempt[]
  /** Initial accordion state for completed rows. */
  completedDefaultExpanded?: boolean
}

/**
 * Practice → PrepTests catalog (`17835:3614`). Rows mirror Figma card variants;
 * `id` matches `mockPrepTestRecords` where navigation should open the real hub.
 */
export const mockPracticePrepTestListRows: PracticePrepTestListRow[] = [
  {
    id: "pt145",
    prepTestNumber: 145,
    variant: "ready",
    title: "Ready to Take",
    subtitle: "83% Fresh",
    filters: ["all", "fresh"],
  },
  {
    id: "pt150",
    prepTestNumber: 150,
    variant: "in_process",
    title: "In Process",
    subtitle: "Blind Review",
    filters: ["all", "in_progress", "blind_review"],
  },
  {
    id: "pt151",
    prepTestNumber: 151,
    variant: "locked",
    title: "Locked",
    subtitle: "100% Fresh",
    filters: ["all", "fresh"],
  },
  {
    id: "pt152",
    prepTestNumber: 152,
    variant: "drill_only",
    title: "Drill Only",
    subtitle: "10% Fresh",
    filters: ["all", "fresh"],
  },
  {
    id: "pt153",
    prepTestNumber: 153,
    variant: "completed",
    title: "Completed",
    subtitle: "Sep 28, 2025",
    filters: ["all", "completed"],
    completedSummaryScore: 160,
    completedDefaultExpanded: false,
    completedAttempts: [
      {
        headline: "Sep 28, 2025",
        detail: "2nd take · Taken on LawHub",
        scoreLabel: "160",
        resultTestId: "pt153",
      },
      {
        headline: "Sep 25, 2025",
        detail: "1st take · Imported from classic",
        scoreLabel: "139 · 139 BR",
        resultTestId: "pt153",
      },
    ],
  },
  {
    id: "pt154",
    prepTestNumber: 154,
    variant: "completed",
    title: "Completed",
    subtitle: "Sep 28, 2025",
    filters: ["all", "completed"],
    completedSummaryScore: 160,
    completedDefaultExpanded: true,
    completedAttempts: [
      {
        headline: "Sep 28, 2025",
        detail: "2nd take · Taken on LawHub",
        scoreLabel: "160",
        resultTestId: "pt154",
      },
      {
        headline: "Sep 25, 2025",
        detail: "1st take · Imported from classic",
        scoreLabel: "139 · 139 BR",
        resultTestId: "pt154",
      },
    ],
  },
]

export function filterPracticePrepTestListRows(
  rows: readonly PracticePrepTestListRow[],
  filter: PracticePrepTestListFilter,
): PracticePrepTestListRow[] {
  if (filter === "all") return [...rows]
  return rows.filter((r) => r.filters.includes(filter))
}

export function countPracticePrepTestListRowsByFilter(
  rows: readonly PracticePrepTestListRow[],
  filter: PracticePrepTestListFilter,
): number {
  return filterPracticePrepTestListRows(rows, filter).length
}
