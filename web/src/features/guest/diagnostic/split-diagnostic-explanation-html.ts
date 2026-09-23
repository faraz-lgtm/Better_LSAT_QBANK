/** Split combined diagnostic write-ups into Analysis View vs answer-explanation sections. */

const STIMULUS_HEADING_RE = /<h[1-6][^>]*>\s*Stimulus Analysis\s*<\/h[1-6]>/i
const ANSWER_CHOICE_HEADING_RE = /<h[1-6][^>]*>\s*Answer Choice Analysis\s*<\/h[1-6]>/i
const CHOICE_BLOCK_RE =
  /<p>\s*<strong>\s*([A-E])\)\s*<\/strong>\s*([\s\S]*?)<\/p>/gi

export type SplitDiagnosticExplanation = {
  stimulusAnalysisHtml: string
  answerChoiceAnalysisHtml: string
}

function stripStimulusHeading(html: string): string {
  return html.replace(STIMULUS_HEADING_RE, "").trim()
}

/**
 * Marketing diagnostics store one `explanationHtml` with both sections.
 * Analysis View should show Stimulus Analysis only; Answer Choice Analysis
 * belongs in per-choice answer explanations.
 */
function splitDiagnosticExplanationHtml(html: string | null | undefined): SplitDiagnosticExplanation {
  const trimmed = typeof html === "string" ? html.trim() : ""
  if (!trimmed) {
    return { stimulusAnalysisHtml: "", answerChoiceAnalysisHtml: "" }
  }

  const answerMatch = ANSWER_CHOICE_HEADING_RE.exec(trimmed)
  if (!answerMatch || answerMatch.index == null) {
    return {
      stimulusAnalysisHtml: stripStimulusHeading(trimmed),
      answerChoiceAnalysisHtml: "",
    }
  }

  const beforeAnswer = trimmed.slice(0, answerMatch.index).trim()
  const afterAnswer = trimmed.slice(answerMatch.index + answerMatch[0].length).trim()

  return {
    stimulusAnalysisHtml: stripStimulusHeading(beforeAnswer),
    answerChoiceAnalysisHtml: afterAnswer,
  }
}

/** Parse `<p><strong>A)</strong> …</p>` blocks into letter → inner HTML. */
function parseAnswerChoiceExplanationMap(
  answerChoiceAnalysisHtml: string | null | undefined,
): Record<string, string> {
  const trimmed = typeof answerChoiceAnalysisHtml === "string" ? answerChoiceAnalysisHtml.trim() : ""
  if (!trimmed) return {}

  const out: Record<string, string> = {}
  for (const match of trimmed.matchAll(CHOICE_BLOCK_RE)) {
    const letter = match[1]?.toUpperCase()
    const body = match[2]?.trim()
    if (!letter || !body) continue
    out[letter] = `<p>${body}</p>`
  }
  return out
}

export { parseAnswerChoiceExplanationMap, splitDiagnosticExplanationHtml }
