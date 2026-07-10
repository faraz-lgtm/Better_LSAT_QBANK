import type { SupabaseClient } from "npm:@supabase/supabase-js@2"

import { parseQuestionChoices } from "../../supabase/functions/_shared/parse-question-choices.ts"

export type ExplanationCsvRow = {
  prepTest: number
  section: number
  question: number
  explanation: string | null
  explanationA: string | null
  explanationB: string | null
  explanationC: string | null
  explanationD: string | null
  explanationE: string | null
}

export type QuestionLookupEntry = {
  id: string
  choices: unknown
}

export type ScaledScoreCsvRow = {
  rawScore: number
  scaledScore: number
}

export type ScaledScoreFileInfo = {
  path: string
  prepTestNumber: number
  priority: number
}

const LSAC_MODULE_RE = /^LSAC(\d+)(?::.*)?$/i
const TEST_FILE_RE = /^Test_(\d+)_/i
const LSATSCORE_FILE_RE = /^lsatscore(\d+)\.csv$/i
const CONVERSION_FILE_RE = /^LSAT_Score_Conversion(\d+)\.csv$/i

export function prepTestNumberFromModuleId(moduleId: string): number | null {
  const m = LSAC_MODULE_RE.exec(moduleId.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function moduleIdFromPrepTestNumber(ptNumber: number): string {
  return `LSAC${ptNumber}`
}

export function questionLookupKey(ptNumber: number, sectionNumber: number, questionNumber: number): string {
  return `${ptNumber}-${sectionNumber}-${questionNumber}`
}

export function parseScaledScoreFilename(filename: string): number | null {
  const base = filename.trim()
  const testMatch = TEST_FILE_RE.exec(base)
  if (testMatch) return Number(testMatch[1])

  const lsatMatch = LSATSCORE_FILE_RE.exec(base)
  if (lsatMatch) return Number(lsatMatch[1])

  const conversionMatch = CONVERSION_FILE_RE.exec(base)
  if (conversionMatch) return Number(conversionMatch[1])

  return null
}

export function scaledScoreFilePriority(filename: string): number | null {
  const base = filename.trim()
  if (TEST_FILE_RE.test(base)) return 1
  if (LSATSCORE_FILE_RE.test(base)) return 2
  if (CONVERSION_FILE_RE.test(base)) return 3
  return null
}

/** Pick one CSV per PT; lower priority number wins. */
export function selectScaledScoreFiles(filenames: string[]): ScaledScoreFileInfo[] {
  const byPt = new Map<number, ScaledScoreFileInfo>()

  for (const name of filenames) {
    if (!name.toLowerCase().endsWith(".csv")) continue
    const pt = parseScaledScoreFilename(name)
    const priority = scaledScoreFilePriority(name)
    if (pt == null || priority == null) continue

    const candidate: ScaledScoreFileInfo = { path: name, prepTestNumber: pt, priority }
    const existing = byPt.get(pt)
    if (!existing || candidate.priority < existing.priority) {
      byPt.set(pt, candidate)
    }
  }

  return [...byPt.values()].sort((a, b) => a.prepTestNumber - b.prepTestNumber)
}

export function explanationHtmlForSave(html: string | null | undefined): string | null {
  if (html == null) return null
  const trimmed = html.trim()
  if (!trimmed) return null
  const textOnly = trimmed.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim()
  if (!textOnly) return null
  return trimmed
}

export function mergeChoiceExplanations(
  choices: unknown,
  row: Pick<
    ExplanationCsvRow,
    "explanationA" | "explanationB" | "explanationC" | "explanationD" | "explanationE"
  >,
): unknown[] {
  const letterToExplanation: Record<string, string | null> = {
    A: explanationHtmlForSave(row.explanationA),
    B: explanationHtmlForSave(row.explanationB),
    C: explanationHtmlForSave(row.explanationC),
    D: explanationHtmlForSave(row.explanationD),
    E: explanationHtmlForSave(row.explanationE),
  }

  const rawArray = Array.isArray(choices) ? choices : []
  const parsed = parseQuestionChoices(rawArray, { includeOptionExplanations: true })

  if (parsed.length === 0) {
    const out: Record<string, string>[] = []
    for (const letter of ["A", "B", "C", "D", "E"]) {
      const expl = letterToExplanation[letter]
      if (!expl) continue
      out.push({ optionLetter: letter, optionContent: "", optionExplanation: expl })
    }
    return out
  }

  return parsed.map((choice) => {
    const letter = choice.id.toUpperCase()
    const newExpl = letterToExplanation[letter]
    const raw = rawArray[choice.index - 1]

    if (typeof raw === "string") {
      const out: Record<string, string> = {
        optionLetter: letter,
        optionContent: raw,
      }
      const expl = newExpl ?? choice.explanationHtml
      if (expl) out.optionExplanation = expl
      return out
    }

    if (raw && typeof raw === "object") {
      const base = { ...(raw as Record<string, unknown>) }
      base.optionLetter = String(base.optionLetter ?? letter)
      const expl = newExpl ?? choice.explanationHtml
      if (expl) {
        base.optionExplanation = expl
      } else {
        delete base.optionExplanation
      }
      return base
    }

    const out: Record<string, string> = {
      optionLetter: letter,
      optionContent: choice.text,
    }
    const expl = newExpl ?? choice.explanationHtml
    if (expl) out.optionExplanation = expl
    return out
  })
}

export async function resolvePrimaryPrepTestId(
  client: SupabaseClient,
  ptNumber: number,
): Promise<string | null> {
  const moduleId = moduleIdFromPrepTestNumber(ptNumber)

  const { data: exact, error: exactErr } = await client
    .from("admin_prep_tests")
    .select("id")
    .eq("module_id", moduleId)
    .maybeSingle()
  if (exactErr) throw exactErr
  if (exact?.id) return String(exact.id)

  const { data: splits, error: splitErr } = await client
    .from("admin_prep_tests")
    .select("id,module_id")
    .ilike("module_id", `${moduleId}:%`)
    .order("module_id", { ascending: true })
    .limit(1)
  if (splitErr) throw splitErr
  const splitRow = splits?.[0]
  return splitRow?.id ? String(splitRow.id) : null
}

export async function buildQuestionLookupIndex(
  client: SupabaseClient,
): Promise<Map<string, QuestionLookupEntry>> {
  const index = new Map<string, QuestionLookupEntry>()
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await client
      .from("admin_questions")
      .select(
        "id,choices,question_number,admin_sections!inner(section_number,admin_prep_tests!inner(module_id))",
      )
      .range(from, from + pageSize - 1)
    if (error) throw error

    const rows = data ?? []
    for (const row of rows) {
      const section = row.admin_sections as unknown as {
        section_number: number | null
        admin_prep_tests: { module_id: string } | { module_id: string }[] | null
      } | null
      const prepTestRaw = section?.admin_prep_tests
      const prepTest = Array.isArray(prepTestRaw) ? prepTestRaw[0] : prepTestRaw
      const ptNumber = prepTest?.module_id ? prepTestNumberFromModuleId(prepTest.module_id) : null
      const sectionNumber = section?.section_number
      const questionNumber = row.question_number

      if (
        ptNumber == null ||
        sectionNumber == null ||
        questionNumber == null ||
        !row.id
      ) {
        continue
      }

      const key = questionLookupKey(ptNumber, sectionNumber, questionNumber)
      index.set(key, { id: String(row.id), choices: row.choices })
    }

    if (rows.length < pageSize) break
    from += pageSize
  }

  return index
}

export function dedupeExplanationRows(
  rows: ExplanationCsvRow[],
): { unique: ExplanationCsvRow[]; duplicateKeysCollapsed: number } {
  const map = new Map<string, ExplanationCsvRow>()
  let duplicateKeysCollapsed = 0

  for (const row of rows) {
    const key = questionLookupKey(row.prepTest, row.section, row.question)
    if (map.has(key)) duplicateKeysCollapsed += 1
    map.set(key, row)
  }

  return { unique: [...map.values()], duplicateKeysCollapsed }
}

export function parseScaledScoreCsvRows(
  records: Record<string, string>[],
): ScaledScoreCsvRow[] {
  const rows: ScaledScoreCsvRow[] = []

  for (const record of records) {
    const rawKey = Object.keys(record).find((k) => k.toLowerCase().includes("raw"))
    const scaledKey = Object.keys(record).find((k) =>
      k.toLowerCase().includes("lsat") || k.toLowerCase().includes("scaled")
    )
    if (!rawKey || !scaledKey) continue

    const rawScore = Number(String(record[rawKey] ?? "").trim())
    const scaledScore = Number(String(record[scaledKey] ?? "").trim())
    if (!Number.isInteger(rawScore) || !Number.isInteger(scaledScore)) continue
    if (scaledScore < 120 || scaledScore > 180) continue

    rows.push({ rawScore, scaledScore })
  }

  return rows
}

export function parseExplanationCsvRecord(record: Record<string, string>): ExplanationCsvRow | null {
  const prepRaw = String(record["Prep test"] ?? record.prep_test ?? "").trim()
  const sectionRaw = String(record.Section ?? record.section ?? "").trim()
  const questionRaw = String(record.Question ?? record.question ?? "").trim()

  const prepTest = Number(prepRaw)
  const section = Number(sectionRaw)
  const question = Number(questionRaw)
  if (!Number.isInteger(prepTest) || !Number.isInteger(section) || !Number.isInteger(question)) {
    return null
  }

  return {
    prepTest,
    section,
    question,
    explanation: explanationHtmlForSave(record.Explanation ?? record.explanation),
    explanationA: explanationHtmlForSave(record.explanation_A),
    explanationB: explanationHtmlForSave(record.explanation_B),
    explanationC: explanationHtmlForSave(record.explanation_C),
    explanationD: explanationHtmlForSave(record.explanation_D),
    explanationE: explanationHtmlForSave(record.explanation_E),
  }
}
