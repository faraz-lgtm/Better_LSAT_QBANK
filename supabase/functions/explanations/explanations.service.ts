import { parseQuestionChoices } from '../_shared/parse-question-choices.ts'
import type {
  ExplanationsRepository,
  PrepTestRow,
  PrepTestTreeLogicGameRow,
  PrepTestTreePassageRow,
  PrepTestTreePrepTestRow,
  PrepTestTreeQuestionRow,
  PrepTestTreeSectionRow,
  QuestionDetailRow,
} from './explanations.repository.ts'

export type ExplanationPrepTestListItem = {
  id: string
  title: string
  moduleId: string
  prepTestNumber: string | null
  questionCount: number
  explainedCount: number
}

export type ExplanationQuestionStatus = 'in_process' | 'not_started' | 'answered' | 'fresh' | 'seen'

export type ExplanationQuestionNode = {
  id: string
  number: number
  code: string
  snippet: string
  status: ExplanationQuestionStatus
  source: string
  difficulty: 1 | 2 | 3 | 4 | 5
  hasVideo?: boolean
  hasWrittenExplanation?: boolean
}

export type ExplanationPassageNode = {
  id: string
  label: string
  title: string
  snippet: string
  questions: ExplanationQuestionNode[]
}

export type ExplanationSectionNode = {
  id: string
  sectionNumber: number
  kind: 'LR' | 'RC' | 'LG'
  sectionTitle: string
  flags?: string
  passages: ExplanationPassageNode[]
}

export type ExplanationPrepTestNode = {
  id: string
  prepTestNumber: string
  rowSubtitle: string
  sections: ExplanationSectionNode[]
}

export type ExplanationDetailPayload = {
  questionId: string
  prepTestId: string
  prepTestTitle: string
  prepTestNumber: string | null
  sectionId: string
  sectionType: 'LR' | 'RC' | 'LG' | null
  sectionNumber: number | null
  questionNumber: number | null
  topicName: string
  explanationHtml: string | null
  videoUrl: string | null
  stimulusText: string | null
  stemText: string | null
  choices: { id: string; index: number; text: string; explanationHtml: string | null }[]
  correctChoiceId: string | null
  passage: {
    id: string
    displayNumber: number
    title: string
    body: string
  }
}

function relOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

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

function normalizeTitle(moduleId: string, title: string | null): string {
  const normalized = String(title ?? '')
    .replace(/^(Logical Reasoning|Reading Comprehension|Analytical Reasoning|Logic Games)\s*-\s*/i, '')
    .replace(/,\s*Section\s*\d+\s*$/i, '')
    .trim()
  return normalized || moduleId
}

type GroupedPrepTest = {
  id: string
  prepTestIds: string[]
  moduleId: string
  title: string
  importedAt: string | null
  rawTitles: string[]
}

export function groupPrepTestRows(rows: PrepTestRow[]): GroupedPrepTest[] {
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
  const lsacRows = rows.filter((row) => /^LSAC\d+(:.*)?$/i.test(String(row.module_id ?? '')))
  const grouped = new Map<string, GroupedPrepTest>()

  for (const row of lsacRows) {
    const moduleId = String(row.module_id ?? '')
    const baseModuleId = moduleId.split(':')[0] ?? moduleId
    const importedAt = row.imported_at ? String(row.imported_at) : null
    const normalizedTitle = normalizeTitle(baseModuleId, row.title)

    const existing = grouped.get(baseModuleId)
    if (!existing) {
      grouped.set(baseModuleId, {
        id: String(row.id),
        prepTestIds: [String(row.id)],
        moduleId: baseModuleId,
        title: normalizedTitle,
        importedAt,
        rawTitles: normalizedTitle ? [normalizedTitle] : [],
      })
      continue
    }

    existing.prepTestIds.push(String(row.id))
    if (importedAt && (!existing.importedAt || importedAt > existing.importedAt)) {
      existing.importedAt = importedAt
    }
    if (normalizedTitle) existing.rawTitles.push(normalizedTitle)
  }

  const out = Array.from(grouped.values()).map((row) => {
    if (row.rawTitles.length > 0) {
      row.rawTitles.sort((a, b) => collator.compare(a, b))
      row.title = row.rawTitles[0]!
    }
    return row
  })

  out.sort((a, b) => {
    const na = lsacPrepTestOrdinal(a.moduleId)
    const nb = lsacPrepTestOrdinal(b.moduleId)
    if (na !== null && nb !== null && na !== nb) return nb - na
    if (na !== null && nb === null) return -1
    if (na === null && nb !== null) return 1
    return collator.compare(b.moduleId, a.moduleId)
  })

  return out
}

function clampDifficulty(n: number | null | undefined): 1 | 2 | 3 | 4 | 5 {
  if (n == null || !Number.isFinite(n)) return 3
  return Math.min(5, Math.max(1, Math.round(n))) as 1 | 2 | 3 | 4 | 5
}

function snippetFromQuestion(q: PrepTestTreeQuestionRow): string {
  const stem = q.stem_text?.trim() ?? ''
  if (stem) return stem.length > 120 ? `${stem.slice(0, 117)}…` : stem
  const stim = q.stimulus_text?.trim() ?? ''
  if (stim) return stim.length > 120 ? `${stim.slice(0, 117)}…` : stim
  return 'Question'
}

function hasWrittenExplanation(q: PrepTestTreeQuestionRow): boolean {
  return (q.explanation?.trim() ?? '').length > 0
}

function hasVideo(q: PrepTestTreeQuestionRow): boolean {
  return (q.video_url?.trim() ?? '').length > 0
}

function mapQuestionNode(
  q: PrepTestTreeQuestionRow,
  ctx: { ptNum: string; secNum: number; passageLabel: string; prepTestTitle: string },
  status: ExplanationQuestionStatus,
): ExplanationQuestionNode {
  const num = q.question_number ?? 0
  return {
    id: q.id,
    number: num,
    code: `PT${ctx.ptNum}.S${ctx.secNum}.${ctx.passageLabel}.Q${num}`,
    snippet: snippetFromQuestion(q),
    status,
    source: ctx.prepTestTitle,
    difficulty: clampDifficulty(q.difficulty),
    hasVideo: hasVideo(q),
    hasWrittenExplanation: hasWrittenExplanation(q),
  }
}

function sortQuestions(a: PrepTestTreeQuestionRow, b: PrepTestTreeQuestionRow): number {
  return (a.question_number ?? 0) - (b.question_number ?? 0)
}

function passageSnippet(content: string | null | undefined, max = 80): string {
  const t = (content ?? '').replace(/\s+/g, ' ').trim()
  if (!t) return ''
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

function buildLrPassage(
  section: PrepTestTreeSectionRow,
  questions: PrepTestTreeQuestionRow[],
  ctx: { ptNum: string; secNum: number; prepTestTitle: string },
  statusByQ: Map<string, ExplanationQuestionStatus>,
): ExplanationPassageNode {
  const passageId = `lr-${section.id}`
  return {
    id: passageId,
    label: 'LR',
    title: 'Section questions',
    snippet: 'Stimulus-based questions in order.',
    questions: [...questions].sort(sortQuestions).map((q) =>
      mapQuestionNode(q, { ...ctx, passageLabel: 'LR' }, statusByQ.get(q.id) ?? 'fresh')
    ),
  }
}

function buildRcPassages(
  section: PrepTestTreeSectionRow,
  questions: PrepTestTreeQuestionRow[],
  passages: PrepTestTreePassageRow[],
  ctx: { ptNum: string; secNum: number; prepTestTitle: string },
  statusByQ: Map<string, ExplanationQuestionStatus>,
): ExplanationPassageNode[] {
  const byGroup = new Map<string, PrepTestTreeQuestionRow[]>()
  const ungrouped: PrepTestTreeQuestionRow[] = []

  for (const q of questions) {
    const gid = q.source_group_id?.trim() ?? ''
    if (!gid) {
      ungrouped.push(q)
      continue
    }
    const list = byGroup.get(gid) ?? []
    list.push(q)
    byGroup.set(gid, list)
  }

  const out: ExplanationPassageNode[] = []
  let passageIndex = 0

  for (const pass of passages) {
    const gid = pass.source_group_id?.trim() ?? ''
    const qs = gid ? (byGroup.get(gid) ?? []) : []
    if (gid) byGroup.delete(gid)
    if (qs.length === 0 && !pass.content?.trim()) continue
    passageIndex += 1
    out.push({
      id: pass.id,
      label: `P${passageIndex}`,
      title: pass.topic_tag?.trim() || `Passage ${passageIndex}`,
      snippet: passageSnippet(pass.content),
      questions: [...qs].sort(sortQuestions).map((q) =>
        mapQuestionNode(q, { ...ctx, passageLabel: `P${passageIndex}` }, statusByQ.get(q.id) ?? 'fresh')
      ),
    })
  }

  for (const [gid, qs] of byGroup) {
    passageIndex += 1
    out.push({
      id: `orphan-${section.id}-${gid}`,
      label: `P${passageIndex}`,
      title: `Passage ${passageIndex}`,
      snippet: '',
      questions: [...qs].sort(sortQuestions).map((q) =>
        mapQuestionNode(q, { ...ctx, passageLabel: `P${passageIndex}` }, statusByQ.get(q.id) ?? 'fresh')
      ),
    })
  }

  if (ungrouped.length > 0) {
    passageIndex += 1
    out.push({
      id: `ungrouped-${section.id}`,
      label: `P${passageIndex}`,
      title: `Passage ${passageIndex}`,
      snippet: '',
      questions: [...ungrouped].sort(sortQuestions).map((q) =>
        mapQuestionNode(q, { ...ctx, passageLabel: `P${passageIndex}` }, statusByQ.get(q.id) ?? 'fresh')
      ),
    })
  }

  return out
}

function buildLgPassages(
  section: PrepTestTreeSectionRow,
  questions: PrepTestTreeQuestionRow[],
  games: PrepTestTreeLogicGameRow[],
  ctx: { ptNum: string; secNum: number; prepTestTitle: string },
  statusByQ: Map<string, ExplanationQuestionStatus>,
): ExplanationPassageNode[] {
  const byGroup = new Map<string, PrepTestTreeQuestionRow[]>()
  for (const q of questions) {
    const gid = q.source_group_id?.trim() ?? ''
    if (!gid) continue
    const list = byGroup.get(gid) ?? []
    list.push(q)
    byGroup.set(gid, list)
  }

  const out: ExplanationPassageNode[] = []
  let gameIndex = 0
  for (const game of games) {
    const gid = game.source_group_id?.trim() ?? ''
    const qs = gid ? (byGroup.get(gid) ?? []) : []
    if (gid) byGroup.delete(gid)
    gameIndex += 1
    const setup = [game.setup_text, game.rules_text].filter(Boolean).join('\n\n')
    out.push({
      id: game.id,
      label: `G${gameIndex}`,
      title: `Game ${gameIndex}`,
      snippet: passageSnippet(setup, 100),
      questions: [...qs].sort(sortQuestions).map((q) =>
        mapQuestionNode(q, { ...ctx, passageLabel: `G${gameIndex}` }, statusByQ.get(q.id) ?? 'fresh')
      ),
    })
  }

  for (const [gid, qs] of byGroup) {
    gameIndex += 1
    out.push({
      id: `lg-orphan-${section.id}-${gid}`,
      label: `G${gameIndex}`,
      title: `Game ${gameIndex}`,
      snippet: '',
      questions: [...qs].sort(sortQuestions).map((q) =>
        mapQuestionNode(q, { ...ctx, passageLabel: `G${gameIndex}` }, statusByQ.get(q.id) ?? 'fresh')
      ),
    })
  }

  return out
}

export function mapPrepTestTreeRows(
  rows: PrepTestTreePrepTestRow[],
  primaryId: string,
  baseModuleId: string,
  primaryTitle: string,
  statusByQ: Map<string, ExplanationQuestionStatus>,
): ExplanationPrepTestNode {
  const allSections = rows.flatMap((r) => (Array.isArray(r.admin_sections) ? r.admin_sections : []))
  allSections.sort((a, b) => (a.section_number ?? 0) - (b.section_number ?? 0))

  const ptNum = prepTestNumberFromModuleId(baseModuleId) ?? baseModuleId
  const prepTestTitle = primaryTitle

  const sections: ExplanationSectionNode[] = []
  for (const sec of allSections) {
    const kind = sec.section_type ?? 'LR'
    const secNum = sec.section_number ?? sections.length + 1
    const questions = [...(sec.admin_questions ?? [])]
    const ctx = { ptNum, secNum, prepTestTitle }

    let passages: ExplanationPassageNode[] = []
    if (kind === 'LR') {
      passages = [buildLrPassage(sec, questions, ctx, statusByQ)]
    } else if (kind === 'RC') {
      passages = buildRcPassages(
        sec,
        questions,
        sec.admin_passages ?? [],
        ctx,
        statusByQ,
      )
    } else if (kind === 'LG') {
      passages = buildLgPassages(sec, questions, sec.admin_logic_games ?? [], ctx, statusByQ)
    }

    const explainedInSection = questions.filter((q) => hasWrittenExplanation(q) || hasVideo(q)).length
    sections.push({
      id: sec.id,
      sectionNumber: secNum,
      kind,
      sectionTitle: sec.title?.trim() || kind,
      flags: explainedInSection > 0 ? `${explainedInSection} explained` : undefined,
      passages,
    })
  }

  const explainedTotal = allSections
    .flatMap((s) => s.admin_questions ?? [])
    .filter((q) => hasWrittenExplanation(q) || hasVideo(q)).length

  return {
    id: primaryId,
    prepTestNumber: ptNum,
    rowSubtitle: explainedTotal > 0 ? `${explainedTotal} questions with explanations` : 'No explanations yet',
    sections,
  }
}

function correctChoiceIdFromAnswer(correct: string | null, choices: { id: string; index: number }[]): string | null {
  if (!correct?.trim()) return null
  const letter = correct.trim().toUpperCase()
  const byLetter = choices.find((c) => c.id.toUpperCase() === letter)
  if (byLetter) return byLetter.id
  const idx = letter.charCodeAt(0) - 64
  if (idx >= 1 && idx <= choices.length) return choices[idx - 1]!.id
  return null
}

type QuestionDetailSection = {
  id: string
  section_type: 'LR' | 'RC' | 'LG' | null
  section_number: number | null
  title: string | null
  admin_passages?: PrepTestTreePassageRow[] | null
  admin_logic_games?: PrepTestTreeLogicGameRow[] | null
}

function resolvePassageForQuestion(
  row: QuestionDetailRow,
  sec: QuestionDetailSection,
): { id: string; displayNumber: number; title: string; body: string } {
  const sectionType = sec.section_type ?? 'LR'
  const sourceGroupId = row.source_group_id?.trim() ?? ''

  if (sectionType === 'RC') {
    const passages = sec.admin_passages ?? []
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

  if (sectionType === 'LG') {
    const games = sec.admin_logic_games ?? []
    const game = games.find((g) => g.source_group_id?.trim() === sourceGroupId) ?? games[0]
    if (game) {
      const idx = games.indexOf(game) + 1
      const body = [game.setup_text, game.rules_text].filter(Boolean).join('\n\n')
      return {
        id: game.id,
        displayNumber: idx || 1,
        title: `Game ${idx || 1}`,
        body,
      }
    }
  }

  const stim = row.stimulus_text?.trim() ?? ''
  return {
    id: `lr-${sec.id}`,
    displayNumber: 1,
    title: sec.title?.trim() || 'Logical Reasoning',
    body: stim,
  }
}

export type ListPrepTestsOptions = {
  page?: number
  pageSize?: number
  sort?: 'newest' | 'oldest'
}

export type ListPrepTestsResult = {
  prepTests: ExplanationPrepTestListItem[]
  total: number
  page: number
  pageSize: number
}

export function createExplanationsService(deps: { repository: ExplanationsRepository }) {
  return {
    async listPrepTests(options: ListPrepTestsOptions = {}): Promise<ListPrepTestsResult> {
      const page = Math.max(1, Math.floor(options.page ?? 1))
      const pageSize = Math.min(50, Math.max(1, Math.floor(options.pageSize ?? 5)))
      const sort = options.sort === 'oldest' ? 'oldest' : 'newest'

      const rows = await deps.repository.listAllPrepTestRows()
      let grouped = groupPrepTestRows(rows)
      if (sort === 'oldest') {
        grouped = [...grouped].reverse()
      }

      const total = grouped.length
      const start = (page - 1) * pageSize
      const pageGroups = grouped.slice(start, start + pageSize)

      const prepTests: ExplanationPrepTestListItem[] = []
      for (const g of pageGroups) {
        const stats = await deps.repository.fetchQuestionStatsForPrepTestIds(g.prepTestIds)
        prepTests.push({
          id: g.id,
          title: g.title,
          moduleId: g.moduleId,
          prepTestNumber: prepTestNumberFromModuleId(g.moduleId),
          questionCount: stats.questionCount,
          explainedCount: stats.explainedCount,
        })
      }

      return { prepTests, total, page, pageSize }
    },

    async getPrepTestTree(userId: string, prepTestId: string): Promise<{ prepTest: ExplanationPrepTestNode }> {
      const grouped = await deps.repository.resolvePrepTestGroup(prepTestId)
      const rows = await deps.repository.fetchPrepTestTreeRows(grouped.prepTestIds)
      if (rows.length === 0) throw new Error('PrepTest not found')

      const allQuestionIds = rows
        .flatMap((r) => (r.admin_sections ?? []).flatMap((s) => (s.admin_questions ?? []).map((q) => q.id)))
      const answerStatus = await deps.repository.listLatestAnswerStatusByQuestionIds(userId, allQuestionIds)
      const statusByQ = new Map<string, ExplanationQuestionStatus>()
      for (const [qid] of answerStatus) {
        statusByQ.set(qid, 'answered')
      }

      const title = normalizeTitle(grouped.baseModuleId, grouped.primary.title)
      const prepTest = mapPrepTestTreeRows(
        rows,
        grouped.primary.id,
        grouped.baseModuleId,
        title,
        statusByQ,
      )

      return { prepTest }
    },

    async getExplanationDetail(userId: string, questionId: string): Promise<ExplanationDetailPayload> {
      const row = await deps.repository.getQuestionDetail(questionId)
      if (!row) throw new Error('Question not found')

      const secRaw = relOne(row.admin_sections)
      if (!secRaw) throw new Error('Question not found')
      const sec = secRaw as QuestionDetailSection & {
        admin_prep_tests?: { id: string; title: string; module_id: string } | { id: string; title: string; module_id: string }[] | null
      }

      const pt = relOne(sec.admin_prep_tests)
      const qt = relOne(row.question_types)
      const moduleId = pt?.module_id ?? ''
      const prepTestTitle = pt?.title?.trim() || 'PrepTest'
      const expl = row.explanation?.trim() ?? ''
      const vid = row.video_url?.trim() ?? ''
      const choices = parseQuestionChoices(row.choices, { includeOptionExplanations: true })

      return {
        questionId: row.id,
        prepTestId: pt?.id ?? '',
        prepTestTitle,
        prepTestNumber: prepTestNumberFromModuleId(moduleId),
        sectionId: sec.id,
        sectionType: sec.section_type,
        sectionNumber: sec.section_number,
        questionNumber: row.question_number,
        topicName: qt?.name?.trim() || '—',
        explanationHtml: expl.length > 0 ? row.explanation : null,
        videoUrl: vid.length > 0 ? row.video_url : null,
        stimulusText: row.stimulus_text,
        stemText: row.stem_text,
        choices,
        correctChoiceId: correctChoiceIdFromAnswer(row.correct_answer, choices),
        passage: resolvePassageForQuestion(row, sec),
      }
    },
  }
}

export type ExplanationsService = ReturnType<typeof createExplanationsService>
