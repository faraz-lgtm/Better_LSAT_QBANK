import type { PrepTestSessionDetail } from "@/lib/api/analytics"
import {
  scorePrepTestQuestions,
  withExperimentalSectionFlags,
  type PrepTestResultQuestion,
} from "@/features/student/analytics/prep-test-experimental-sections"
import type {
  PrepTestLrSectionBlock,
  PrepTestPassageSummary,
  PrepTestQuestionResultRow,
  PrepTestRcSectionBlock,
  PrepTestResultsDetail,
  PrepTestSectionKind,
  PrepTestSectionSummary,
  QuestionResultStatus,
} from "@/features/student/lib/prep-test-results-types"

const QUESTIONS_PER_ROW = 7

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size))
  }
  return rows
}

function formatScoreDelta(incorrectCount: number): string {
  if (incorrectCount <= 0) return "0"
  return `-${incorrectCount}`
}

function sectionHeading(sectionNumber: number, isExperimental: boolean): string {
  return isExperimental ? `Section ${sectionNumber} (EXP)` : `Section ${sectionNumber}`
}

export function prepTestBlindReviewWasCompleted(
  api: Pick<PrepTestSessionDetail, "blindReviewCompletedAt" | "questions">,
): boolean {
  if (api.blindReviewCompletedAt) return true
  return api.questions.some((q) => q.blindReviewCorrect !== q.actualCorrect)
}

export function formatQuestionRefLabel(
  moduleId: string | null,
  prepTestTitle: string,
  sectionNumber: number | null,
  questionNumber: number,
): string {
  const moduleMatch = moduleId?.match(/^LSAC(\d+)$/i)
  const pt = moduleMatch
    ? `PT ${moduleMatch[1]}`
    : prepTestTitle.replace(/^PrepTest\s*/i, "PT ").trim() || "PrepTest"
  const section = sectionNumber != null ? `S${sectionNumber}` : "S?"
  return `${pt}  .  ${section}  .  Q${questionNumber}`
}

function mapQuestionRow(
  q: PrepTestResultQuestion,
  api: Pick<PrepTestSessionDetail, "moduleId" | "prepTestTitle">,
): PrepTestQuestionResultRow {
  const letter = q.correctLetter.trim().toUpperCase().slice(0, 1)
  const correctLetter =
    letter === "A" || letter === "B" || letter === "C" || letter === "D" || letter === "E" ? letter : "A"
  return {
    id: q.id,
    number: q.number,
    title: formatQuestionRefLabel(api.moduleId, api.prepTestTitle, q.sectionNumber, q.number),
    tags: q.tags,
    targetTime: "01:45",
    yourTime: "—",
    yourTimeNote: "",
    difficulty: q.difficulty,
    difficultyDots: q.difficultyDots,
    actualCorrect: q.actualCorrect,
    blindReviewCorrect: q.blindReviewCorrect,
    blindReviewUnanswered: q.blindReviewUnanswered,
    isUnanswered: q.isUnanswered,
    answerPopularity: [20, 20, 20, 20, 20],
    correctLetter,
  }
}

function buildSectionSummary(
  sectionNumber: number,
  kind: PrepTestSectionKind,
  questions: PrepTestResultQuestion[],
  isExperimental: boolean,
): PrepTestSectionSummary {
  const outcomes: QuestionResultStatus[] = questions.map((q) =>
    q.isUnanswered ? "unanswered" : q.actualCorrect ? "correct" : "incorrect",
  )
  const correct = outcomes.filter((o) => o === "correct").length
  const total = questions.length
  const incorrect = total - correct
  return {
    id: `section-${sectionNumber}-${kind}${isExperimental ? "-exp" : ""}`,
    kind,
    longName: kind === "LR" ? "Logical Reasoning" : "Reading Comprehension",
    sectionLabel: sectionHeading(sectionNumber, isExperimental),
    isExperimental,
    scoreDelta: -incorrect,
    questionRows: chunk(outcomes, QUESTIONS_PER_ROW),
    accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
  }
}

function buildLrSectionBlock(
  sectionNumber: number,
  questions: PrepTestResultQuestion[],
  api: Pick<PrepTestSessionDetail, "moduleId" | "prepTestTitle">,
  isExperimental: boolean,
): PrepTestLrSectionBlock {
  const incorrect = questions.filter((q) => !q.actualCorrect).length
  const blindIncorrect = questions.filter((q) => q.blindReviewUnanswered || !q.blindReviewCorrect).length
  return {
    sectionTitle: sectionHeading(sectionNumber, isExperimental),
    isExperimental,
    scoreDisplay: formatScoreDelta(incorrect),
    blindReviewDisplay: formatScoreDelta(blindIncorrect),
    passages: [],
    questions: questions.map((q) => mapQuestionRow(q, api)),
  }
}

function buildRcSectionBlock(
  sectionNumber: number,
  questions: PrepTestResultQuestion[],
  api: Pick<PrepTestSessionDetail, "moduleId" | "prepTestTitle">,
  isExperimental: boolean,
): PrepTestRcSectionBlock {
  const incorrect = questions.filter((q) => !q.actualCorrect).length
  const blindIncorrect = questions.filter((q) => q.blindReviewUnanswered || !q.blindReviewCorrect).length
  return {
    sectionTitle: sectionHeading(sectionNumber, isExperimental),
    isExperimental,
    scoreDisplay: formatScoreDelta(incorrect),
    blindReviewDisplay: formatScoreDelta(blindIncorrect),
    questions: questions.map((q) => mapQuestionRow(q, api)),
  }
}

function groupQuestionsBySection(questions: PrepTestResultQuestion[]) {
  const groups = new Map<string, PrepTestResultQuestion[]>()
  for (const q of questions) {
    const sectionType = q.sectionType === "RC" ? "RC" : "LR"
    const sectionNumber = q.sectionNumber ?? 1
    const isExperimental = q.isExperimental === true
    const key = `${sectionNumber}:${sectionType}:${isExperimental ? "exp" : "scored"}`
    const list = groups.get(key) ?? []
    list.push(q)
    groups.set(key, list)
  }
  return [...groups.entries()]
    .map(([key, qs]) => {
      const [num, type, exp] = key.split(":")
      return {
        sectionNumber: Number(num),
        sectionType: type as PrepTestSectionKind,
        isExperimental: exp === "exp",
        questions: qs.sort((a, b) => a.number - b.number),
      }
    })
    .sort((a, b) => a.sectionNumber - b.sectionNumber || a.sectionType.localeCompare(b.sectionType))
}

export function formatPrepTestResultsTitle(prepTestTitle: string, moduleId: string | null, completedAt: string): string {
  const d = new Date(completedAt)
  const formatted = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  const moduleMatch = moduleId?.match(/^LSAC(\d+)$/i)
  const label = moduleMatch ? `PT${moduleMatch[1]}` : prepTestTitle.trim() || "PrepTest"
  return `${label} - ${formatted}`
}

export function mapPrepTestDetailToResults(api: PrepTestSessionDetail): PrepTestResultsDetail {
  const questions = withExperimentalSectionFlags(api.questions)
  const { correct, incorrect, totalQuestions } = scorePrepTestQuestions(questions)
  const blindReviewCompleted = prepTestBlindReviewWasCompleted(api)
  const grouped = groupQuestionsBySection(questions)

  const sections: PrepTestSectionSummary[] = grouped.map(
    ({ sectionNumber, sectionType, questions: sectionQuestions, isExperimental }) =>
      buildSectionSummary(sectionNumber, sectionType, sectionQuestions, isExperimental),
  )

  const apiMeta = { moduleId: api.moduleId, prepTestTitle: api.prepTestTitle }

  const lrSections: PrepTestLrSectionBlock[] = grouped
    .filter((g) => g.sectionType === "LR")
    .map(({ sectionNumber, questions: sectionQuestions, isExperimental }) =>
      buildLrSectionBlock(sectionNumber, sectionQuestions, apiMeta, isExperimental),
    )

  const rcSections: PrepTestRcSectionBlock[] = grouped
    .filter((g) => g.sectionType === "RC")
    .map(({ sectionNumber, questions: sectionQuestions, isExperimental }) =>
      buildRcSectionBlock(sectionNumber, sectionQuestions, apiMeta, isExperimental),
    )

  const sectionBlocks = grouped.map(
    ({ sectionNumber, sectionType, questions: sectionQuestions, isExperimental }) => {
      if (sectionType === "RC") {
        const block = buildRcSectionBlock(sectionNumber, sectionQuestions, apiMeta, isExperimental)
        return {
          kind: "RC" as const,
          sectionTitle: block.sectionTitle,
          isExperimental: block.isExperimental,
          scoreDisplay: block.scoreDisplay,
          blindReviewDisplay: block.blindReviewDisplay,
          passages: [] as PrepTestPassageSummary[],
          questions: block.questions,
        }
      }
      const block = buildLrSectionBlock(sectionNumber, sectionQuestions, apiMeta, isExperimental)
      return {
        kind: "LR" as const,
        sectionTitle: block.sectionTitle,
        isExperimental: block.isExperimental,
        scoreDisplay: block.scoreDisplay,
        blindReviewDisplay: block.blindReviewDisplay,
        passages: block.passages,
        questions: block.questions,
      }
    },
  )

  const rcSection = rcSections[0] ?? {
    sectionTitle: "Reading Comprehension",
    isExperimental: false,
    scoreDisplay: "0",
    blindReviewDisplay: "0",
    questions: [] as PrepTestQuestionResultRow[],
  }

  const firstLr = lrSections[0]
  const listedQuestionCount = questions.length

  return {
    totalQuestions,
    listedQuestionCount,
    scaledScore: api.blindReviewScore,
    correct,
    incorrect,
    correctSummary: `${correct}/${totalQuestions} CORRECT (-${incorrect})`,
    percentile: api.percentile ?? 0,
    prediction: api.scaledScore,
    blindReview: api.blindReviewScore,
    blindReviewCompleted,
    sections,
    lrSections,
    sectionBlocks,
    passages: firstLr?.passages ?? [],
    questions: firstLr?.questions ?? [],
    about: {
      questionCount: String(totalQuestions),
      timing: "—",
      timeUsed: "—",
      take: "1",
      format: "—",
      source: api.prepTestTitle,
    },
    rcSection,
    rcSections,
  }
}

export function filterPrepTestResultQuestions(
  questions: readonly PrepTestQuestionResultRow[],
  options: {
    incorrectOnly: boolean
    bookmarkedOnly: boolean
    bookmarkedIds: ReadonlySet<string>
  },
): PrepTestQuestionResultRow[] {
  return questions.filter((question) => {
    if (options.incorrectOnly && question.actualCorrect) return false
    if (options.bookmarkedOnly && !options.bookmarkedIds.has(question.id)) return false
    return true
  })
}
