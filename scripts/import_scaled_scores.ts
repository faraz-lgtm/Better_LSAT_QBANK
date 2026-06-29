import { parse } from "npm:csv-parse@5.6.0/sync"

import { createServiceRoleClient } from "../supabase/functions/users/users.repository.ts"
import {
  parseScaledScoreCsvRows,
  resolvePrimaryPrepTestId,
  selectScaledScoreFiles,
} from "./_shared/preptest-import.ts"

type CliOptions = {
  dryRun: boolean
  dirPath: string
  prepTest: number | null
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dryRun: false,
    dirPath: new URL("../scaled_score/", import.meta.url).pathname,
    prepTest: null,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--dry-run") opts.dryRun = true
    else if (arg === "--dir") opts.dirPath = argv[++i] ?? opts.dirPath
    else if (arg === "--prep-test") {
      const n = Number(argv[++i])
      opts.prepTest = Number.isInteger(n) ? n : null
    }
  }

  return opts
}

async function listCsvFilenames(dirPath: string): Promise<string[]> {
  const names: string[] = []
  for await (const entry of Deno.readDir(dirPath)) {
    if (entry.isFile) names.push(entry.name)
  }
  return names.sort((a, b) => a.localeCompare(b))
}

function readScaledScoreRows(filePath: string) {
  const text = Deno.readTextFileSync(filePath)
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Record<string, string>[]
  return parseScaledScoreCsvRows(records)
}

async function upsertScoreTable(
  client: ReturnType<typeof createServiceRoleClient>,
  prepTestId: string,
): Promise<string> {
  const { data, error } = await client
    .from("admin_score_tables")
    .upsert(
      {
        prep_test_id: prepTestId,
        source: "MANUAL",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "prep_test_id" },
    )
    .select("id")
    .single()
  if (error) throw error
  return String(data.id)
}

async function upsertScoreRows(
  client: ReturnType<typeof createServiceRoleClient>,
  scoreTableId: string,
  rows: ReturnType<typeof parseScaledScoreCsvRows>,
) {
  const now = new Date().toISOString()
  const chunkSize = 100

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize).map((row) => ({
      score_table_id: scoreTableId,
      raw_score: row.rawScore,
      scaled_score: row.scaledScore,
      percentile: null,
      updated_at: now,
    }))

    const { error } = await client
      .from("admin_score_rows")
      .upsert(chunk, { onConflict: "score_table_id,raw_score" })
    if (error) throw error
  }
}

async function main() {
  const opts = parseArgs(Deno.args)
  const filenames = await listCsvFilenames(opts.dirPath)
  let files = selectScaledScoreFiles(filenames)

  if (opts.prepTest != null) {
    files = files.filter((f) => f.prepTestNumber === opts.prepTest)
  }

  console.log(`Directory: ${opts.dirPath}`)
  console.log(`Selected ${files.length} score table file(s)`)
  if (opts.dryRun) console.log("Dry run — no database writes.")

  const client = createServiceRoleClient()
  let importedPts = 0
  let importedRows = 0
  let skippedPts = 0

  for (const file of files) {
    const filePath = `${opts.dirPath.replace(/\/$/, "")}/${file.path}`
    const rows = readScaledScoreRows(filePath)
    if (rows.length === 0) {
      console.log(`PT ${file.prepTestNumber}: skip (no valid rows in ${file.path})`)
      skippedPts += 1
      continue
    }

    const prepTestId = await resolvePrimaryPrepTestId(client, file.prepTestNumber)
    if (!prepTestId) {
      console.log(`PT ${file.prepTestNumber}: skip (no admin_prep_tests row for LSAC${file.prepTestNumber})`)
      skippedPts += 1
      continue
    }

    if (opts.dryRun) {
      console.log(`PT ${file.prepTestNumber}: would import ${rows.length} rows from ${file.path}`)
      importedPts += 1
      importedRows += rows.length
      continue
    }

    const scoreTableId = await upsertScoreTable(client, prepTestId)
    await upsertScoreRows(client, scoreTableId, rows)
    console.log(`PT ${file.prepTestNumber}: imported ${rows.length} rows from ${file.path}`)
    importedPts += 1
    importedRows += rows.length
  }

  console.log(
    `Done. PrepTests=${importedPts}, score rows=${importedRows}, skipped=${skippedPts}`,
  )
}

if (import.meta.main) {
  await main()
}
