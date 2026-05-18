export const lrDrillPoolMock = {
  selectedCount: 550,
  totalCount: 1472,
}

export const lrDrillConfigOptions = {
  questionCount: [
    { label: "1", value: "1" },
    { label: "5", value: "5" },
    { label: "10", value: "10" },
    { label: "25", value: "25" },
  ],
  timing: [
    { label: "Unlimited", value: "unlimited" },
    { label: "35 minutes", value: "35" },
    { label: "Per question (1:20)", value: "per-q" },
  ],
  showAnswers: [
    { label: "At the end", value: "end" },
    { label: "After each question", value: "each" },
    { label: "Never (blind)", value: "never" },
  ],
  selection: [
    { label: "Pick automatically", value: "auto" },
    { label: "Choose manually", value: "manual" },
  ],
  tags: [
    { label: "Any", value: "any" },
    { label: "Flaw", value: "flaw" },
    { label: "Strengthen / Weaken", value: "sw" },
  ],
  difficulty: [
    { label: "Adaptive", value: "adaptive" },
    { label: "Easy", value: "easy" },
    { label: "Hard", value: "hard" },
  ],
  status: [
    { label: "Fresh", value: "fresh" },
    { label: "Include reviewed", value: "all" },
  ],
} as const

export type LrDrillQuestion = {
  id: string
  stimulus: string
  stem: string
  choices: readonly [string, string, string, string, string]
}

const sampleStimulus =
  "Economist: The proposed subway extension would reduce commute times, but its construction would displace several small businesses along the corridor. City planners argue the long-term gains outweigh the short-term losses. Critics respond that those businesses provide irreplaceable neighborhood character."

const sampleStem = "The critics' response plays which one of the following logical roles in the argument?"

const sampleChoices = [
  "It is the main conclusion the critics wish to establish.",
  "It is a premise offered in support of the planners' position.",
  "It is an objection to a consideration the planners treat as decisive.",
  "It summarizes evidence the economist presents as ambiguous.",
  "It is an assumption required by the economist's prediction.",
] as const

export const lrDrillSessionMock = {
  drillLabel: "PT141",
  questions: Array.from({ length: 15 }, (_, i): LrDrillQuestion => {
    const n = i + 1
    return {
      id: `lr-mock-${n}`,
      stimulus: n === 1 ? sampleStimulus : `${sampleStimulus} (Question ${n} — mock stimulus placeholder.)`,
      stem: n === 1 ? sampleStem : `Mock question ${n}: ${sampleStem}`,
      choices: sampleChoices,
    }
  }),
}
