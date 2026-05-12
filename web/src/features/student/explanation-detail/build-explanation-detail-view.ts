import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import type { LocatedExplanationQuestion } from "@/features/student/explanation-detail/explanation-question-index"
import { getExplanationQuestionNeighbors } from "@/features/student/explanation-detail/explanation-question-index"

const RC_BODY = `Scholars have long debated whether the earliest forms of written law emerged primarily as tools of centralization or as responses to local dispute resolution. The author argues that the second view better explains surviving tablets from the period, while acknowledging that evidence remains fragmentary.

In the second paragraph, the author contrasts two schools of thought on how precedent was recorded. Proponents of the first school emphasize royal decrees; proponents of the second emphasize merchant guild practices. The discussion sets up the author's later claim that guild records may have influenced formal codes more than has traditionally been assumed.

The final paragraph considers implications for modern statutory interpretation, suggesting that historical emphasis on top-down enactment may obscure collaborative rulemaking traditions that persisted for centuries.`

const LR_BODY = `Philosopher: A society should adopt a policy only if the policy advances the common good and does not violate individual rights. Some policies that advance the common good nonetheless violate individual rights. Therefore, some policies that advance the common good should not be adopted.`

function passageDisplayNumber(loc: LocatedExplanationQuestion): number {
  const m = /^P(\d+)$/i.exec(loc.pass.label)
  if (m) return Number.parseInt(m[1]!, 10)
  const t = /Passage\s+(\d+)/i.exec(loc.pass.title)
  if (t) return Number.parseInt(t[1]!, 10)
  return 1
}

function headingAndTrail(loc: LocatedExplanationQuestion): { headingCode: string; subtitleTrail: string } {
  const ptNum = loc.pt.prepTestNumber
  const sn = loc.sec.sectionNumber
  const pn = passageDisplayNumber(loc)
  const qn = loc.q.number
  const headingCode = `PT ${ptNum} S${sn} P${pn} Q${qn}`
  const subtitleTrail = `PrepTest ${ptNum} > Section ${sn} > Passage ${pn} > Question ${qn}`
  return { headingCode, subtitleTrail }
}

function passageBody(loc: LocatedExplanationQuestion): string {
  if (loc.sec.kind === "RC" && loc.pass.snippet) {
    return `${loc.pass.snippet.trim()}\n\n${RC_BODY}`
  }
  if (loc.sec.kind === "RC") return RC_BODY
  return LR_BODY
}

function defaultChoices(): ExplanationQuestionDetailView["choices"] {
  return [
    { id: "c1", index: 1, text: "It challenges a widely held assumption about the origins of legal codes." },
    { id: "c2", index: 2, text: "It summarizes evidence that royal decrees were the sole source of early law." },
    { id: "c3", index: 3, text: "It explains why merchant guilds declined in influence during the period." },
    { id: "c4", index: 4, text: "It argues that fragmentary evidence makes any conclusion impossible." },
    { id: "c5", index: 5, text: "It reconciles two definitions of what counts as a binding precedent." },
  ]
}

/** Rich dummy shared across questions; replace with API DTO mapping. */
export function buildExplanationQuestionDetailView(loc: LocatedExplanationQuestion): ExplanationQuestionDetailView {
  const { headingCode, subtitleTrail } = headingAndTrail(loc)
  const passageNum = passageDisplayNumber(loc)
  const neighbors = getExplanationQuestionNeighbors(loc.routeKey)

  const stem =
    loc.sec.kind === "RC"
      ? "What is the main purpose of the author's discussion in the second paragraph?"
      : loc.q.snippet || "Which one of the following most accurately describes the flaw in the philosopher's reasoning?"

  return {
    routeKey: loc.routeKey,
    headingCode,
    subtitleTrail,
    passage: {
      displayNumber: passageNum,
      title: loc.pass.title || `Passage ${passageNum}`,
      body: passageBody(loc),
    },
    questionStem: stem,
    choices: defaultChoices(),
    correctChoiceId: "c2",
    videos: [
      {
        id: "v-passage",
        headerVariant: "yellow",
        authorTitle: "JY's explanation",
        dropdownLabel: "Passage explanation",
        dropdownOptions: [
          { value: "passage", label: "Passage explanation" },
          { value: "intro", label: "Introduction" },
        ],
        postedLine: "Posted Friday, April 17, 2020 by JY Ping.",
      },
      {
        id: "v-question",
        headerVariant: "muted",
        authorTitle: "JY's explanation",
        dropdownLabel: "Question explanation",
        dropdownOptions: [
          { value: "question", label: "Question explanation" },
          { value: "elimination", label: "Answer choice elimination" },
        ],
        postedLine: `Posted Wednesday, June 3, 2020 in Section ${loc.sec.sectionNumber} with JY.`,
      },
    ],
    analytics: {
      questionDifficulty: {
        filled: 3,
        max: 5,
        label: "Medium",
        caption: "75% of people who answer get this correct",
        tone: "orange",
      },
      passageDifficulty: {
        filled: 4,
        max: 5,
        label: "Hard",
        caption: "This is a moderately difficult question. It is similar in difficulty to other questions in this passage.",
        tone: "red",
      },
      scoreBand: {
        headline: "150",
        range: "75% - 160",
        caption: "Score of students with a 50% chance of getting this right",
      },
      answerPopularity: [
        { letter: "A", pct: 2, avgScore: "152", highlight: false },
        { letter: "B", pct: 72, avgScore: "163", highlight: true },
        { letter: "C", pct: 11, avgScore: "149", highlight: false },
        { letter: "D", pct: 0, avgScore: "154", highlight: false },
        { letter: "E", pct: 14, avgScore: "156", highlight: false },
      ],
      questionStemTags: ["Purpose of paragraph", "Structure"],
      passageTags: ["Critique or debate", "Science"],
      history: [
        {
          source: "The Official LSAT PrepTest 157",
          dateLabel: "Friday, Apr 5",
          status: "in_process",
          timeRange: "00:00 / 00:25",
        },
        {
          source: "The Official LSAT PrepTest 157",
          dateLabel: "Saturday, Mar 22",
          status: "answered",
          timeRange: "01:12 / 01:45",
        },
      ],
    },
    neighbors,
  }
}
