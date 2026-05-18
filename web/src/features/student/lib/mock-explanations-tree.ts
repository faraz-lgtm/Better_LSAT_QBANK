export type ExplanationQuestionStatus = "in_process" | "not_started" | "answered" | "fresh" | "seen"

export type ExplanationQuestionNode = {
  id: string
  number: number
  code: string
  snippet: string
  status: ExplanationQuestionStatus
  source: string
  /** 1 = easiest … 5 = hardest (filled segments in the meter). */
  difficulty: 1 | 2 | 3 | 4 | 5
  hasVideo?: boolean
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

export const mockExplanationPrepTests: ExplanationPrepTestNode[] = [
  {
    id: "pt-159",
    prepTestNumber: "159",
    rowSubtitle: "In Process · Blind Review",
    sections: [
      {
        id: "s1",
        sectionNumber: 1,
        kind: "LR",
        sectionTitle: "Logical Reasoning",
        flags: "Scored",
        passages: [
          {
            id: "p-lr",
            label: "LR",
            title: "Section questions",
            snippet: "Stimulus-based questions in order.",
            questions: [
              {
                id: "q1",
                number: 1,
                code: "PT159.S1.Q1",
                snippet: "The argument is vulnerable to criticism on the grounds that it…",
                status: "seen",
                source: "The Official LSAT PrepTest 157+ · 1 other practice",
                difficulty: 3,
              },
              {
                id: "q2",
                number: 2,
                code: "PT159.S1.Q2",
                snippet: "Which one of the following, if true, would most strengthen…",
                status: "fresh",
                source: "The Official LSAT PrepTest 157+",
                difficulty: 4,
                hasVideo: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "pt-160",
    prepTestNumber: "160",
    rowSubtitle: "In Process · Blind Review",
    sections: [
      {
        id: "s1",
        sectionNumber: 1,
        kind: "RC",
        sectionTitle: "Reading Comprehension",
        flags: "Experimental",
        passages: [
          {
            id: "p1",
            label: "P1",
            title: "Passage 1",
            snippet: "Scholars have long debated whether the earliest…",
            questions: [
              {
                id: "q1",
                number: 1,
                code: "PT160.S1.P1.Q1",
                snippet: "Which one of the following most accurately expresses the main point…",
                status: "in_process",
                source: "The Official LSAT PrepTest 157+ · 1 other practice",
                difficulty: 5,
              },
              {
                id: "q2",
                number: 2,
                code: "PT160.S1.P1.Q2",
                snippet: "It can be inferred from the passage that the author would be most likely to agree…",
                status: "not_started",
                source: "The Official LSAT PrepTest 157+ · 1 other practice",
                difficulty: 3,
              },
              {
                id: "q3",
                number: 3,
                code: "PT160.S1.P1.Q3",
                snippet: "Which one of the following, if true, would most weaken the argument…",
                status: "answered",
                source: "The Official LSAT PrepTest 157+",
                difficulty: 2,
                hasVideo: true,
              },
            ],
          },
          {
            id: "p2",
            label: "P2",
            title: "Passage 2",
            snippet: "Recent advances in neuroscience suggest that…",
            questions: [
              {
                id: "q1",
                number: 1,
                code: "PT160.S1.P2.Q1",
                snippet: "The primary purpose of the third paragraph is to…",
                status: "fresh",
                source: "The Official LSAT PrepTest 157+",
                difficulty: 4,
              },
            ],
          },
        ],
      },
      {
        id: "s2",
        sectionNumber: 2,
        kind: "LR",
        sectionTitle: "Logical Reasoning",
        flags: "Scored",
        passages: [
          {
            id: "p-lr",
            label: "LR",
            title: "Section questions",
            snippet: "",
            questions: [
              {
                id: "q10",
                number: 10,
                code: "PT160.S2.Q10",
                snippet: "The reasoning in the argument is flawed in that…",
                status: "in_process",
                source: "The Official LSAT PrepTest 157+",
                difficulty: 5,
              },
            ],
          },
        ],
      },
    ],
  },
]
