import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2"

import type { PrepLessonType } from "../_shared/prep-lesson-type.ts"

type Json = Record<string, unknown>

export type QuestionTypeRow = {
  id: string
  name: string
  section_type: "LR" | "RC" | "LG"
  avg_per_test: number | null
  goal_accuracy: number | null
  is_active: boolean
}

export type AnalysisStatus = "draft" | "published"
export type AnalysisSegmentType = "thesis" | "premise" | "example" | "counterpoint" | "rationale" | "conclusion" | "other"

export type PassageAnalysisRow = {
  id: string
  passage_id: string
  version: number
  status: AnalysisStatus
  passage_style: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type PassageAnalysisSegmentRow = {
  id: string
  analysis_id: string
  sort_order: number
  part_label: string
  segment_type: AnalysisSegmentType
  title: string | null
  text_excerpt: string
  explanation: string
  start_char: number | null
  end_char: number | null
  created_at: string
  updated_at: string
}

export type QuestionAnalysisLinkRow = {
  id: string
  analysis_segment_id: string
  question_id: string
  note: string | null
  created_at: string
  updated_at: string
}

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  return createClient(url, key)
}

/** e.g. LSAC094 → 94; used so PrepTests sort by PT number (highest first), not string collation quirks. */
function lsacPrepTestOrdinal(moduleId: string): number | null {
  const m = /^LSAC(\d+)$/i.exec(moduleId.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function createAdminRepository(client: SupabaseClient) {
  const platformConfigKeyAliases: Record<string, string> = {
    enforce_timed_mode: "auto_advance_on_timeout",
    free_tier_preptest_max: "free_tier_pt_cutoff",
    retake_cooldown_days: "min_days_between_retakes",
    include_you_try_in_drills: "you_try_in_drills",
  }

  const platformConfigWritableKeys = new Set([
    "section_time_limit_sec",
    "student_can_toggle_timed",
    "save_time_on_pause",
    "auto_advance_on_timeout",
    "drill_per_question_sec",
    "show_elapsed_per_question",
    "blind_review_enabled",
    "blind_review_timed",
    "show_scaled_score",
    "show_raw_score",
    "show_percentile",
    "show_previous_on_retake",
    "you_try_counts_in_score",
    "free_tier_pt_cutoff",
    "allow_retakes",
    "show_answer_history_on_retake",
    "retake_analytics_mode",
    "min_days_between_retakes",
    "max_drill_questions",
    "you_try_in_drills",
    "exclude_seen_by_default",
    "drill_explanation_timing",
  ])

  function normalizePlatformConfigPatch(input: Json): Json {
    const out: Json = {}
    for (const [rawKey, value] of Object.entries(input)) {
      const canonicalKey = platformConfigKeyAliases[rawKey] ?? rawKey
      if (!platformConfigWritableKeys.has(canonicalKey)) continue
      out[canonicalKey] = value
    }
    return out
  }

  function withPlatformConfigAliases(row: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!row) return null
    return {
      ...row,
      enforce_timed_mode: row.auto_advance_on_timeout ?? null,
      free_tier_preptest_max: row.free_tier_pt_cutoff ?? null,
      retake_cooldown_days: row.min_days_between_retakes ?? null,
      include_you_try_in_drills: row.you_try_in_drills ?? null,
    }
  }

  const prepTestDetailSelect =
    "id,module_id,title,imported_at,admin_sections(id,section_id,section_number,section_type,title,module_id,admin_questions(id,question_number,explanation,difficulty,video_url,question_type_id))"

  async function resolvePrepTestGroup(prepTestId: string): Promise<{
    primary: { id: string; module_id: string; title: string | null; imported_at: string | null }
    prepTestIds: string[]
    baseModuleId: string
  }> {
    const { data: primary, error: primaryErr } = await client
      .from("admin_prep_tests")
      .select("id,module_id,title,imported_at")
      .eq("id", prepTestId)
      .single()
    if (primaryErr) throw primaryErr

    const moduleId = String(primary.module_id ?? "")
    const isSplitModule = /^LSAC\d+:.+$/i.test(moduleId)
    if (!isSplitModule) {
      return {
        primary: primary as { id: string; module_id: string; title: string | null; imported_at: string | null },
        prepTestIds: [String(primary.id)],
        baseModuleId: moduleId,
      }
    }

    const baseModuleId = moduleId.split(":")[0] ?? moduleId
    const { data: groupedRows, error: groupedErr } = await client
      .from("admin_prep_tests")
      .select("id,module_id,title,imported_at")
      .ilike("module_id", `${baseModuleId}:%`)
      .order("module_id", { ascending: true })
    if (groupedErr) throw groupedErr

    const rows = groupedRows ?? []
    return {
      primary: primary as { id: string; module_id: string; title: string | null; imported_at: string | null },
      prepTestIds: rows.length > 0 ? rows.map((row) => String(row.id)) : [String(primary.id)],
      baseModuleId,
    }
  }

  return {
    async getProfileRole(userId: string): Promise<"student" | "admin" | "super_admin" | null> {
      const { data, error } = await client.from("profiles").select("role").eq("id", userId).maybeSingle()
      if (error) throw error
      return (data?.role as "student" | "admin" | "super_admin" | undefined) ?? null
    },

    async ensureAdminProjectionFromLsac(): Promise<void> {
      const { data: modules, error: moduleErr } = await client
        .from("lsac_content_modules")
        .select("module_id,module_name,imported_at")
      if (moduleErr) throw moduleErr
      for (const module of modules ?? []) {
        const moduleId = String(module.module_id)
        const { data: prepTest, error: ptErr } = await client
          .from("admin_prep_tests")
          .upsert(
            {
              module_id: moduleId,
              title: module.module_name ?? moduleId,
              imported_at: module.imported_at ?? new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "module_id" },
          )
          .select("id")
          .single()
        if (ptErr) throw ptErr

        const { data: sections, error: sectionErr } = await client
          .from("lsac_content_sections")
          .select("section_id,section_order,section_name,directions")
          .eq("module_id", moduleId)
        if (sectionErr) throw sectionErr

        for (const section of sections ?? []) {
          const sectionType = inferSectionType(section.section_name)
          const { data: adminSection, error: adminSectionErr } = await client
            .from("admin_sections")
            .upsert(
              {
                prep_test_id: prepTest.id,
                module_id: moduleId,
                section_id: section.section_id,
                section_number: section.section_order ?? 0,
                section_type: sectionType,
                title: section.section_name,
                directions: section.directions,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "module_id,section_id" },
            )
            .select("id")
            .single()
          if (adminSectionErr) throw adminSectionErr

          const { data: items, error: itemErr } = await client
            .from("lsac_content_items")
            .select("item_id,item_position,group_id,stem_text,stimulus_text,correct_answer,options")
            .eq("module_id", moduleId)
            .eq("section_id", section.section_id)
            .order("item_position", { ascending: true })
          if (itemErr) throw itemErr

          for (const item of items ?? []) {
            const { error: upsertQuestionErr } = await client.from("admin_questions").upsert(
              {
                section_id: adminSection.id,
                source_item_id: item.item_id,
                source_group_id: item.group_id,
                question_number: item.item_position,
                stimulus_text: item.stimulus_text,
                stem_text: item.stem_text,
                choices: Array.isArray(item.options) ? item.options : [],
                correct_answer: item.correct_answer,
                source: "LSAC",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "section_id,source_item_id" },
            )
            if (upsertQuestionErr) throw upsertQuestionErr
          }
        }
      }
    },

    async listQuestionTypes(): Promise<QuestionTypeRow[]> {
      const { data, error } = await client.from("question_types").select("*").order("section_type").order("name")
      if (error) throw error
      return (data ?? []) as QuestionTypeRow[]
    },

    async createQuestionType(input: {
      name: string
      sectionType: "LR" | "RC" | "LG"
      avgPerTest?: number | null
      goalAccuracy?: number | null
    }): Promise<QuestionTypeRow> {
      const { data, error } = await client
        .from("question_types")
        .insert({
          name: input.name,
          section_type: input.sectionType,
          avg_per_test: input.avgPerTest ?? null,
          goal_accuracy: input.goalAccuracy ?? null,
        })
        .select("*")
        .single()
      if (error) throw error
      return data as QuestionTypeRow
    },

    async updateQuestionType(id: string, patch: Partial<QuestionTypeRow>): Promise<QuestionTypeRow> {
      const payload: Json = { updated_at: new Date().toISOString() }
      if (patch.name !== undefined) payload.name = patch.name
      if (patch.avg_per_test !== undefined) payload.avg_per_test = patch.avg_per_test
      if (patch.goal_accuracy !== undefined) payload.goal_accuracy = patch.goal_accuracy
      if (patch.is_active !== undefined) payload.is_active = patch.is_active
      const { data, error } = await client.from("question_types").update(payload).eq("id", id).select("*").single()
      if (error) throw error
      return data as QuestionTypeRow
    },

    async questionTypeUsageCount(id: string): Promise<number> {
      const [qResult, gResult] = await Promise.all([
        client.from("admin_questions").select("id", { count: "exact", head: true }).eq("question_type_id", id),
        client.from("admin_logic_games").select("id", { count: "exact", head: true }).eq("game_type_id", id),
      ])
      if (qResult.error) throw qResult.error
      if (gResult.error) throw gResult.error
      return (qResult.count ?? 0) + (gResult.count ?? 0)
    },

    async listPrepTests(limit = 10, offset = 0, contentFilter?: string) {
      const from = Math.max(0, offset)
      const safeLimit = Math.max(1, Math.min(limit, 100))
      const to = from + safeLimit - 1
      const filter = normalizeListPrepTestsContentFilter(contentFilter)

      const fetchPrepTests = async () => {
        const { data, error } = await client
          .from("admin_prep_tests")
          .select("id,module_id,title,imported_at,admin_sections(count)")
        if (error) throw error
        return data ?? []
      }
      let data = await fetchPrepTests()
      if (data.length === 0) {
        await this.ensureAdminProjectionFromLsac()
        data = await fetchPrepTests()
      }
      const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" })
      const lsacRows = data.filter((row) => {
        const moduleId = String(row.module_id ?? "")
        // Accept both full test modules (LSAC022) and section splits (LSAC022:LA:3:7S:S).
        return /^LSAC\d+(:.*)?$/i.test(moduleId)
      })

      type GroupedPrepTest = {
        id: string | null
        prep_test_ids: string[]
        module_id: string
        imported_at: string | null
        title: string
        rawTitles: string[]
      }

      const grouped = new Map<string, GroupedPrepTest>()

      for (const row of lsacRows) {
        const moduleId = String(row.module_id ?? "")
        const baseModuleId = moduleId.split(":")[0] ?? moduleId
        const importedAt = row.imported_at ? String(row.imported_at) : null
        const normalizedTitle = String(row.title ?? "")
          .replace(/^(Logical Reasoning|Reading Comprehension|Analytical Reasoning|Logic Games)\s*-\s*/i, "")
          .replace(/,\s*Section\s*\d+\s*$/i, "")
          .trim()

        const existing = grouped.get(baseModuleId)
        if (!existing) {
          grouped.set(baseModuleId, {
            id: row.id ? String(row.id) : null,
            prep_test_ids: row.id ? [String(row.id)] : [],
            module_id: baseModuleId,
            imported_at: importedAt,
            title: normalizedTitle || baseModuleId,
            rawTitles: normalizedTitle ? [normalizedTitle] : [],
          })
          continue
        }

        if (row.id) existing.prep_test_ids.push(String(row.id))
        if (importedAt && (!existing.imported_at || importedAt > existing.imported_at)) {
          existing.imported_at = importedAt
        }
        if (normalizedTitle) existing.rawTitles.push(normalizedTitle)
        if (!existing.id && row.id) existing.id = String(row.id)
      }

      type NormalizedPrepTestRow = {
        id: string | null
        prep_test_ids: string[]
        module_id: string
        imported_at: string | null
        title: string
      }

      const normalizedRows: NormalizedPrepTestRow[] = Array.from(grouped.values()).map((row) => {
        if (row.rawTitles.length > 0) {
          row.rawTitles.sort((a, b) => collator.compare(a, b))
          row.title = row.rawTitles[0]
        }
        return {
          id: row.id,
          prep_test_ids: row.prep_test_ids,
          module_id: row.module_id,
          imported_at: row.imported_at,
          title: row.title,
        }
      })

      normalizedRows.sort((a, b) => {
        const na = lsacPrepTestOrdinal(a.module_id)
        const nb = lsacPrepTestOrdinal(b.module_id)
        if (na !== null && nb !== null && na !== nb) return nb - na
        if (na !== null && nb === null) return -1
        if (na === null && nb !== null) return 1
        const first = collator.compare(b.module_id, a.module_id)
        if (first !== 0) return first
        return collator.compare(a.title ?? "", b.title ?? "")
      })

      type PrepStats = {
        sectionCount: number
        total: number
        explained: number
        tagged: number
        hasLr: boolean
        hasRc: boolean
        hasLg: boolean
      }

      function emptyPrepStats(): PrepStats {
        return {
          sectionCount: 0,
          total: 0,
          explained: 0,
          tagged: 0,
          hasLr: false,
          hasRc: false,
          hasLg: false,
        }
      }

      function applySectionRowToPrepStats(stats: PrepStats, section: {
        section_type: string | null
        section_id: string | null
        title: string | null
      }) {
        stats.sectionCount += 1
        const sectionType =
          normalizeSectionType(section.section_type) ??
          inferSectionType(section.section_id) ??
          inferSectionType(section.title)
        if (sectionType === "LR") stats.hasLr = true
        if (sectionType === "RC") stats.hasRc = true
        if (sectionType === "LG") stats.hasLg = true
      }

      async function fetchSectionsForPrepTestIds(prepTestIds: string[]) {
        const chunkSize = 120
        const rows: Array<{
          id: string
          prep_test_id: string
          section_type: string | null
          section_id: string | null
          title: string | null
        }> = []
        for (let i = 0; i < prepTestIds.length; i += chunkSize) {
          const chunk = prepTestIds.slice(i, i + chunkSize)
          if (chunk.length === 0) continue
          const { data: sections, error: sectionsErr } = await client
            .from("admin_sections")
            .select("id,prep_test_id,section_type,section_id,title")
            .in("prep_test_id", chunk)
          if (sectionsErr) throw sectionsErr
          rows.push(...((sections ?? []) as typeof rows))
        }
        return rows
      }

      async function fetchQuestionsForSectionIds(sectionIds: string[]) {
        type QuestionRow = {
          id: string
          section_id: string
          explanation: string | null
          question_type_id: string | null
        }
        // Keep chunk size low enough to stay below PostgREST max_rows (1000)
        // and paginate defensively in case a chunk still has >1000 rows.
        const chunkSize = 20
        const pageSize = 1000
        const rows: QuestionRow[] = []
        for (let i = 0; i < sectionIds.length; i += chunkSize) {
          const chunk = sectionIds.slice(i, i + chunkSize)
          if (chunk.length === 0) continue
          let from = 0
          while (true) {
            const to = from + pageSize - 1
            const { data: questions, error: questionsErr } = await client
              .from("admin_questions")
              .select("id,section_id,explanation,question_type_id")
              .in("section_id", chunk)
              .order("id", { ascending: true })
              .range(from, to)
            if (questionsErr) throw questionsErr
            const page = (questions ?? []) as QuestionRow[]
            rows.push(...page)
            if (page.length < pageSize) break
            from += pageSize
          }
        }
        return rows
      }

      async function buildStatsByPrepTestId(prepTestIds: string[]) {
        const uniquePrepIds = [...new Set(prepTestIds)]
        if (uniquePrepIds.length === 0) {
          return { statsByPrep: new Map<string, PrepStats>(), sectionToPrep: new Map<string, string>() }
        }

        const sectionRows = await fetchSectionsForPrepTestIds(uniquePrepIds)
        const sectionToPrep = new Map<string, string>()
        const statsByPrep = new Map<string, PrepStats>()

        for (const section of sectionRows) {
          const prepId = String(section.prep_test_id)
          sectionToPrep.set(String(section.id), prepId)
          const stats = statsByPrep.get(prepId) ?? emptyPrepStats()
          applySectionRowToPrepStats(stats, section)
          statsByPrep.set(prepId, stats)
        }

        const sectionIds = sectionRows.map((row) => String(row.id))
        const questionRows = await fetchQuestionsForSectionIds(sectionIds)
        for (const question of questionRows) {
          const prepId = sectionToPrep.get(String(question.section_id))
          if (!prepId) continue
          const stats = statsByPrep.get(prepId) ?? emptyPrepStats()
          stats.total += 1
          if (typeof question.explanation === "string" && question.explanation.trim().length > 0) stats.explained += 1
          if (question.question_type_id !== null) stats.tagged += 1
          statsByPrep.set(prepId, stats)
        }

        return { statsByPrep, sectionToPrep }
      }

      function mergeGroupedRowStats(row: NormalizedPrepTestRow, statsByPrep: Map<string, PrepStats>) {
        const merged = emptyPrepStats()
        for (const prepId of row.prep_test_ids) {
          const stats = statsByPrep.get(prepId)
          if (!stats) continue
          merged.sectionCount += stats.sectionCount
          merged.total += stats.total
          merged.explained += stats.explained
          merged.tagged += stats.tagged
          merged.hasLr = merged.hasLr || stats.hasLr
          merged.hasRc = merged.hasRc || stats.hasRc
          merged.hasLg = merged.hasLg || stats.hasLg
        }
        return merged
      }

      function rowMatchesContentFilter(merged: PrepStats, f: "all" | "lr" | "rc" | "lg" | "missing-tags") {
        if (f === "all") return true
        if (f === "lr") return merged.hasLr
        if (f === "rc") return merged.hasRc
        if (f === "lg") return merged.hasLg
        return merged.total > merged.tagged
      }

      function toListRow(row: NormalizedPrepTestRow, merged: PrepStats) {
        return {
          id: row.id,
          module_id: row.module_id,
          imported_at: row.imported_at,
          title: row.title,
          section_count: merged.sectionCount,
          question_count: merged.total,
          explained_count: merged.explained,
          tagged_count: merged.tagged,
          has_lr: merged.hasLr,
          has_rc: merged.hasRc,
          has_lg: merged.hasLg,
          has_missing_tags: merged.total > merged.tagged,
        }
      }

      if (filter !== "all") {
        const allPrepTestIds = [...new Set(normalizedRows.flatMap((row) => row.prep_test_ids))]
        const { statsByPrep } = await buildStatsByPrepTestId(allPrepTestIds)
        const filteredRows = normalizedRows
          .map((row) => ({ row, merged: mergeGroupedRowStats(row, statsByPrep) }))
          .filter(({ merged }) => rowMatchesContentFilter(merged, filter))
        const total = filteredRows.length
        const paged = filteredRows.slice(from, to + 1).map(({ row, merged }) => toListRow(row, merged))
        return { rows: paged, total }
      }

      const pagedRows = normalizedRows.slice(from, to + 1)
      const prepTestIds = [...new Set(pagedRows.flatMap((row) => row.prep_test_ids))]
      if (prepTestIds.length === 0) {
        return {
          rows: pagedRows.map((row) => toListRow(row, emptyPrepStats())),
          total: normalizedRows.length,
        }
      }

      const { statsByPrep } = await buildStatsByPrepTestId(prepTestIds)
      const rowsWithStats = pagedRows.map((row) => {
        const merged = mergeGroupedRowStats(row, statsByPrep)
        return toListRow(row, merged)
      })

      return { rows: rowsWithStats, total: normalizedRows.length }
    },

    async getPrepTestDetail(prepTestId: string) {
      const grouped = await resolvePrepTestGroup(prepTestId)
      const { data, error } = await client
        .from("admin_prep_tests")
        .select(prepTestDetailSelect)
        .in("id", grouped.prepTestIds)
      if (error) throw error

      const rows = (data ?? []) as Array<{
        id: string
        module_id: string
        title: string | null
        imported_at: string | null
        admin_sections?: unknown[]
      }>

      if (rows.length === 0) {
        throw new Error("PrepTest not found")
      }

      const allSections = rows.flatMap((row) => (Array.isArray(row.admin_sections) ? row.admin_sections : []))
      allSections.sort((a, b) => {
        const sa = Number((a as { section_number?: number | null }).section_number ?? 0)
        const sb = Number((b as { section_number?: number | null }).section_number ?? 0)
        return sa - sb
      })

      const latestImportedAt = rows
        .map((row) => row.imported_at)
        .filter((value): value is string => typeof value === "string")
        .sort()
        .at(-1) ?? null

      return {
        id: grouped.primary.id,
        module_id: grouped.baseModuleId,
        title: grouped.primary.title ?? grouped.baseModuleId,
        imported_at: latestImportedAt,
        admin_sections: allSections,
      }
    },

    async getNextQuestionForPrepTest(prepTestId: string) {
      const prepTest = await this.getPrepTestDetail(prepTestId) as {
        admin_sections?: Array<{
          id: string
          section_number: number | null
          admin_questions?: Array<{
            id: string
            question_number: number | null
            question_type_id: string | null
            difficulty: number | null
            video_url: string | null
            explanation: string | null
          }>
        }>
      }

      const sections = [...(prepTest.admin_sections ?? [])].sort(
        (a, b) => Number(a.section_number ?? 0) - Number(b.section_number ?? 0),
      )

      type QuestionCandidate = {
        id: string
        sectionId: string
        sectionNumber: number
        questionNumber: number
        isIncomplete: boolean
      }

      const candidates: QuestionCandidate[] = []
      for (const section of sections) {
        const questions = [...(section.admin_questions ?? [])].sort(
          (a, b) => Number(a.question_number ?? 0) - Number(b.question_number ?? 0),
        )
        for (const question of questions) {
          const missingType = !question.question_type_id
          const missingDifficulty = question.difficulty === null || question.difficulty === undefined
          const missingVideo = typeof question.video_url !== "string" || question.video_url.trim().length === 0
          const missingExplanation = typeof question.explanation !== "string" || question.explanation.trim().length === 0
          candidates.push({
            id: String(question.id),
            sectionId: String(section.id),
            sectionNumber: Number(section.section_number ?? 0),
            questionNumber: Number(question.question_number ?? 0),
            // A question is complete on content if either explanation OR video is present.
            isIncomplete: missingType || missingDifficulty || (missingVideo && missingExplanation),
          })
        }
      }

      const firstIncomplete = candidates.find((candidate) => candidate.isIncomplete)
      if (firstIncomplete) return firstIncomplete

      return candidates[0] ?? null
    },

    async getQuestionEditorPayload(questionId: string) {
      const { data, error } = await client
        .from("admin_questions")
        .select(
          "id,section_id,question_number,stimulus_text,stem_text,choices,correct_answer,explanation,video_url,difficulty,question_type_id,source,source_label,admin_sections(id,section_id,section_number,section_type,title,module_id,prep_test_id,admin_prep_tests(id,title),admin_passages(id,content,topic_tag),admin_logic_games(id,setup_text,rules_text,game_type_id))",
        )
        .eq("id", questionId)
        .single()
      if (error) throw error

      const parent = data.admin_sections as { prep_test_id?: string; module_id?: string } | null
      const prepTestId = parent?.prep_test_id ? String(parent.prep_test_id) : ""
      const moduleId = parent?.module_id ? String(parent.module_id) : ""
      if (!prepTestId) return { ...data, sectionOptions: [] }

      const grouped = /^LSAC\d+:.+$/i.test(moduleId)
        ? await resolvePrepTestGroup(prepTestId)
        : {
            primary: { id: prepTestId, module_id: moduleId, title: null, imported_at: null },
            prepTestIds: [prepTestId],
            baseModuleId: moduleId,
          }

      const { data: sectionRows, error: sectionsErr } = await client
        .from("admin_sections")
        .select("id,module_id,section_id,section_number,section_type,title,admin_questions(id,question_number)")
        .in("prep_test_id", grouped.prepTestIds)
        .order("section_number", { ascending: true })
      if (sectionsErr) throw sectionsErr

      const sectionOptions = (sectionRows ?? []).map((section) => {
        const questions = [...((section.admin_questions as Array<{ id: string; question_number: number | null }> | undefined) ?? [])]
        questions.sort((a, b) => Number(a.question_number ?? 0) - Number(b.question_number ?? 0))
        const moduleId = typeof (section as { module_id?: unknown }).module_id === "string" ? String((section as { module_id?: unknown }).module_id) : ""
        const moduleCode = moduleId.split(":")[1] ?? null
        const sectionType = section.section_type ? String(section.section_type) : null
        const title = section.title ? String(section.title) : null
        const sectionTokenRaw =
          typeof (section as { section_id?: unknown }).section_id === "string"
            ? String((section as { section_id?: unknown }).section_id)
            : title ?? ""
        const sectionToken = sectionTokenRaw.trim().toUpperCase()
        let inferredLabel: string | null = null
        if (sectionToken.startsWith("RC")) inferredLabel = "Reading Comprehension"
        else if (sectionToken.startsWith("AR") || sectionToken.startsWith("LG")) inferredLabel = "Analytical Reasoning"
        else if (sectionToken.startsWith("LA")) inferredLabel = "Logical Reasoning A"
        else if (sectionToken.startsWith("LB")) inferredLabel = "Logical Reasoning B"
        else if (sectionToken.startsWith("LR")) inferredLabel = "Logical Reasoning"

        const displayLabel = inferredLabel || title || sectionType || moduleCode || `Section ${Number(section.section_number ?? 0)}`
        return {
          id: String(section.id),
          sectionNumber: Number(section.section_number ?? 0),
          sectionType,
          title,
          moduleCode,
          displayLabel,
          firstQuestionId: questions[0]?.id ? String(questions[0].id) : null,
        }
      })

      return { ...data, sectionOptions }
    },

    async adminQuestionExists(questionId: string): Promise<boolean> {
      const { count, error } = await client
        .from("admin_questions")
        .select("id", { count: "exact", head: true })
        .eq("id", questionId)
      if (error) throw error
      return (count ?? 0) > 0
    },

    async getQuestionSourceById(questionId: string): Promise<"LSAC" | "PLATFORM" | null> {
      const { data, error } = await client.from("admin_questions").select("source").eq("id", questionId).maybeSingle()
      if (error) throw error
      const source = typeof data?.source === "string" ? data.source.toUpperCase() : ""
      if (source === "LSAC" || source === "PLATFORM") return source
      return null
    },

    async getPassageById(passageId: string): Promise<{ id: string; section_id: string } | null> {
      const { data, error } = await client.from("admin_passages").select("id,section_id").eq("id", passageId).maybeSingle()
      if (error) throw error
      return data as { id: string; section_id: string } | null
    },

    async getQuestionsByIds(questionIds: string[]): Promise<Array<{ id: string; section_id: string | null }>> {
      if (questionIds.length === 0) return []
      const { data, error } = await client.from("admin_questions").select("id,section_id").in("id", questionIds)
      if (error) throw error
      return (data ?? []) as Array<{ id: string; section_id: string | null }>
    },

    async listPassageAnalyses(passageId: string): Promise<PassageAnalysisRow[]> {
      const { data, error } = await client
        .from("admin_passage_analyses")
        .select("*")
        .eq("passage_id", passageId)
        .order("version", { ascending: false })
      if (error) throw error
      return (data ?? []) as PassageAnalysisRow[]
    },

    async createPassageAnalysis(input: {
      passageId: string
      version: number
      status: AnalysisStatus
      passageStyle?: string | null
      userId: string
    }): Promise<PassageAnalysisRow> {
      const { data, error } = await client
        .from("admin_passage_analyses")
        .insert({
          passage_id: input.passageId,
          version: input.version,
          status: input.status,
          passage_style: input.passageStyle ?? null,
          created_by: input.userId,
          updated_by: input.userId,
        })
        .select("*")
        .single()
      if (error) throw error
      return data as PassageAnalysisRow
    },

    async updatePassageAnalysis(
      analysisId: string,
      input: { status: AnalysisStatus; passageStyle?: string | null; userId: string },
    ): Promise<PassageAnalysisRow> {
      const { data, error } = await client
        .from("admin_passage_analyses")
        .update({
          status: input.status,
          passage_style: input.passageStyle ?? null,
          updated_by: input.userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysisId)
        .select("*")
        .single()
      if (error) throw error
      return data as PassageAnalysisRow
    },

    async listPassageAnalysisSegments(analysisId: string): Promise<PassageAnalysisSegmentRow[]> {
      const { data, error } = await client
        .from("admin_passage_analysis_segments")
        .select("*")
        .eq("analysis_id", analysisId)
        .order("sort_order", { ascending: true })
      if (error) throw error
      return (data ?? []) as PassageAnalysisSegmentRow[]
    },

    async deletePassageAnalysisSegments(analysisId: string): Promise<void> {
      const { error } = await client.from("admin_passage_analysis_segments").delete().eq("analysis_id", analysisId)
      if (error) throw error
    },

    async createPassageAnalysisSegments(
      rows: Array<{
        analysisId: string
        sortOrder: number
        partLabel: string
        segmentType: AnalysisSegmentType
        title?: string | null
        textExcerpt: string
        explanation: string
        startChar?: number | null
        endChar?: number | null
      }>,
    ): Promise<PassageAnalysisSegmentRow[]> {
      if (rows.length === 0) return []
      const payload = rows.map((row) => ({
        analysis_id: row.analysisId,
        sort_order: row.sortOrder,
        part_label: row.partLabel,
        segment_type: row.segmentType,
        title: row.title ?? null,
        text_excerpt: row.textExcerpt,
        explanation: row.explanation,
        start_char: row.startChar ?? null,
        end_char: row.endChar ?? null,
      }))
      const { data, error } = await client.from("admin_passage_analysis_segments").insert(payload).select("*")
      if (error) throw error
      return (data ?? []) as PassageAnalysisSegmentRow[]
    },

    async listQuestionAnalysisLinksByAnalysis(analysisId: string): Promise<QuestionAnalysisLinkRow[]> {
      const { data, error } = await client
        .from("admin_question_analysis_links")
        .select("id,analysis_segment_id,question_id,note,created_at,updated_at,admin_passage_analysis_segments!inner(analysis_id)")
        .eq("admin_passage_analysis_segments.analysis_id", analysisId)
      if (error) throw error
      return (data ?? []).map((row) => ({
        id: String(row.id),
        analysis_segment_id: String(row.analysis_segment_id),
        question_id: String(row.question_id),
        note: (row.note as string | null) ?? null,
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      }))
    },

    async createQuestionAnalysisLinks(
      rows: Array<{ analysisSegmentId: string; questionId: string; note?: string | null }>,
    ): Promise<QuestionAnalysisLinkRow[]> {
      if (rows.length === 0) return []
      const payload = rows.map((row) => ({
        analysis_segment_id: row.analysisSegmentId,
        question_id: row.questionId,
        note: row.note ?? null,
      }))
      const { data, error } = await client.from("admin_question_analysis_links").insert(payload).select("*")
      if (error) throw error
      return (data ?? []) as QuestionAnalysisLinkRow[]
    },

    async updateQuestionMeta(questionId: string, patch: Json) {
      const payload = { ...patch, updated_at: new Date().toISOString() }
      const { data, error } = await client
        .from("admin_questions")
        .update(payload)
        .eq("id", questionId)
        .select("id,section_id")
        .single()
      if (error) throw error
      return data
    },

    async getAdjacentQuestionIds(questionId: string, sectionId: string) {
      const { data, error } = await client
        .from("admin_questions")
        .select("id")
        .eq("section_id", sectionId)
        .order("question_number", { ascending: true, nullsFirst: false })
      if (error) throw error
      const all = (data ?? []).map((row) => String(row.id))
      const idx = all.findIndex((id) => id === questionId)
      return {
        prevId: idx > 0 ? all[idx - 1] : null,
        nextId: idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null,
        current: idx + 1,
        total: all.length,
      }
    },

    async getPrepTestCompletionStats(prepTestId: string) {
      const grouped = await resolvePrepTestGroup(prepTestId)
      const { data: sections, error: sectionErr } = await client
        .from("admin_sections")
        .select("id")
        .in("prep_test_id", grouped.prepTestIds)
      if (sectionErr) throw sectionErr
      const sectionIds = (sections ?? []).map((s) => s.id)
      if (sectionIds.length === 0) {
        return { total: 0, explained: 0, tagged: 0, difficultySet: 0 }
      }
      const [totalR, explainedR, taggedR, diffR] = await Promise.all([
        client.from("admin_questions").select("id", { count: "exact", head: true }).in("section_id", sectionIds),
        client
          .from("admin_questions")
          .select("id", { count: "exact", head: true })
          .in("section_id", sectionIds)
          .not("explanation", "is", null),
        client
          .from("admin_questions")
          .select("id", { count: "exact", head: true })
          .in("section_id", sectionIds)
          .not("question_type_id", "is", null),
        client
          .from("admin_questions")
          .select("id", { count: "exact", head: true })
          .in("section_id", sectionIds)
          .not("difficulty", "is", null),
      ])
      if (totalR.error) throw totalR.error
      if (explainedR.error) throw explainedR.error
      if (taggedR.error) throw taggedR.error
      if (diffR.error) throw diffR.error
      return {
        total: totalR.count ?? 0,
        explained: explainedR.count ?? 0,
        tagged: taggedR.count ?? 0,
        difficultySet: diffR.count ?? 0,
      }
    },

    async createYouTryQuestion(input: Json) {
      const { data, error } = await client
        .from("admin_questions")
        .insert({
          section_id: null,
          question_number: null,
          stimulus_text: input.stimulusText ?? null,
          stem_text: input.stemText ?? null,
          choices: input.choices ?? [],
          correct_answer: input.correctAnswer ?? null,
          explanation: input.explanation ?? null,
          video_url: input.videoUrl ?? null,
          difficulty: input.difficulty ?? null,
          question_type_id: input.questionTypeId ?? null,
          source_label: input.sourceLabel ?? "You Try",
          source: "PLATFORM",
        })
        .select("*")
        .single()
      if (error) throw error
      return data
    },

    async updateYouTryQuestion(questionId: string, patch: Json) {
      const updatePayload: Json = {}
      if (patch.stimulusText !== undefined) updatePayload.stimulus_text = patch.stimulusText
      if (patch.stemText !== undefined) updatePayload.stem_text = patch.stemText
      if (patch.choices !== undefined) updatePayload.choices = patch.choices
      if (patch.correctAnswer !== undefined) updatePayload.correct_answer = patch.correctAnswer
      if (patch.explanation !== undefined) updatePayload.explanation = patch.explanation
      if (patch.videoUrl !== undefined) updatePayload.video_url = patch.videoUrl
      if (patch.difficulty !== undefined) updatePayload.difficulty = patch.difficulty
      if (patch.questionTypeId !== undefined) updatePayload.question_type_id = patch.questionTypeId
      if (patch.sourceLabel !== undefined) updatePayload.source_label = patch.sourceLabel

      const { data, error } = await client
        .from("admin_questions")
        .update({ ...updatePayload, source: "PLATFORM", updated_at: new Date().toISOString() })
        .eq("id", questionId)
        .eq("source", "PLATFORM")
        .select("*")
        .single()
      if (error) throw error
      return data
    },

    async listYouTryQuestions() {
      const { data, error } = await client
        .from("admin_questions")
        .select("id,source_label,stem_text,difficulty,updated_at,created_at")
        .eq("source", "PLATFORM")
        .order("updated_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },

    async getYouTryQuestion(questionId: string) {
      const { data, error } = await client
        .from("admin_questions")
        .select("*,question_types(section_type),lesson_questions(lesson_id,prep_lessons(id,title,course_id,prep_courses(id,title)))")
        .eq("id", questionId)
        .eq("source", "PLATFORM")
        .single()
      if (error) throw error
      return data
    },

    async upsertPlatformConfig(patch: Json) {
      const normalizedPatch = normalizePlatformConfigPatch(patch)
      if (Object.keys(normalizedPatch).length === 0) {
        return await this.getPlatformConfig()
      }
      const { data, error } = await client
        .from("platform_config")
        .upsert(
          {
            id: "singleton",
            ...normalizedPatch,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("*")
        .single()
      if (error) throw error
      return withPlatformConfigAliases(data as Record<string, unknown>) ?? data
    },

    async getPlatformConfig() {
      const { data, error } = await client.from("platform_config").select("*").eq("id", "singleton").maybeSingle()
      if (error) throw error
      return withPlatformConfigAliases((data as Record<string, unknown> | null) ?? null)
    },

    async listCourses() {
      const { data, error } = await client.from("prep_courses").select("*").order("title")
      if (error) throw error
      return data ?? []
    },

    async createCourse(input: {
      slug: string
      title: string
      description?: string | null
      isPublished?: boolean
    }) {
      const { data, error } = await client
        .from("prep_courses")
        .insert({
          slug: input.slug,
          title: input.title,
          description: input.description ?? null,
          is_published: input.isPublished ?? false,
        })
        .select("*")
        .single()
      if (error) throw error
      return data
    },

    async updateCourse(courseId: string, patch: Json) {
      const { data, error } = await client
        .from("prep_courses")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", courseId)
        .select("*")
        .single()
      if (error) throw error
      return data
    },

    async deleteCourse(courseId: string) {
      const { error } = await client.from("prep_courses").delete().eq("id", courseId)
      if (error) throw error
      return { success: true }
    },

    async listLessons(courseId: string) {
      const { data, error } = await client.from("prep_lessons").select("*").eq("course_id", courseId).order("sort_order")
      if (error) throw error
      return data ?? []
    },

    async createLesson(input: {
      courseId: string
      slug: string
      title: string
      summary?: string | null
      durationMinutes?: number | null
      lessonType?: PrepLessonType
      videoUrl?: string | null
      textContent?: string | null
      isPublished?: boolean
    }) {
      const { count, error: countErr } = await client
        .from("prep_lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", input.courseId)
      if (countErr) throw countErr
      const existingLessonCount = count ?? 0
      const { data, error } = await client
        .from("prep_lessons")
        .insert({
          course_id: input.courseId,
          slug: input.slug,
          title: input.title,
          summary: input.summary ?? null,
          duration_minutes: input.durationMinutes ?? null,
          lesson_type: input.lessonType ?? "video_text",
          video_url: input.videoUrl ?? null,
          text_content: input.textContent ?? "Draft lesson content",
          is_published: input.isPublished ?? false,
          sort_order: existingLessonCount + 1,
        })
        .select("*")
        .single()
      if (error) throw error
      return data
    },

    async updateLesson(lessonId: string, patch: Json) {
      const { data, error } = await client
        .from("prep_lessons")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", lessonId)
        .select("*")
        .single()
      if (error) throw error
      return data
    },

    async deleteLesson(lessonId: string) {
      const { error } = await client.from("prep_lessons").delete().eq("id", lessonId)
      if (error) throw error
      return { success: true }
    },

    async reorderLessons(courseId: string, lessonIds: string[]) {
      for (let i = 0; i < lessonIds.length; i += 1) {
        const lessonId = lessonIds[i]
        const { error } = await client
          .from("prep_lessons")
          .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
          .eq("id", lessonId)
          .eq("course_id", courseId)
        if (error) throw error
      }
      return this.listLessons(courseId)
    },

    async getLessonLessonType(lessonId: string): Promise<string | null> {
      const { data, error } = await client.from("prep_lessons").select("lesson_type").eq("id", lessonId).maybeSingle()
      if (error) throw error
      const row = data as { lesson_type?: string } | null
      return row?.lesson_type ? String(row.lesson_type) : null
    },

    async countLessonQuestions(lessonId: string): Promise<number> {
      const { count, error } = await client
        .from("lesson_questions")
        .select("id", { count: "exact", head: true })
        .eq("lesson_id", lessonId)
      if (error) throw error
      return count ?? 0
    },

    async resolveQuestionIdFromReference(input: string): Promise<string | null> {
      const value = input.trim()
      if (!value) return null

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(value)) {
        const { data, error } = await client
          .from("admin_questions")
          .select("id")
          .eq("id", value)
          .maybeSingle()
        if (error) throw error
        return data?.id ? String(data.id) : null
      }

      const refMatch = value.match(/PT\s*0*(\d+)\D+S\s*(\d+)\D+Q\s*(\d+)/i)
      if (!refMatch) return null
      const prepTestNumber = Number(refMatch[1])
      const sectionNumber = Number(refMatch[2])
      const questionNumber = Number(refMatch[3])
      if (!Number.isFinite(prepTestNumber) || !Number.isFinite(sectionNumber) || !Number.isFinite(questionNumber)) {
        return null
      }

      const moduleId = `LSAC${String(prepTestNumber).padStart(3, "0")}`
      const { data: prepTests, error: prepErr } = await client
        .from("admin_prep_tests")
        .select("id,module_id")
        .or(`module_id.eq.${moduleId},module_id.ilike.${moduleId}:%`)
      if (prepErr) throw prepErr
      if (!prepTests || prepTests.length === 0) return null

      const prepTestIds = prepTests.map((row) => String(row.id))
      const { data: sections, error: sectionErr } = await client
        .from("admin_sections")
        .select("id,section_number")
        .in("prep_test_id", prepTestIds)
        .eq("section_number", sectionNumber)
      if (sectionErr) throw sectionErr
      if (!sections || sections.length === 0) return null

      const sectionIds = sections.map((row) => String(row.id))
      const { data: question, error: questionErr } = await client
        .from("admin_questions")
        .select("id")
        .in("section_id", sectionIds)
        .eq("question_number", questionNumber)
        .maybeSingle()
      if (questionErr) throw questionErr
      return question?.id ? String(question.id) : null
    },

    async linkQuestionToLesson(input: { lessonId: string; questionId: string; sortOrder?: number }) {
      let resolvedSortOrder = input.sortOrder
      if (!resolvedSortOrder) {
        const { data: latest, error: latestErr } = await client
          .from("lesson_questions")
          .select("sort_order")
          .eq("lesson_id", input.lessonId)
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle()
        if (latestErr) throw latestErr
        resolvedSortOrder = Number(latest?.sort_order ?? 0) + 1
      }
      const { data, error } = await client
        .from("lesson_questions")
        .insert({
          lesson_id: input.lessonId,
          question_id: input.questionId,
          sort_order: resolvedSortOrder,
        })
        .select("*")
        .single()
      if (error) throw error
      return data
    },

    async unlinkQuestionFromLesson(lessonQuestionId: string) {
      const { error } = await client.from("lesson_questions").delete().eq("id", lessonQuestionId)
      if (error) throw error
      return { success: true }
    },

    async listLessonQuestions(lessonId: string) {
      const { data, error } = await client
        .from("lesson_questions")
        .select("id,sort_order,admin_questions(id,question_number,stem_text,source,source_label,admin_sections(section_number,admin_prep_tests(title)))")
        .eq("lesson_id", lessonId)
        .order("sort_order")
      if (error) throw error
      return data ?? []
    },

    async listScoreTables() {
      const { data, error } = await client
        .from("admin_score_tables")
        .select("id,source,prep_test_id,admin_prep_tests(title,module_id),admin_score_rows(count)")
      if (error) throw error
      return data ?? []
    },

    async getScoreTable(scoreTableId: string) {
      const { data, error } = await client
        .from("admin_score_tables")
        .select("id,source,prep_test_id,admin_prep_tests(title,module_id),admin_score_rows(id,raw_score,scaled_score,percentile)")
        .eq("id", scoreTableId)
        .single()
      if (error) throw error
      return data
    },

    async updateScoreRow(scoreRowId: string, patch: Json) {
      const { data, error } = await client
        .from("admin_score_rows")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", scoreRowId)
        .select("*")
        .single()
      if (error) throw error
      return data
    },

    async createUser(input: {
      email: string
      password: string
      fullName?: string | null
      role?: "student" | "admin"
    }) {
      const { data: created, error: createErr } = await client.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: input.fullName ? { full_name: input.fullName } : undefined,
      })
      if (createErr) throw createErr
      const userId = created.user?.id
      if (!userId) throw new Error("Failed to create auth user")

      const { data: profile, error: profileErr } = await client
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: input.email,
            full_name: input.fullName ?? null,
            role: input.role ?? "student",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("id,email,full_name,role,created_at")
        .single()
      if (profileErr) throw profileErr
      return profile
    },

    async listUsers(limit: number) {
      const [profilesR, testsR] = await Promise.all([
        client.from("profiles").select("id,email,full_name,role,created_at").order("created_at", { ascending: false }).limit(limit),
        client
          .from("lsac_test_instances")
          .select("user_id,id", { count: "exact" })
          .order("updated_at", { ascending: false })
          .limit(limit * 20),
      ])
      if (profilesR.error) throw profilesR.error
      if (testsR.error) throw testsR.error
      const testCountByUser = new Map<string, number>()
      for (const row of testsR.data ?? []) {
        const userId = String(row.user_id)
        testCountByUser.set(userId, (testCountByUser.get(userId) ?? 0) + 1)
      }
      return (profilesR.data ?? []).map((row) => ({
        ...row,
        test_count: testCountByUser.get(row.id) ?? 0,
      }))
    },

    async getUserDetail(userId: string) {
      const [profileR, testsR] = await Promise.all([
        client.from("profiles").select("*").eq("id", userId).maybeSingle(),
        client.from("lsac_test_instances").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
      ])
      if (profileR.error) throw profileR.error
      if (testsR.error) throw testsR.error
      return {
        profile: profileR.data,
        tests: testsR.data ?? [],
      }
    },
  }
}

function normalizeListPrepTestsContentFilter(value: unknown): "all" | "lr" | "rc" | "lg" | "missing-tags" {
  const v = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (v === "lr" || v === "rc" || v === "lg" || v === "missing-tags") return v
  return "all"
}

function inferSectionType(sectionName: unknown): "LR" | "RC" | "LG" | null {
  const text = typeof sectionName === "string" ? sectionName.trim().toLowerCase() : ""
  if (!text) return null

  // Drill / module style identifiers (camel / kebab)
  if (text.includes("logicalreasoning")) return "LR"
  if (text.includes("readingcomprehension")) return "RC"
  if (text.includes("logicgame") || text.includes("analyticalreasoning")) return "LG"

  // Delimited LSAC-style tokens: LA:32, RC:96, AR:84
  if (/^(la|lb|lr)([:\-\s]|$)/i.test(text)) return "LR"
  if (/^rc([:\-\s]|$)/i.test(text)) return "RC"
  if (/^(ar|lg)([:\-\s]|$)/i.test(text)) return "LG"

  // Opaque LawHub-style ids: LAH0BB9, RC78ENA, ARUK4L2 (require a digit to avoid "latest"-style false positives)
  if (/^(la|lb|lr)\S*\d/i.test(text)) return "LR"
  if (/^rc\S*\d/i.test(text)) return "RC"
  if (/^(ar|lg)\S*\d/i.test(text)) return "LG"

  if (text.includes("logical reasoning")) return "LR"
  if (text.includes("reading comprehension")) return "RC"
  if (text.includes("logic game") || text.includes("analytical reasoning")) return "LG"
  return null
}

function normalizeSectionType(value: unknown): "LR" | "RC" | "LG" | null {
  const text = typeof value === "string" ? value.trim().toUpperCase() : ""
  if (text === "LR" || text === "RC" || text === "LG") return text
  return null
}

export type AdminRepository = ReturnType<typeof createAdminRepository>
