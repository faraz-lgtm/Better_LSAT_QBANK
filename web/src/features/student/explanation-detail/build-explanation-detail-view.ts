import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import type { LocatedExplanationQuestion } from "@/features/student/explanation-detail/explanation-question-index"
import { getExplanationQuestionNeighbors } from "@/features/student/explanation-detail/explanation-question-index"

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

function stubAnalytics(loc: LocatedExplanationQuestion): ExplanationQuestionDetailView["analytics"] {
  const diff = loc.q.difficulty
  return {
    questionDifficulty: {
      filled: diff,
      max: 5,
      label: diff >= 4 ? "Hard" : diff >= 3 ? "Medium" : "Easy",
      caption: "Based on question difficulty in the question bank.",
      tone: diff >= 4 ? "red" : "orange",
    },
    passageDifficulty: {
      filled: diff,
      max: 5,
      label: diff >= 4 ? "Hard" : "Medium",
      caption: "Passage-level analytics coming soon.",
      tone: "orange",
    },
    scoreBand: {
      headline: "—",
      range: "—",
      caption: "Score band analytics coming soon.",
    },
    answerPopularity: [],
    questionStemTags: [],
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
    analytics: stubAnalytics(loc),
    neighbors,
    hasExplanationTab: Boolean(detail?.videoUrl || detail?.explanationHtml),
  }
}
