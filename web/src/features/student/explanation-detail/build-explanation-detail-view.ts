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

function headingAndTrail(loc: LocatedExplanationQuestion): { headingCode: string; subtitleTrail: string } {
  const ptNum = loc.pt.prepTestNumber
  const sn = loc.sec.sectionNumber
  const pn = passageDisplayNumber(loc)
  const qn = loc.q.number
  const headingCode = `PT ${ptNum} S${sn} P${pn} Q${qn}`
  const subtitleTrail = `PrepTest ${ptNum} > Section ${sn} > Passage ${pn} > Question ${qn}`
  return { headingCode, subtitleTrail }
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
  const bankLabel = difficultyLabelFromLevel(diffLevel)
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
      caption: detail
        ? `Question bank difficulty (${bankLabel}).`
        : "Based on question difficulty in the question bank.",
      tone: diffLevel >= 4 ? "red" : "orange",
    },
    passageDifficulty: {
      filled: diffLevel,
      max: 5,
      label: diffLabel,
      caption: "Passage-level difficulty uses the same scale until passage metrics ship.",
      tone: "orange",
    },
    scoreBand: {
      headline: totalResponses > 0 ? String(totalResponses) : "—",
      range: totalResponses > 0 ? "platform responses" : "—",
      caption:
        totalResponses > 0
          ? "Students who answered this question on the platform (latest pick per user)."
          : "Score band analytics coming soon.",
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
  const { headingCode, subtitleTrail } = headingAndTrail(loc)
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

  const videos: ExplanationQuestionDetailView["videos"] = []
  if (detail?.videoUrl) {
    videos.push({
      id: "v-question",
      headerVariant: "muted",
      authorTitle: "Video explanation",
      dropdownLabel: "Question explanation",
      dropdownOptions: [{ value: "question", label: "Question explanation" }],
      postedLine: detail.prepTestTitle,
      videoUrl: detail.videoUrl,
      explanationHtml: detail.explanationHtml,
    })
  } else if (detail?.explanationHtml) {
    videos.push({
      id: "v-written",
      headerVariant: "yellow",
      authorTitle: "Written explanation",
      dropdownLabel: "Written explanation",
      dropdownOptions: [{ value: "written", label: "Written explanation" }],
      postedLine: detail.prepTestTitle,
      explanationHtml: detail.explanationHtml,
    })
  }

  return {
    routeKey: loc.routeKey,
    headingCode,
    subtitleTrail,
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
    hasExplanationTab: Boolean(detail?.videoUrl || detail?.explanationHtml),
  }
}
