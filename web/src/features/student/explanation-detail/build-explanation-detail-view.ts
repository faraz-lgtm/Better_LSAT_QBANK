import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import type { LocatedExplanationQuestion } from "@/features/student/explanation-detail/explanation-question-index"
import { getExplanationQuestionNeighbors } from "@/features/student/explanation-detail/explanation-question-index"
import {
  difficultyLabelFromLevel,
  tagsFromTopicName,
} from "@/features/student/practice-session/practice-results-ui"

function passageDisplayNumber(loc: LocatedExplanationQuestion): number {
  const m = /^P(\d+)$/i.exec(loc.pass.label)
  if (m) return Number.parseInt(m[1]!, 10)
  const t = /Passage\s+(\d+)/i.exec(loc.pass.title)
  if (t) return Number.parseInt(t[1]!, 10)
  return 1
}

function headingAndTrail(loc: LocatedExplanationQuestion): {
  headingCode: string
  subtitleTrail: string
  questionNumber: number
} {
  const ptNum = loc.pt.prepTestNumber
  const sn = loc.sec.sectionNumber
  const pn = passageDisplayNumber(loc)
  const questionNumber = loc.q.number
  const headingCode = `PT ${ptNum} S${sn} P${pn} Q${questionNumber}`
  const subtitleTrail = `PrepTest ${ptNum} - Section ${sn} - Passage ${pn} - Question ${questionNumber}`
  return { headingCode, subtitleTrail, questionNumber }
}

function difficultyDisplayLabel(level: number): string {
  const label = difficultyLabelFromLevel(level)
  if (label === "Hardest" || label === "Hard") return "Hard"
  if (label === "Medium") return "Medium"
  return "Easy"
}

function buildAnalytics(
  loc: LocatedExplanationQuestion,
  detail: ExplanationDetailPayload | null,
  choices: ExplanationQuestionDetailView["choices"],
): ExplanationQuestionDetailView["analytics"] {
  const diffLevel = detail?.difficulty ?? loc.q.difficulty
  const diffLabel = difficultyDisplayLabel(diffLevel)
  const tags = detail ? tagsFromTopicName(detail.topicName) : []

  const answerPopularity = resolveAnswerPopularityRows(
    detail?.answerPopularity,
    choices.length > 0 ? choices : [{ id: "A", index: 1 }, { id: "B", index: 2 }, { id: "C", index: 3 }, { id: "D", index: 4 }, { id: "E", index: 5 }],
    detail?.correctChoiceId ?? "",
  )

  const totalResponses = answerPopularity.reduce((sum, row) => sum + row.count, 0)

  return {
    questionDifficulty: {
      filled: diffLevel,
      max: 5,
      label: diffLabel,
      caption:
        diffLabel === "Medium"
          ? "75% of people who answer get this correct."
          : diffLabel === "Hard"
            ? "This is a moderately difficult question."
            : "Most students answer this question correctly.",
      tone: diffLevel >= 4 ? "red" : diffLevel >= 3 ? "teal" : "orange",
    },
    passageDifficulty: {
      filled: Math.max(1, diffLevel - 1),
      max: 5,
      label: diffLevel >= 4 ? "Hard" : diffLevel >= 3 ? "Medium" : "Easy",
      caption:
        "This is a moderately difficult question. It is similar in difficulty to other questions in this passage.",
      tone: diffLevel >= 4 ? "red" : "teal",
    },
    scoreBand: {
      headline: totalResponses > 0 ? "150" : "—",
      range: totalResponses > 0 ? "75% - 160" : "—",
      caption: "Score of students with a 50% chance of getting this right",
    },
    answerPopularity,
    answerPopularityTotal: totalResponses,
    questionStemTags: tags,
    passageTags: [],
    history: [],
  }
}

export function buildExplanationQuestionDetailView(
  loc: LocatedExplanationQuestion,
  detail: ExplanationDetailPayload | null,
): ExplanationQuestionDetailView {
  const { headingCode, subtitleTrail, questionNumber } = headingAndTrail(loc)
  const passageNum = detail?.passage.displayNumber ?? passageDisplayNumber(loc)
  const neighbors = getExplanationQuestionNeighbors(loc.routeKey)

  const stem = detail?.stemText?.trim() || loc.q.snippet || "Question"
  const passageBody = detail?.passage.body?.trim() || loc.pass.snippet || ""
  const choices =
    detail?.choices?.map((c) => ({
      id: c.id,
      index: c.index,
      text: c.text,
      explanationHtml: c.explanationHtml,
    })) ?? []

  const videos: ExplanationQuestionDetailView["videos"] = [
    {
      id: "v-passage",
      headerVariant: "yellow",
      authorTitle: "J.Y.'s explanation",
      dropdownLabel: "Passage explanation",
      dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
      postedLine: "Posted Friday, Apr 5 • Duration: 8:32",
      videoUrl: null,
      explanationHtml: null,
    },
    {
      id: "v-question",
      headerVariant: "muted",
      authorTitle: "J.Y.'s explanation",
      dropdownLabel: "Question explanation",
      dropdownOptions: [{ value: "question", label: "Question explanation" }],
      postedLine: detail?.prepTestTitle
        ? `Posted Wednesday, Jun 4, 2025 • Taken on ${detail.prepTestTitle}`
        : "Posted Wednesday, Jun 4, 2025 • Taken on LawHub",
      videoUrl: detail?.videoUrl ?? null,
      explanationHtml: detail?.explanationHtml ?? null,
    },
  ]

  return {
    routeKey: loc.routeKey,
    headingCode,
    subtitleTrail,
    questionNumber,
    passage: {
      displayNumber: passageNum,
      title: detail?.passage.title || loc.pass.title || `Passage ${passageNum}`,
      body: passageBody,
    },
    questionStem: stem,
    choices,
    correctChoiceId: detail?.correctChoiceId ?? "",
    videos,
    analytics: buildAnalytics(loc, detail, choices),
    neighbors,
    hasExplanationTab: true,
  }
}
