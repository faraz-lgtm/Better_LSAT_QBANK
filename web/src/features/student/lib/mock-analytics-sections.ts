export type SectionProgressPoint = {
  label: string
  rawScore: number
  ptEquivalent: number
}

export type SectionSummary = {
  bestScore: string
  bestAccent: string
  averageScore: string
  averageAccent: string
}

export const mockLrSectionSummary: SectionSummary = {
  bestScore: "169",
  bestAccent: "#0d47a1",
  averageScore: "-11",
  averageAccent: "#ae8b00",
}

export const mockRcSectionSummary: SectionSummary = {
  bestScore: "169",
  bestAccent: "#0d47a1",
  averageScore: "-11",
  averageAccent: "#ff9d51",
}

export const mockLrSectionProgress: SectionProgressPoint[] = [
  { label: "Sec 1", rawScore: 76, ptEquivalent: 78 },
  { label: "Sec 2", rawScore: 72, ptEquivalent: 80 },
  { label: "Sec 3", rawScore: 72, ptEquivalent: 76 },
  { label: "Sec 4", rawScore: 72, ptEquivalent: 78 },
  { label: "Sec 5", rawScore: 72, ptEquivalent: 83 },
  { label: "Sec 6", rawScore: 34, ptEquivalent: 50 },
  { label: "Sec 7", rawScore: 34, ptEquivalent: 50 },
  { label: "Sec 8", rawScore: 32, ptEquivalent: 48 },
  { label: "Sec 9", rawScore: 30, ptEquivalent: 46 },
]

export const mockRcSectionProgress: SectionProgressPoint[] = [
  { label: "Sec 1", rawScore: 74, ptEquivalent: 77 },
  { label: "Sec 2", rawScore: 70, ptEquivalent: 79 },
  { label: "Sec 3", rawScore: 71, ptEquivalent: 75 },
  { label: "Sec 4", rawScore: 73, ptEquivalent: 77 },
  { label: "Sec 5", rawScore: 70, ptEquivalent: 82 },
  { label: "Sec 6", rawScore: 36, ptEquivalent: 48 },
  { label: "Sec 7", rawScore: 35, ptEquivalent: 49 },
  { label: "Sec 8", rawScore: 33, ptEquivalent: 47 },
  { label: "Sec 9", rawScore: 31, ptEquivalent: 45 },
]
