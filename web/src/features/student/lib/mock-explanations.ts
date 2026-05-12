export type ExplanationRow = {
  id: string
  prepTest: string
  section: string
  question: string
  topic: string
  hasVideo: boolean
}

export const mockExplanationRows: ExplanationRow[] = [
  {
    id: "1",
    prepTest: "PT 93",
    section: "LR",
    question: "Q12",
    topic: "Flaw in the reasoning",
    hasVideo: true,
  },
  {
    id: "2",
    prepTest: "PT 92",
    section: "RC",
    question: "Q8",
    topic: "Main point",
    hasVideo: false,
  },
  {
    id: "3",
    prepTest: "PT 91",
    section: "LR",
    question: "Q22",
    topic: "Strengthen",
    hasVideo: true,
  },
  {
    id: "4",
    prepTest: "PT 90",
    section: "LR",
    question: "Q5",
    topic: "Necessary assumption",
    hasVideo: true,
  },
  {
    id: "5",
    prepTest: "PT 89",
    section: "RC",
    question: "Q14",
    topic: "Author attitude",
    hasVideo: false,
  },
]
