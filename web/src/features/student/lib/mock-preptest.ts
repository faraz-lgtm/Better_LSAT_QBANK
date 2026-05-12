export type PrepTestSectionRow = {
  id: string
  label: string
  questions: number
  minutes: number
}

export const mockPrepTestDetail = {
  id: "pt143",
  label: "PT 143",
  parentLabel: "PrepTests 141",
  questionCount: 101,
  totalMinutes: 140,
  sectionCount: 4,
  headline: "Ready to begin your test?",
}

export const mockPrepTestSections: PrepTestSectionRow[] = [
  { id: "s1", label: "Section 1 — Logical Reasoning", questions: 26, minutes: 35 },
  { id: "s2", label: "Section 2 — Reading Comprehension", questions: 27, minutes: 35 },
  { id: "s3", label: "Section 3 — Logical Reasoning", questions: 25, minutes: 35 },
  { id: "s4", label: "Section 4 — Reading Comprehension", questions: 23, minutes: 35 },
]
