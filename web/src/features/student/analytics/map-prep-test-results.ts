import type { PrepTestSessionDetail } from "@/lib/api/analytics"
import type {
  PrepTestLrSectionBlock,
  PrepTestQuestionResultRow,
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
  q: PrepTestSessionDetail["questions"][number],
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
    answerPopularity: [20, 20, 20, 20, 20],
    correctLetter,
  }
}

function buildSectionSummary(
  sectionNumber: number,
  kind: PrepTestSectionKind,
  questions: PrepTestSessionDetail["questions"],
): PrepTestSectionSummary {
  const outcomes: QuestionResultStatus[] = questions.map((q) =>
    q.actualCorrect ? "correct" : "incorrect",
  )
  const correct = outcomes.filter((o) => o === "correct").length
  const total = questions.length
  const incorrect = total - correct
  return {
    id: `section-${sectionNumber}-${kind}`,
    kind,
    longName: kind === "LR" ? "Logical Reasoning" : "Reading Comprehension",
    sectionLabel: `Section ${sectionNumber}`,
    scoreDelta: -incorrect,
    questionRows: chunk(outcomes, QUESTIONS_PER_ROW),
    accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
  }
}

function buildLrSectionBlock(
  sectionNumber: number,
  questions: PrepTestSessionDetail["questions"],
  api: Pick<PrepTestSessionDetail, "moduleId" | "prepTestTitle">,
): PrepTestLrSectionBlock {
  const incorrect = questions.filter((q) => !q.actualCorrect).length
  const blindIncorrect = questions.filter((q) => !q.blindReviewCorrect).length
  return {
    sectionTitle: `Section ${sectionNumber}`,
    scoreDisplay: formatScoreDelta(incorrect),
    blindReviewDisplay: formatScoreDelta(blindIncorrect),
    passages: [],
    questions: questions.map((q) => mapQuestionRow(q, api)),
  }
}

function buildRcSectionBlock(
  sectionNumber: number,
  questions: PrepTestSessionDetail["questions"],
  api: Pick<PrepTestSessionDetail, "moduleId" | "prepTestTitle">,
): PrepTestResultsDetail["rcSection"] {
  const incorrect = questions.filter((q) => !q.actualCorrect).length
  const blindIncorrect = questions.filter((q) => !q.blindReviewCorrect).length
  return {
    sectionTitle: `Section ${sectionNumber}`,
    scoreDisplay: formatScoreDelta(incorrect),
    blindReviewDisplay: formatScoreDelta(blindIncorrect),
    questions: questions.map((q) => mapQuestionRow(q, api)),
  }
}

function groupQuestionsBySection(questions: PrepTestSessionDetail["questions"]) {
  const groups = new Map<string, PrepTestSessionDetail["questions"]>()
  for (const q of questions) {
    const sectionType = q.sectionType === "RC" ? "RC" : "LR"
    const sectionNumber = q.sectionNumber ?? 1
    const key = `${sectionNumber}:${sectionType}`
    const list = groups.get(key) ?? []
    list.push(q)
    groups.set(key, list)
  }
  return [...groups.entries()]
    .map(([key, qs]) => {
      const [num, type] = key.split(":")
      return {
        sectionNumber: Number(num),
        sectionType: type as PrepTestSectionKind,
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
  const incorrect = api.incorrect
  const correct = api.correct
  const grouped = groupQuestionsBySection(api.questions)

  const sections: PrepTestSectionSummary[] = grouped.map(({ sectionNumber, sectionType, questions }) =>
    buildSectionSummary(sectionNumber, sectionType, questions),
  )

  const apiMeta = { moduleId: api.moduleId, prepTestTitle: api.prepTestTitle }

  const lrSections: PrepTestLrSectionBlock[] = grouped
    .filter((g) => g.sectionType === "LR")
    .map(({ sectionNumber, questions }) => buildLrSectionBlock(sectionNumber, questions, apiMeta))

  const rcGroup = grouped.filter((g) => g.sectionType === "RC").at(-1)
  const rcSection = rcGroup
    ? buildRcSectionBlock(rcGroup.sectionNumber, rcGroup.questions, apiMeta)
    : {
        sectionTitle: "Reading Comprehension",
        scoreDisplay: "0",
        blindReviewDisplay: "0",
        questions: [] as PrepTestQuestionResultRow[],
      }

  const firstLr = lrSections[0]

  return {
    totalQuestions: api.totalQuestions,
    scaledScore: api.blindReviewScore,
    correct,
    incorrect,
    correctSummary: `${correct}/${api.totalQuestions} CORRECT (-${incorrect})`,
    percentile: api.percentile ?? 0,
    prediction: api.scaledScore,
    blindReview: api.blindReviewScore,
    sections,
    lrSections,
    passages: firstLr?.passages ?? [],
    questions: firstLr?.questions ?? [],
    about: {
      questionCount: String(api.totalQuestions),
      timing: "—",
      timeUsed: "—",
      take: "1",
      format: "—",
      source: api.prepTestTitle,
    },
    rcSection,
  }
}
