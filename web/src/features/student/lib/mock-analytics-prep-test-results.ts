/**
 * Mock PrepTest results detail for the analytics results screen (Figma
 * `17962:8564` and nested frames). Keys align with `mockPrepTestRecords` ids
 * where possible; unknown ids fall back to `default`.
 */

export type QuestionResultStatus = "correct" | "incorrect"

export type PrepTestSectionKind = "LR" | "RC"

export type PrepTestSectionSummary = {
  id: string
  kind: PrepTestSectionKind
  longName: string
  sectionLabel: string
  scoreDelta: number
  /** Row-major groups of question outcomes for the icon grid (Figma uses 7 per row). */
  questionRows: QuestionResultStatus[][]
  accuracyPct: number
}

export type PrepTestPassageSummary = {
  id: string
  passageLabel: string
  title: string
  tags: string[]
  difficulty: "Easiest" | "Easy" | "Medium" | "Hard" | "Hardest"
  difficultyDots: number
  targetTime: string
  yourTime: string
  yourTimeNote: string
}

export type PrepTestQuestionResultRow = {
  id: string
  number: number
  title: string
  tags: string[]
  targetTime: string
  yourTime: string
  yourTimeNote: string
  difficulty: "Easiest" | "Easy" | "Medium" | "Hard" | "Hardest"
  difficultyDots: number
  actualCorrect: boolean
  blindReviewCorrect: boolean
  /** Heights 0–100 for A–E popularity bars */
  answerPopularity: [number, number, number, number, number]
  correctLetter: "A" | "B" | "C" | "D" | "E"
}

/** Figma `17984:7995` — “About this PrepTest” metadata rows */
export type PrepTestAboutMeta = {
  questionCount: string
  timing: string
  timeUsed: string
  take: string
  format: string
  source: string
}

/** Figma `17980:10398` — RC section block with question rows (no passage row in design). */
export type PrepTestRcSectionBlock = {
  sectionTitle: string
  scoreDisplay: string
  blindReviewDisplay: string
  questions: PrepTestQuestionResultRow[]
}

export type PrepTestResultsDetail = {
  totalQuestions: number
  scaledScore: number
  correct: number
  incorrect: number
  correctSummary: string
  percentile: number
  prediction: number
  blindReview: number
  sections: PrepTestSectionSummary[]
  passages: PrepTestPassageSummary[]
  questions: PrepTestQuestionResultRow[]
  about: PrepTestAboutMeta
  rcSection: PrepTestRcSectionBlock
}

const PT145_LIKE: PrepTestResultsDetail = {
  totalQuestions: 78,
  scaledScore: 167,
  correct: 66,
  incorrect: 12,
  correctSummary: "66/78 CORRECT (-12)",
  percentile: 90.6,
  prediction: 160,
  blindReview: 167,
  sections: [
    {
      id: "s1",
      kind: "LR",
      longName: "Logical Reasoning",
      sectionLabel: "Section 1",
      scoreDelta: -7,
      questionRows: [
        ["correct", "incorrect", "correct", "correct", "correct", "correct", "correct"],
        ["incorrect", "correct", "correct", "correct", "incorrect", "correct", "correct"],
        ["correct", "correct", "incorrect", "correct", "correct", "incorrect", "incorrect"],
        ["correct", "incorrect", "correct", "incorrect"],
      ],
      accuracyPct: 74,
    },
    {
      id: "s2",
      kind: "LR",
      longName: "Logical Reasoning",
      sectionLabel: "Section 2",
      scoreDelta: -7,
      questionRows: [
        ["correct", "incorrect", "correct", "correct", "correct", "correct", "correct"],
        ["incorrect", "correct", "correct", "correct", "incorrect", "correct", "correct"],
        ["correct", "correct", "incorrect", "correct", "correct", "incorrect", "incorrect"],
        ["correct", "incorrect", "correct", "incorrect"],
      ],
      accuracyPct: 74,
    },
    {
      id: "s3",
      kind: "LR",
      longName: "Logical Reasoning",
      sectionLabel: "Section 3",
      scoreDelta: -7,
      questionRows: [
        ["correct", "incorrect", "correct", "correct", "correct", "correct", "correct"],
        ["incorrect", "correct", "correct", "correct", "incorrect", "correct", "correct"],
        ["correct", "correct", "incorrect", "correct", "correct", "incorrect", "incorrect"],
        ["correct", "incorrect", "correct", "incorrect"],
      ],
      accuracyPct: 74,
    },
    {
      id: "s4",
      kind: "RC",
      longName: "Reading Comprehension",
      sectionLabel: "Section 4",
      scoreDelta: -12,
      questionRows: [
        ["correct", "incorrect", "correct", "correct", "correct", "correct", "correct"],
        ["incorrect", "correct", "correct", "correct", "incorrect", "correct", "correct"],
        ["correct", "correct", "incorrect", "correct", "correct", "incorrect", "incorrect"],
        ["correct", "incorrect", "correct", "incorrect"],
      ],
      accuracyPct: 64,
    },
    {
      id: "s5",
      kind: "RC",
      longName: "Reading Comprehension",
      sectionLabel: "Section 5",
      scoreDelta: -12,
      questionRows: [
        ["correct", "incorrect", "correct", "correct", "correct", "correct", "correct"],
        ["incorrect", "correct", "correct", "correct", "incorrect", "correct", "correct"],
        ["correct", "correct", "incorrect", "correct", "correct", "incorrect", "incorrect"],
        ["correct", "incorrect", "correct", "incorrect"],
      ],
      accuracyPct: 93,
    },
  ],
  passages: [
    {
      id: "p1",
      passageLabel: "P1",
      title: "Passage 1",
      tags: ["Art", "Sing", "Spot"],
      difficulty: "Hard",
      difficultyDots: 4,
      targetTime: "01:45",
      yourTime: "00:04",
      yourTimeNote: "(01:41 under)",
    },
  ],
  questions: [
    {
      id: "q1",
      number: 1,
      title: "PT 129  .  S1  .  Q19",
      tags: ["Art", "Sing", "Spot"],
      targetTime: "01:45",
      yourTime: "00:04",
      yourTimeNote: "(01:41 under)",
      difficulty: "Hard",
      difficultyDots: 4,
      actualCorrect: true,
      blindReviewCorrect: false,
      answerPopularity: [42, 3, 3, 4, 2],
      correctLetter: "A",
    },
    {
      id: "q2",
      number: 2,
      title: "PT 129  .  S1  .  Q20",
      tags: ["Art", "Sing", "Spot"],
      targetTime: "01:45",
      yourTime: "01:12",
      yourTimeNote: "(00:33 under)",
      difficulty: "Medium",
      difficultyDots: 3,
      actualCorrect: false,
      blindReviewCorrect: true,
      answerPopularity: [8, 35, 12, 30, 15],
      correctLetter: "B",
    },
    {
      id: "q3",
      number: 3,
      title: "PT 129  .  S1  .  Q21",
      tags: ["Art", "Sing", "Spot"],
      targetTime: "01:45",
      yourTime: "01:50",
      yourTimeNote: "(00:05 over)",
      difficulty: "Easy",
      difficultyDots: 2,
      actualCorrect: true,
      blindReviewCorrect: true,
      answerPopularity: [22, 18, 40, 12, 8],
      correctLetter: "C",
    },
  ],
  about: {
    questionCount: "105",
    timing: "Custom · 61 min 57 sec",
    timeUsed: "185 min 51 sec",
    take: "First",
    format: "Without experimental · 3 sections",
    source: "Taken on LawHub",
  },
  rcSection: {
    sectionTitle: "Section 1",
    scoreDisplay: "-7",
    blindReviewDisplay: "-7",
    questions: [
      {
        id: "rc-q1",
        number: 1,
        title: "PT 129  .  S1  .  Q19",
        tags: ["Art", "Sing", "Spot"],
        targetTime: "01:45",
        yourTime: "00:04",
        yourTimeNote: "(01:41 under)",
        difficulty: "Hardest",
        difficultyDots: 5,
        actualCorrect: true,
        blindReviewCorrect: false,
        answerPopularity: [55, 4, 4, 4, 4],
        correctLetter: "A",
      },
      {
        id: "rc-q2",
        number: 2,
        title: "PT 129  .  S1  .  Q20",
        tags: ["Art", "Sing", "Spot"],
        targetTime: "01:45",
        yourTime: "01:10",
        yourTimeNote: "(00:35 under)",
        difficulty: "Hard",
        difficultyDots: 4,
        actualCorrect: true,
        blindReviewCorrect: true,
        answerPopularity: [12, 48, 10, 20, 10],
        correctLetter: "A",
      },
      {
        id: "rc-q3",
        number: 3,
        title: "PT 129  .  S1  .  Q21",
        tags: ["Art", "Sing", "Spot"],
        targetTime: "01:45",
        yourTime: "00:55",
        yourTimeNote: "(00:50 under)",
        difficulty: "Easiest",
        difficultyDots: 1,
        actualCorrect: true,
        blindReviewCorrect: false,
        answerPopularity: [60, 5, 5, 5, 5],
        correctLetter: "A",
      },
    ],
  },
}

const PREP_TEST_RESULTS_BY_ID: Record<string, PrepTestResultsDetail> = {
  default: PT145_LIKE,
  pt145: PT145_LIKE,
  pt150: PT145_LIKE,
  pt151: PT145_LIKE,
  pt152: PT145_LIKE,
  pt153: PT145_LIKE,
  pt154: PT145_LIKE,
  pt155: PT145_LIKE,
  pt156: PT145_LIKE,
}

function getPrepTestResultsDetail(testId: string): PrepTestResultsDetail {
  return PREP_TEST_RESULTS_BY_ID[testId] ?? PREP_TEST_RESULTS_BY_ID.default
}

export { getPrepTestResultsDetail, PT145_LIKE }
