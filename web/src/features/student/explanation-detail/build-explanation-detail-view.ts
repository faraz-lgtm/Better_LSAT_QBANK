import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import type { LocatedExplanationQuestion } from "@/features/student/explanation-detail/explanation-question-index"
import { getExplanationQuestionNeighbors } from "@/features/student/explanation-detail/explanation-question-index"
import {
  difficultyLabelFromLevel,
  tagsFromTopicName,
} from "@/features/student/practice-session/practice-results-ui"
import {
  NOT_ENOUGH_ANSWERS_YET,
  hasEnoughPlatformAnswerSample,
  platformAnswerSampleSize,
} from "@/lib/platform-answer-sample"

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

type DifficultyBand = "Easy" | "Medium" | "Hard"

function difficultyBandFromFilled(filled: number): DifficultyBand {
  if (filled >= 4) return "Hard"
  if (filled >= 3) return "Medium"
  return "Easy"
}

function difficultyTone(band: DifficultyBand): "green" | "teal" | "red" {
  if (band === "Hard") return "red"
  if (band === "Medium") return "teal"
  return "green"
}

function questionDifficultyCaption(band: DifficultyBand): string {
  if (band === "Medium") return "This is a moderately difficult question."
  if (band === "Hard") return "This is a difficult question."
  return "This question is relatively easy."
}

function passageDifficultyCaption(band: DifficultyBand): string {
  if (band === "Hard") {
    return "A moderately difficult question — similar in difficulty to others in this passage."
  }
  if (band === "Medium") {
    return "This passage is moderately difficult compared to others on the test."
  }
  return "This passage is relatively easy compared to others on the test."
}

function buildAnalytics(
  loc: LocatedExplanationQuestion,
  detail: ExplanationDetailPayload | null,
  choices: ExplanationQuestionDetailView["choices"],
): ExplanationQuestionDetailView["analytics"] {
  const diffLevel = detail?.difficulty ?? loc.q.difficulty
  const tags = detail ? tagsFromTopicName(detail.topicName) : []

  const resolvedPopularity = resolveAnswerPopularityRows(
    detail?.answerPopularity,
    choices.length > 0 ? choices : [{ id: "A", index: 1 }, { id: "B", index: 2 }, { id: "C", index: 3 }, { id: "D", index: 4 }, { id: "E", index: 5 }],
    detail?.correctChoiceId ?? "",
  )

  const totalResponses = detail?.answerPopularityTotal ?? platformAnswerSampleSize(resolvedPopularity)
  const answerPopularity = hasEnoughPlatformAnswerSample(totalResponses) ? resolvedPopularity : []
  const questionBand = difficultyDisplayLabel(diffLevel) as DifficultyBand
  const passageFilled = Math.max(1, Math.min(5, diffLevel + 1))
  const passageBand = difficultyBandFromFilled(passageFilled)

  return {
    questionDifficulty: {
      filled: diffLevel,
      max: 5,
      label: questionBand,
      caption: questionDifficultyCaption(questionBand),
      tone: difficultyTone(questionBand),
    },
    passageDifficulty: {
      filled: passageFilled,
      max: 5,
      label: passageBand,
      caption: passageDifficultyCaption(passageBand),
      tone: difficultyTone(passageBand),
    },
    scoreBand: {
      headline: "—",
      range: "—",
      caption: NOT_ENOUGH_ANSWERS_YET,
    },
    answerPopularity,
    answerPopularityTotal: totalResponses,
    userSelectedLetter: (() => {
      const letter = detail?.userSelectedLetter?.trim().toUpperCase().slice(0, 1) ?? ""
      return /^[A-E]$/.test(letter) ? letter : null
    })(),
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

  const hasWritten = Boolean(detail?.explanationHtml?.trim())
  const hasVideo = Boolean(detail?.videoUrl?.trim())

  const correctChoiceId = detail?.correctChoiceId ?? ""
  const correctChoiceLetter = (() => {
    const match = choices.find((c) => c.id === correctChoiceId)
    if (match) {
      const fromId = match.id.trim().toUpperCase().slice(0, 1)
      if (/^[A-E]$/.test(fromId)) return fromId
      if (match.index >= 1 && match.index <= 5) return String.fromCharCode(64 + match.index)
    }
    const letter = correctChoiceId.trim().toUpperCase().slice(0, 1)
    return /^[A-E]$/.test(letter) ? letter : ""
  })()

  const videos: ExplanationQuestionDetailView["videos"] = [
    {
      id: "v-passage",
      headerVariant: "yellow",
      authorTitle: "J.Y.'s explanation",
      dropdownLabel: "Passage explanation",
      dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
      postedLine: "Posted Friday, Apr 5 • Duration: 8:32",
      videoUrl: null,
      explanationHtml: detail?.explanationHtml ?? null,
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
      explanationHtml: null,
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
    passageAnalysis: detail?.passageAnalysis ?? null,
    questionStem: stem,
    questionExplanationHtml: detail?.explanationHtml ?? null,
    choices,
    correctChoiceId,
    correctChoiceLetter,
    videos,
    analytics: buildAnalytics(loc, detail, choices),
    neighbors,
    hasExplanationTab: hasWritten || hasVideo,
  }
}
