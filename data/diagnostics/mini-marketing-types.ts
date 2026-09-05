export type MiniDiagnosticChoice = {
  letter: "A" | "B" | "C" | "D" | "E"
  text: string
  explanation?: string
}

export type MiniDiagnosticQuestion = {
  sourceItemId: string
  questionNumber: number
  targetTimeSeconds: number
  difficulty: 1 | 2 | 3 | 4 | 5
  questionType: string
  stimulusText: string | null
  stemText: string
  choices: MiniDiagnosticChoice[]
  correctAnswer: "A" | "B" | "C" | "D" | "E"
  explanationHtml: string
}

export type MiniDiagnosticScoreRange = {
  correctCount: number
  scaledLow: number
  scaledHigh: number
  percentileLow: number
  percentileHigh: number
}

export type DiagnosticMarketingIntentId = "mini" | "quick"

export type DiagnosticMarketingSet = {
  intentId: DiagnosticMarketingIntentId
  moduleId: string
  moduleName: string
  sectionId: string
  title: string
  timeMinutes: number
  questionCount: number
  questions: MiniDiagnosticQuestion[]
  scoreRanges: MiniDiagnosticScoreRange[]
}

/** @deprecated Use DiagnosticMarketingSet */
export type MiniDiagnosticMarketingSet = DiagnosticMarketingSet & { intentId: "mini" }
