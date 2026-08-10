import type { DrillQuestion } from "@/features/student/drills/drill-types"
import { passageBreakAfterIndices } from "@/features/student/practice-session/question-nav-passage-breaks"
import type { SupabaseClient } from "@supabase/supabase-js"

type QuestionGroupRow = {
  id: string
  source_group_id: string | null
}

/**
 * When the practice edge mapper still collapses every RC question onto passages[0],
 * nav dividers never appear. Attach source_group_id only — never replace passage
 * title/body (those come from the session payload / edge mapper).
 */
function shouldEnrichRcQuestions(questions: readonly DrillQuestion[]): boolean {
  if (questions.length < 2) return false
  if (passageBreakAfterIndices(questions).size > 0) return false
  const passageIds = new Set(
    questions.map((q) => q.passage?.id?.trim()).filter((id): id is string => Boolean(id)),
  )
  return passageIds.size <= 1
}

function applySourceGroupIds(
  questions: DrillQuestion[],
  groupByQuestionId: ReadonlyMap<string, string>,
): DrillQuestion[] {
  return questions.map((q) => {
    const gid = groupByQuestionId.get(q.id)
    if (!gid || q.sourceGroupId) return q
    return { ...q, sourceGroupId: gid }
  })
}

async function enrichRcPassageGroups(
  supabase: SupabaseClient,
  questions: DrillQuestion[],
  _sectionId: string | null,
): Promise<DrillQuestion[]> {
  if (!shouldEnrichRcQuestions(questions)) return questions

  const ids = questions.map((q) => q.id)
  const { data: groupRows, error: groupError } = await supabase
    .from("admin_questions")
    .select("id, source_group_id")
    .in("id", ids)

  if (groupError || !groupRows?.length) return questions

  const groupByQuestionId = new Map<string, string>()
  for (const row of groupRows as QuestionGroupRow[]) {
    const gid = row.source_group_id?.trim()
    if (gid) groupByQuestionId.set(row.id, gid)
  }
  if (groupByQuestionId.size === 0) return questions

  return applySourceGroupIds(questions, groupByQuestionId)
}

export { applySourceGroupIds, enrichRcPassageGroups, shouldEnrichRcQuestions }
