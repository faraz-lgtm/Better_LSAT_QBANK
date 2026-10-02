import { parse } from "npm:csv-parse@5.6.0/sync"
import { fromFileUrl } from "jsr:@std/path@1"

import { buildPassageParagraphAnalyses } from "../supabase/functions/_shared/rc-passage-analysis.ts"
import { createServiceRoleClient } from "../supabase/functions/users/users.repository.ts"
import type { SupabaseClient } from "npm:@supabase/supabase-js@2"

type CliOptions = {
  dryRun: boolean
  csvPath: string
  limit: number | null
}

type RcPassageCsvRow = {
  prepTest: string
  sourceGroupId: string
  passageHtml: string
  explanationHtml: string
  overallHtml: string
}

type PassageRef = { id: string; source_group_id: string; created?: boolean }

function defaultCsvPath(): string {
  return fromFileUrl(
    new URL(
      "../BetterLSAT_RC_Passage_Explanations - RC Passage Explanations.csv",
      import.meta.url,
    ),
  )
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dryRun: false,
    csvPath: defaultCsvPath(),
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

function parseRcPassageCsv(csvPath: string): RcPassageCsvRow[] {
  const text = Deno.readTextFileSync(csvPath)
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Record<string, string>[]

  const rows: RcPassageCsvRow[] = []
  for (const record of records) {
    const explanationHtml = (record.explanation_html ?? "").trim()
    if (!explanationHtml) continue
    const sourceGroupId = (record.source_group_id ?? "").trim()
    if (!sourceGroupId) continue
    rows.push({
      prepTest: (record.prep_test ?? "").trim(),
      sourceGroupId,
      passageHtml: record.passage_html ?? "",
      explanationHtml,
      overallHtml: (record.overall_html ?? "").trim(),
    })
  }
  return rows
}

/** Distinct RC section ids that already have questions for this source_group_id. */
async function listSectionIdsForGroup(
  client: SupabaseClient,
  sourceGroupId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("admin_questions")
    .select("section_id")
    .eq("source_group_id", sourceGroupId)
  if (error) throw error

  const ids = new Set<string>()
  for (const row of (data ?? []) as { section_id: string | null }[]) {
    const sid = row.section_id?.trim()
    if (sid) ids.add(sid)
  }
  return [...ids]
}

/**
 * Ensure an `admin_passages` row exists for each section that uses this group.
 * Creates missing rows from CSV `passage_html`.
 */
async function ensurePassagesForGroup(
  client: SupabaseClient,
  row: RcPassageCsvRow,
  dryRun: boolean,
): Promise<{ passages: PassageRef[]; created: number; missingSections: boolean }> {
  const sectionIds = await listSectionIdsForGroup(client, row.sourceGroupId)
  if (sectionIds.length === 0) {
    return { passages: [], created: 0, missingSections: true }
  }

  const { data: existing, error: existingErr } = await client
    .from("admin_passages")
    .select("id, source_group_id, section_id")
    .eq("source_group_id", row.sourceGroupId)
  if (existingErr) throw existingErr

  const bySection = new Map<string, PassageRef>()
  for (const pass of (existing ?? []) as Array<{
    id: string
    source_group_id: string
    section_id: string
  }>) {
    bySection.set(pass.section_id, {
      id: pass.id,
      source_group_id: pass.source_group_id,
    })
  }

  let created = 0
  const passages: PassageRef[] = []

  for (const sectionId of sectionIds) {
    const found = bySection.get(sectionId)
    if (found) {
      passages.push(found)
      continue
    }

    if (dryRun) {
      created += 1
      passages.push({
        id: `dry-run-${sectionId}`,
        source_group_id: row.sourceGroupId,
        created: true,
      })
      continue
    }

    const { data: inserted, error: insertErr } = await client
      .from("admin_passages")
      .insert({
        section_id: sectionId,
        source_group_id: row.sourceGroupId,
        content: row.passageHtml || null,
      })
      .select("id, source_group_id")
      .single()
    if (insertErr) throw insertErr

    created += 1
    passages.push({
      id: String(inserted.id),
      source_group_id: String(inserted.source_group_id),
      created: true,
    })
  }

  return { passages, created, missingSections: false }
}

async function publishAnalysisForPassage(
  client: SupabaseClient,
  passageId: string,
  row: RcPassageCsvRow,
  segments: ReturnType<typeof buildPassageParagraphAnalyses>,
): Promise<number> {
  const { data: existing, error: existingErr } = await client
    .from("admin_passage_analyses")
    .select("id, version")
    .eq("passage_id", passageId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existingErr) throw existingErr

  const nextVersion = existing ? Number(existing.version) + 1 : 1
  const { data: analysis, error: analysisErr } = await client
    .from("admin_passage_analyses")
    .insert({
      passage_id: passageId,
      version: nextVersion,
      status: "published",
      overall_html: row.overallHtml || null,
    })
    .select("id")
    .single()
  if (analysisErr) throw analysisErr

  const analysisId = String(analysis.id)
  const segmentPayload = segments.map((seg) => ({
    analysis_id: analysisId,
    sort_order: seg.index,
    part_label: seg.label,
    segment_type: "other" as const,
    title: seg.label,
    text_excerpt: seg.textExcerpt,
    explanation: seg.explanationHtml,
  }))

  const { error: segErr } = await client
    .from("admin_passage_analysis_segments")
    .insert(segmentPayload)
  if (segErr) throw segErr

  if (existing) {
    const { error: demoteErr } = await client
      .from("admin_passage_analyses")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .eq("passage_id", passageId)
      .neq("id", analysisId)
      .eq("status", "published")
    if (demoteErr) throw demoteErr
  }

  return nextVersion
}

async function main() {
  const opts = parseArgs(Deno.args)
  const allRows = parseRcPassageCsv(opts.csvPath)
  const rows = opts.limit != null ? allRows.slice(0, opts.limit) : allRows

  console.log(`CSV: ${opts.csvPath}`)
  console.log(`Rows with explanation_html: ${allRows.length}`)
  if (opts.limit != null) console.log(`Limit: processing first ${rows.length}`)
  if (opts.dryRun) console.log("Dry run — no writes")

  const client = createServiceRoleClient()

  let missingGroup = 0
  let imported = 0
  let passagesCreated = 0
  let skippedEmptySegments = 0
  const missingSamples: string[] = []

  for (const row of rows) {
    const segments = buildPassageParagraphAnalyses(row.passageHtml, row.explanationHtml)
    if (segments.length === 0) {
      skippedEmptySegments += 1
      continue
    }

    const ensured = await ensurePassagesForGroup(client, row, opts.dryRun)
    if (ensured.missingSections || ensured.passages.length === 0) {
      missingGroup += 1
      if (missingSamples.length < 20) {
        missingSamples.push(`${row.sourceGroupId} (PT ${row.prepTest}) — no questions/sections`)
      }
      continue
    }

    passagesCreated += ensured.created

    if (opts.dryRun) {
      imported += ensured.passages.length
      console.log(
        `[dry-run] ${row.sourceGroupId}: ${ensured.passages.length} passage(s)` +
          ` (${ensured.created} would create), ${segments.length} paragraph(s)`,
      )
      continue
    }

    for (const passage of ensured.passages) {
      const version = await publishAnalysisForPassage(client, passage.id, row, segments)
      imported += 1
      const createdNote = passage.created ? " [passage created]" : ""
      console.log(
        `Imported ${row.sourceGroupId} → passage ${passage.id} v${version}` +
          ` (${segments.length} paragraphs)${createdNote}`,
      )
    }
  }

  console.log(`Imported analyses: ${imported}`)
  console.log(`Passages created: ${passagesCreated}`)
  console.log(`Missing groups (no questions): ${missingGroup}`)
  console.log(`Skipped empty segment sets: ${skippedEmptySegments}`)
  if (missingSamples.length > 0) {
    console.log("Missing samples:")
    for (const sample of missingSamples) console.log(`  - ${sample}`)
  }
}

if (import.meta.main) {
  await main()
}
