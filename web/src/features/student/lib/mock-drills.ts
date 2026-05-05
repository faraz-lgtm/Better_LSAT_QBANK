export type StudentDrill = {
  id: string
  section: "LR" | "RC"
  title: string
  progressPct: number
  answered: string
  timeLabel: string
  lastAttempt: string
  accent: "orange" | "mint"
}

export const mockStudentDrills: StudentDrill[] = [
  {
    id: "d1",
    section: "LR",
    title: "Causal reasoning drill",
    progressPct: 45,
    answered: "45/100",
    timeLabel: "15 min",
    lastAttempt: "2 days ago",
    accent: "orange",
  },
  {
    id: "d2",
    section: "LR",
    title: "Comparative drill",
    progressPct: 45,
    answered: "45/100",
    timeLabel: "15 min",
    lastAttempt: "2 days ago",
    accent: "mint",
  },
  {
    id: "d3",
    section: "LR",
    title: "Conditional reasoning drill",
    progressPct: 45,
    answered: "45/100",
    timeLabel: "15 min",
    lastAttempt: "2 days ago",
    accent: "orange",
  },
  {
    id: "d4",
    section: "LR",
    title: "Flaw or descriptive drill",
    progressPct: 45,
    answered: "45/100",
    timeLabel: "15 min",
    lastAttempt: "2 days ago",
    accent: "orange",
  },
]

export function filterDrills(drills: StudentDrill[], filter: "all" | "lr" | "rc"): StudentDrill[] {
  if (filter === "all") return drills
  if (filter === "lr") return drills.filter((d) => d.section === "LR")
  return drills.filter((d) => d.section === "RC")
}
