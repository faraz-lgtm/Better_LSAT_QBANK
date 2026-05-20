export function lsacPrepTestOrdinal(moduleId: string): number | null {
  const m = /^LSAC(\d+)$/i.exec(moduleId.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function prepTestNumberFromModuleId(moduleId: string): string | null {
  const n = lsacPrepTestOrdinal(moduleId.split(':')[0] ?? moduleId)
  return n != null ? String(n) : null
}

export type DrillChoice = { id: string; index: number; text: string }

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
  admin_sections: SectionRow | SectionRow[] | null
}

function relOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export function parseChoices(raw: unknown): DrillChoice[] {
  if (!Array.isArray(raw)) return []
  return raw.map((choice, idx) => {
    const index = idx + 1
    const letter = String.fromCharCode(64 + index)
    if (typeof choice === 'string') {
      return { id: letter, index, text: choice }
    }
    if (choice && typeof choice === 'object') {
      const o = choice as Record<string, unknown>
      const text = String(o.optionContent ?? o.text ?? '')
      const choiceLetter = String(o.optionLetter ?? letter)
      return { id: choiceLetter, index, text }
    }
    return { id: letter, index, text: '' }
  })
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

export function mapDrillQuestionRow(row: DrillQuestionRow): DrillQuestionPayload {
  const sec = relOne(row.admin_sections)
  const choices = parseChoices(row.choices)
  const sectionType = sec?.section_type ?? 'LR'

  let stimulusText = row.stimulus_text?.trim() || null
  let passage: DrillPassage | null = null

  if (sec) {
    passage = resolvePassage(row, sec)
    if (sectionType === 'RC' && passage) {
      stimulusText = null
    }
  }

  return {
    id: row.id,
    questionNumber: row.question_number,
    stimulusText,
    stemText: row.stem_text?.trim() || null,
    choices,
    passage,
  }
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
