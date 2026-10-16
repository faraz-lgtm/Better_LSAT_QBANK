import { stringify } from "npm:csv-stringify@6.5.2/sync"

import { createServiceRoleClient } from "../supabase/functions/users/users.repository.ts"
import { parseQuestionChoices } from "../supabase/functions/_shared/parse-question-choices.ts"
import {
  explanationHtmlForSave,
  prepTestNumberFromModuleId,
  questionLookupKey,
} from "./_shared/preptest-import.ts"

type CliOptions = {
  outPath: string
  onlyWithContent: boolean
}

type ExportRow = {
  prepTest: number
  section: number
  question: number
  explanation: string
  explanationA: string
  explanationB: string
  explanationC: string
  explanationD: string
  explanationE: string
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    outPath: new URL("../data/explanations_master_export.csv", import.meta.url).pathname,
    onlyWithContent: true,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--out") opts.outPath = argv[++i] ?? opts.outPath
    else if (arg === "--all") opts.onlyWithContent = false
  }

  return opts
}

function choiceExplanationByLetter(choices: unknown): Record<string, string> {
  const parsed = parseQuestionChoices(choices, { includeOptionExplanations: true })
  const out: Record<string, string> = { A: "", B: "", C: "", D: "", E: "" }
  for (const choice of parsed) {
    const letter = choice.id.toUpperCase()
    if (!(letter in out)) continue
    out[letter] = explanationHtmlForSave(choice.explanationHtml) ?? ""
  }
  return out
}

function hasAnyExplanation(row: ExportRow): boolean {
  return Boolean(
    row.explanation ||
      row.explanationA ||
      row.explanationB ||
      row.explanationC ||
      row.explanationD ||
      row.explanationE,
  )
}

async function fetchExportRows(
  client: ReturnType<typeof createServiceRoleClient>,
): Promise<ExportRow[]> {
  const byKey = new Map<string, ExportRow>()
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await client
      .from("admin_questions")
      .select(
        "id,explanation,choices,question_number,admin_sections!inner(section_number,admin_prep_tests!inner(module_id))",
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

      if (ptNumber == null || sectionNumber == null || questionNumber == null) continue

      const byLetter = choiceExplanationByLetter(row.choices)
      const exportRow: ExportRow = {
        prepTest: ptNumber,
        section: sectionNumber,
        question: questionNumber,
        explanation: explanationHtmlForSave(row.explanation as string | null) ?? "",
        explanationA: byLetter.A,
        explanationB: byLetter.B,
        explanationC: byLetter.C,
        explanationD: byLetter.D,
        explanationE: byLetter.E,
      }

      byKey.set(questionLookupKey(ptNumber, sectionNumber, questionNumber), exportRow)
    }

    if (rows.length < pageSize) break
    from += pageSize
  }

  return [...byKey.values()].sort(
    (a, b) => a.prepTest - b.prepTest || a.section - b.section || a.question - b.question,
  )
}

async function main() {
  const opts = parseArgs(Deno.args)
  const client = createServiceRoleClient()
  const allRows = await fetchExportRows(client)
  const rows = opts.onlyWithContent ? allRows.filter(hasAnyExplanation) : allRows

  const csv = stringify(
    rows.map((row) => [
      String(row.prepTest),
      String(row.section),
      String(row.question),
      row.explanation,
      row.explanationA,
      row.explanationB,
      row.explanationC,
      row.explanationD,
      row.explanationE,
    ]),
    {
      header: true,
      columns: [
        "Prep test",
        "Section",
        "Question",
        "Explanation",
        "explanation_A",
        "explanation_B",
        "explanation_C",
        "explanation_D",
        "explanation_E",
      ],
    },
  )

  await Deno.writeTextFile(opts.outPath, csv)

  console.log(`Wrote ${opts.outPath}`)
  console.log(`Questions scanned: ${allRows.length}`)
  console.log(`Rows exported: ${rows.length}${opts.onlyWithContent ? " (with explanation content)" : ""}`)
}

if (import.meta.main) {
  await main()
}
