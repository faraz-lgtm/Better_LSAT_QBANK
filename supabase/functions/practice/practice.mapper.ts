export {
  lsacPrepTestOrdinal,
  prepTestNumberFromModuleId,
} from '../_shared/prep-test-visibility.ts'

import { parseQuestionChoices } from '../_shared/parse-question-choices.ts'
import { LR_DRILL_MAX_QUESTION_COUNT } from './adaptive-drill-config.ts'

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
  /** LSAC/RC passage group id — used for nav dividers when passage rows lack source_group_id. */
  sourceGroupId?: string | null
  /** 1–5 difficulty for target-time pacing; null when unknown. */
  difficulty?: number | null
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
  difficulty?: number | null
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

function normalizePassages(sec: SectionRow): PassageRow[] {
  const raw = sec.admin_passages
  return Array.isArray(raw) ? raw : raw ? [raw] : []
}

function passageFromRow(pass: PassageRow, displayNumber: number): DrillPassage {
  return {
    id: pass.id,
    displayNumber,
    title: pass.topic_tag?.trim() || `Passage ${displayNumber}`,
    body: pass.content?.trim() ?? '',
  }
}

/**
 * Assign each RC source_group_id a distinct passage.
 * Avoids collapsing every question onto passages[0] when passage.source_group_id is missing.
 */
function buildRcPassageByGroupId(rows: DrillQuestionRow[]): Map<string, DrillPassage> {
  const byGroup = new Map<string, DrillPassage>()
  const groupOrder: string[] = []
  let passages: PassageRow[] = []

  for (const row of rows) {
    const sec = relOne(row.admin_sections)
    if (!sec || sec.section_type !== 'RC') continue
    if (passages.length === 0) passages = normalizePassages(sec)
    const gid = row.source_group_id?.trim() ?? ''
    if (gid && !groupOrder.includes(gid)) groupOrder.push(gid)
  }

  for (const gid of groupOrder) {
    const matched = passages.find((p) => p.source_group_id?.trim() === gid)
    if (matched) {
      byGroup.set(gid, passageFromRow(matched, passages.indexOf(matched) + 1))
    }
  }

  const usedPassageIds = new Set([...byGroup.values()].map((p) => p.id))
  const unmatchedPassages = passages.filter((p) => !usedPassageIds.has(p.id))
  let unmatchedIdx = 0
  for (let i = 0; i < groupOrder.length; i += 1) {
    const gid = groupOrder[i]!
    if (byGroup.has(gid)) continue
    const pass = unmatchedPassages[unmatchedIdx]
    if (pass) {
      unmatchedIdx += 1
      byGroup.set(gid, passageFromRow(pass, passages.indexOf(pass) + 1))
    } else {
      byGroup.set(gid, {
        id: `rc-group:${gid}`,
        displayNumber: i + 1,
        title: `Passage ${i + 1}`,
        body: '',
      })
    }
  }

  return byGroup
}

function resolvePassage(
  row: DrillQuestionRow,
  sec: SectionRow,
  rcPassageByGroup?: Map<string, DrillPassage>,
): DrillPassage | null {
  const sectionType = sec.section_type ?? 'LR'
  const sourceGroupId = row.source_group_id?.trim() ?? ''

  if (sectionType === 'RC') {
    if (sourceGroupId && rcPassageByGroup?.has(sourceGroupId)) {
      const mapped = rcPassageByGroup.get(sourceGroupId)!
      if (mapped.body) return mapped
      const stim = row.stimulus_text?.trim() ?? ''
      return stim ? { ...mapped, body: stim } : mapped
    }

    const passages = normalizePassages(sec)
    if (sourceGroupId) {
      const matched = passages.find((p) => p.source_group_id?.trim() === sourceGroupId)
      if (matched) return passageFromRow(matched, passages.indexOf(matched) + 1)
      const stim = row.stimulus_text?.trim() ?? ''
      return {
        id: `rc-group:${sourceGroupId}`,
        displayNumber: 1,
        title: 'Passage',
        body: stim || (passages[0]?.content?.trim() ?? ''),
      }
    }

    // Legacy questions with no source_group_id — single shared passage fallback.
    if (passages[0]) {
      return passageFromRow(passages[0], 1)
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
  options?: {
    includeOptionExplanations?: boolean
    rcPassageByGroup?: Map<string, DrillPassage>
  },
): DrillQuestionPayload {
  const sec = relOne(row.admin_sections)
  const choices = parseChoices(row.choices, options)
  const sectionType = sec?.section_type ?? 'LR'
  const sourceGroupId = row.source_group_id?.trim() || null

  let stimulusText = row.stimulus_text?.trim() || null
  let passage: DrillPassage | null = null

  if (sec) {
    passage = resolvePassage(row, sec, options?.rcPassageByGroup)
    if (sectionType === 'RC' && passage) {
      stimulusText = null
    }
  }

  const includeReviewFields = options?.includeOptionExplanations === true

  const difficulty =
    typeof row.difficulty === 'number' && Number.isFinite(row.difficulty)
      ? Math.max(1, Math.min(5, Math.round(row.difficulty)))
      : null

  return {
    id: row.id,
    questionNumber: row.question_number,
    stimulusText,
    stemText: row.stem_text?.trim() || null,
    choices,
    passage,
    sourceGroupId,
    difficulty,
    correctChoiceId: includeReviewFields
      ? correctChoiceIdFromAnswer(row.correct_answer, choices)
      : undefined,
  }
}

export function mapDrillQuestionRows(
  rows: DrillQuestionRow[],
  includeOptionExplanations: boolean,
): DrillQuestionPayload[] {
  const rcPassageByGroup = buildRcPassageByGroupId(rows)
  return rows.map((row) =>
    mapDrillQuestionRow(row, {
      includeOptionExplanations,
      rcPassageByGroup,
    }),
  )
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

function groupRcPassageCandidates(pool: DrillPoolCandidate[]): DrillPoolCandidate[][] {
  const groups = new Map<string, DrillPoolCandidate[]>()
  for (const q of pool) {
    const key = `${q.section_id ?? ''}::${q.source_group_id ?? ''}`
    const arr = groups.get(key) ?? []
    arr.push(q)
    groups.set(key, arr)
  }
  return [...groups.values()]
}

function isFreshRcPassageGroup(
  group: DrillPoolCandidate[],
  answeredIds: ReadonlySet<string>,
): boolean {
  return group.every((q) => !answeredIds.has(q.id))
}

/**
 * RC drills pick complete passages (all questions in each group).
 * Fresh passages are shuffled first, then already-answered passages.
 */
export function pickRcDrillQuestionIdsByPassageCount(
  pool: DrillPoolCandidate[],
  passageCount: number | 'unlimited',
  answeredIds: ReadonlySet<string> = new Set(),
): string[] {
  if (pool.length === 0) return []
  const groups = groupRcPassageCandidates(pool)
  const fresh = shuffleInPlace(groups.filter((group) => isFreshRcPassageGroup(group, answeredIds)))
  const reviewed = shuffleInPlace(
    groups.filter((group) => !isFreshRcPassageGroup(group, answeredIds)),
  )
  const ordered = [...fresh, ...reviewed]
  const selected =
    passageCount === 'unlimited' ? ordered : ordered.slice(0, Math.max(1, passageCount))
  return selected.flatMap((group) => group.map((q) => q.id))
}

export function pickDrillQuestionIds(
  pool: DrillPoolCandidate[],
  sectionType: 'LR' | 'RC',
  questionCount: number | 'unlimited',
): string[] {
  if (pool.length === 0) return []

  if (sectionType === 'LR' && questionCount === 'unlimited') {
    return shuffleInPlace([...pool]).map((q) => q.id)
  }

  const count = Math.min(
    LR_DRILL_MAX_QUESTION_COUNT,
    Math.max(1, Math.floor(typeof questionCount === 'number' ? questionCount : 1)),
  )

  if (sectionType === 'RC') {
    const groupList = shuffleInPlace(groupRcPassageCandidates(pool))
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
