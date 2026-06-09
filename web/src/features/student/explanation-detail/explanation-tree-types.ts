export type ExplanationQuestionStatus = "in_process" | "not_started" | "answered" | "fresh" | "seen"

export type ExplanationQuestionNode = {
  id: string
  number: number
  code: string
  snippet: string
  status: ExplanationQuestionStatus
  source: string
  difficulty: 1 | 2 | 3 | 4 | 5
  hasVideo?: boolean
  hasWrittenExplanation?: boolean
}

export type ExplanationPassageNode = {
  id: string
  label: string
  title: string
  snippet: string
  questions: ExplanationQuestionNode[]
}

export type ExplanationSectionNode = {
  id: string
  sectionNumber: number
  kind: "LR" | "RC" | "LG"
  sectionTitle: string
  flags?: string
  passages: ExplanationPassageNode[]
}

export type ExplanationPrepTestNode = {
  id: string
  prepTestNumber: string
  rowSubtitle: string
  sections: ExplanationSectionNode[]
}

export type ExplanationPrepTestListItem = {
  id: string
  title: string
  moduleId: string
  prepTestNumber: string | null
  questionCount: number
  explainedCount: number
}

export type ExplanationStatusCounts = {
  in_process: number
  fresh: number
  answered: number
  seen: number
}

export type ExplanationDetailPayload = {
  questionId: string
  prepTestId: string
  prepTestTitle: string
  prepTestNumber: string | null
  sectionId: string
  sectionType: "LR" | "RC" | "LG" | null
  sectionNumber: number | null
  questionNumber: number | null
  topicName: string
  explanationHtml: string | null
  videoUrl: string | null
  stimulusText: string | null
  stemText: string | null
  choices: { id: string; index: number; text: string; explanationHtml: string | null }[]
  correctChoiceId: string | null
  passage: {
    id: string
    displayNumber: number
    title: string
    body: string
  }
}
