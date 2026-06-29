import { parse } from "npm:csv-parse@5.6.0/sync"

import { createServiceRoleClient } from "../supabase/functions/users/users.repository.ts"
import {
  buildQuestionLookupIndex,
  dedupeExplanationRows,
  mergeChoiceExplanations,
  parseExplanationCsvRecord,
  questionLookupKey,
  type ExplanationCsvRow,
} from "./_shared/preptest-import.ts"

type CliOptions = {
  dryRun: boolean
  csvPath: string
  limit: number | null
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dryRun: false,
    csvPath: new URL("../bulk_import_final.csv", import.meta.url).pathname,
    limit: null,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--dry-run") opts.dryRun = true
    else if (arg === "--csv") opts.csvPath = argv[++i] ?? opts.csvPath
    else if (arg === "--limit") {
      const n = Number(argv[++i])
      opts.limit = Number.isFinite(n) && n > 0 ? Math.floor(n) : null
    }
  }

  return opts
}

function readExplanationCsv(csvPath: string): ExplanationCsvRow[] {
  const text = Deno.readTextFileSync(csvPath)
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Record<string, string>[]

  const rows: ExplanationCsvRow[] = []
  for (const record of records) {
    const parsed = parseExplanationCsvRecord(record)
    if (parsed) rows.push(parsed)
  }
  return rows
}

function isRowEmpty(row: ExplanationCsvRow): boolean {
  return (
    !row.explanation &&
    !row.explanationA &&
    !row.explanationB &&
    !row.explanationC &&
    !row.explanationD &&
    !row.explanationE
  )
}

async function main() {
  const opts = parseArgs(Deno.args)
  const allRows = readExplanationCsv(opts.csvPath)
  const { unique, duplicateKeysCollapsed } = dedupeExplanationRows(allRows)
  const rows = opts.limit != null ? unique.slice(0, opts.limit) : unique

  console.log(`CSV: ${opts.csvPath}`)
  console.log(`Rows read: ${allRows.length}, unique: ${unique.length}, duplicate keys collapsed: ${duplicateKeysCollapsed}`)
  if (opts.limit != null) console.log(`Limit: processing first ${rows.length} unique rows`)

  const client = createServiceRoleClient()
  const index = await buildQuestionLookupIndex(client)

  let missing = 0
  let skippedEmpty = 0
  const missingSamples: string[] = []
  const updates: Array<{ id: string; explanation: string | null; choices: unknown[] }> = []

  for (const row of rows) {
    if (isRowEmpty(row)) {
      skippedEmpty += 1
      continue
    }

    const key = questionLookupKey(row.prepTest, row.section, row.question)
    const entry = index.get(key)
    if (!entry) {
      missing += 1
      if (missingSamples.length < 20) {
        missingSamples.push(`PT ${row.prepTest} S${row.section} Q${row.question}`)
      }
      continue
    }

    updates.push({
      id: entry.id,
      explanation: row.explanation,
      choices: mergeChoiceExplanations(entry.choices, row) as unknown[],
    })
  }

  console.log(`Matched: ${updates.length}, missing: ${missing}, skipped empty: ${skippedEmpty}`)
  if (missingSamples.length > 0) {
    console.log("Missing samples:", missingSamples.join(", "))
  }

  if (opts.dryRun) {
    console.log("Dry run — no database writes.")
    return
  }

  const chunkSize = 50
  let updated = 0
  const now = new Date().toISOString()

  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize)
    await Promise.all(
      chunk.map(async (patch) => {
        const { error } = await client
          .from("admin_questions")
          .update({
            explanation: patch.explanation,
            choices: patch.choices,
            updated_at: now,
          })
          .eq("id", patch.id)
        if (error) throw error
      }),
    )
    updated += chunk.length
    if (updated % 200 === 0 || updated === updates.length) {
      console.log(`Updated ${updated}/${updates.length}`)
    }
  }

  console.log(`Done. Updated ${updated} questions.`)
}

if (import.meta.main) {
  await main()
}
