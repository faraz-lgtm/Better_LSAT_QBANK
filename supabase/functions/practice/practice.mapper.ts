export {
  lsacPrepTestOrdinal,
  prepTestNumberFromModuleId,
} from '../_shared/prep-test-visibility.ts'

import { parseQuestionChoices } from '../_shared/parse-question-choices.ts'

export type DrillChoice = {
  id: string
  index: number
  text: string
  explanationHtml: string | null
}

export type DrillPassage = {
  id: string
  displayNumber: number
  title: string
  body: string
}

export type DrillQuestionPayload = {
  id: string
  questionNumber: number | null
  stimulusText: string | null
  stemText: string | null
  choices: DrillChoice[]
  passage: DrillPassage | null
  /** Set only when serving completed sessions for review (not during active practice). */
  correctChoiceId?: string | null
}

type PassageRow = {
  id: string
  source_group_id: string | null
  content: string | null
  topic_tag: string | null
}

type SectionRow = {
  id: string
  section_type: 'LR' | 'RC' | 'LG' | null
  section_number: number | null
  title: string | null
  admin_passages?: PassageRow[] | PassageRow | null
}

export type DrillQuestionRow = {
  id: string
  question_number: number | null
  source_group_id: string | null
  stimulus_text: string | null
  stem_text: string | null
  choices: unknown
  correct_answer?: string | null
  admin_sections: SectionRow | SectionRow[] | null
}

function correctChoiceIdFromAnswer(
  correct: string | null | undefined,
  choices: DrillChoice[],
): string | null {
  if (!correct?.trim()) return null
  const letter = correct.trim().toUpperCase()
  const byLetter = choices.find((c) => c.id.toUpperCase() === letter)
  if (byLetter) return byLetter.id
  const idx = letter.charCodeAt(0) - 64
  if (idx >= 1 && idx <= choices.length) return choices[idx - 1]!.id
  return null
}

function relOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export function parseChoices(
  raw: unknown,
  options?: { includeOptionExplanations?: boolean },
): DrillChoice[] {
  return parseQuestionChoices(raw, options)
}

function resolvePassage(row: DrillQuestionRow, sec: SectionRow): DrillPassage | null {
  const sectionType = sec.section_type ?? 'LR'
  const sourceGroupId = row.source_group_id?.trim() ?? ''

  if (sectionType === 'RC') {
    const passagesRaw = sec.admin_passages
    const passages = Array.isArray(passagesRaw) ? passagesRaw : passagesRaw ? [passagesRaw] : []
    const pass = passages.find((p) => p.source_group_id?.trim() === sourceGroupId) ?? passages[0]
    if (pass) {
      const idx = passages.indexOf(pass) + 1
      return {
        id: pass.id,
        displayNumber: idx || 1,
        title: pass.topic_tag?.trim() || `Passage ${idx || 1}`,
        body: pass.content?.trim() ?? '',
      }
    }
  }

  if (sectionType === 'LR') {
    const stim = row.stimulus_text?.trim() ?? ''
    if (!stim) return null
    return {
      id: `lr-${sec.id}`,
      displayNumber: 1,
      title: sec.title?.trim() || 'Logical Reasoning',
      body: stim,
    }
  }

  return null
}

export function mapDrillQuestionRow(
  row: DrillQuestionRow,
  options?: { includeOptionExplanations?: boolean },
): DrillQuestionPayload {
  const sec = relOne(row.admin_sections)
  const choices = parseChoices(row.choices, options)
  const sectionType = sec?.section_type ?? 'LR'

  let stimulusText = row.stimulus_text?.trim() || null
  let passage: DrillPassage | null = null

  if (sec) {
    passage = resolvePassage(row, sec)
    if (sectionType === 'RC' && passage) {
      stimulusText = null
    }
  }

  const includeReviewFields = options?.includeOptionExplanations === true

  return {
    id: row.id,
    questionNumber: row.question_number,
    stimulusText,
    stemText: row.stem_text?.trim() || null,
    choices,
    passage,
    correctChoiceId: includeReviewFields
      ? correctChoiceIdFromAnswer(row.correct_answer, choices)
      : undefined,
  }
}

export function mapDrillQuestionRows(
  rows: DrillQuestionRow[],
  includeOptionExplanations: boolean,
): DrillQuestionPayload[] {
  return rows.map((row) => mapDrillQuestionRow(row, { includeOptionExplanations }))
}

export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = items[i]!
    items[i] = items[j]!
    items[j] = tmp
  }
  return items
}

export type DrillPoolCandidate = {
  id: string
  section_id: string | null
  source_group_id: string | null
}

export function pickDrillQuestionIds(
  pool: DrillPoolCandidate[],
  sectionType: 'LR' | 'RC',
  questionCount: number,
): string[] {
  const allowed = [1, 5, 10, 25]
  const count = allowed.includes(questionCount)
    ? questionCount
    : Math.min(25, Math.max(1, questionCount))

  if (pool.length === 0) return []

  if (sectionType === 'RC') {
    const groups = new Map<string, DrillPoolCandidate[]>()
    for (const q of pool) {
      const key = `${q.section_id ?? ''}::${q.source_group_id ?? ''}`
      const arr = groups.get(key) ?? []
      arr.push(q)
      groups.set(key, arr)
    }
    const groupList = shuffleInPlace([...groups.values()])
    const picked: string[] = []
    for (const group of groupList) {
      if (picked.length >= count) break
      for (const q of shuffleInPlace([...group])) {
        if (picked.length >= count) break
        picked.push(q.id)
      }
    }
    if (picked.length < count) {
      const pickedSet = new Set(picked)
      for (const q of shuffleInPlace(pool.filter((p) => !pickedSet.has(p.id)))) {
        if (picked.length >= count) break
        picked.push(q.id)
      }
    }
    return picked.slice(0, count)
  }

  return shuffleInPlace([...pool])
    .slice(0, Math.min(count, pool.length))
    .map((q) => q.id)
}
