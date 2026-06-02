export type ParsedQuestionChoice = {
  id: string
  index: number
  text: string
  explanationHtml: string | null
}

export type ParseQuestionChoicesOptions = {
  includeOptionExplanations?: boolean
}

function optionExplanationFromObject(o: Record<string, unknown>): string | null {
  const raw = o.optionExplanation
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? raw : null
}

export function parseQuestionChoices(
  raw: unknown,
  options: ParseQuestionChoicesOptions = {},
): ParsedQuestionChoice[] {
  const includeOptionExplanations = options.includeOptionExplanations === true
  if (!Array.isArray(raw)) return []

  return raw.map((choice, idx) => {
    const index = idx + 1
    const letter = String.fromCharCode(64 + index)

    if (typeof choice === 'string') {
      return { id: letter, index, text: choice, explanationHtml: null }
    }

    if (choice && typeof choice === 'object') {
      const o = choice as Record<string, unknown>
      const text = String(o.optionContent ?? o.text ?? '')
      const choiceLetter = String(o.optionLetter ?? letter)
      const explanationHtml = includeOptionExplanations ? optionExplanationFromObject(o) : null
      return { id: choiceLetter, index, text, explanationHtml }
    }

    return { id: letter, index, text: '', explanationHtml: null }
  })
}
