import type { GuestDiagnosticResult } from '@/features/guest/diagnostic/guest-diagnostic-result-storage'
import type { GuestDiagnosticIntentId } from '@/features/guest/diagnostic/guest-diagnostic-intent-types'
import { getDiagnosticQuestionMeta } from '@/features/guest/diagnostic/mini-diagnostic-content'

const RC_QUESTION_TYPES = new Set([
  'Inference',
  'Main Point',
  'Primary Purpose',
  "Author's Attitude",
  'Function',
  'Organization',
  'Analogy',
  'Structure',
  'Global',
])

export type PointLeak = {
  questionType: string
  section: string
  total: number
  missed: number
  avgTimeSeconds: number | null
  avgTargetSeconds: number | null
  overSeconds: number | null
  pointsRecoverable: number
}

function getQuestionSection(questionType: string): string {
  return RC_QUESTION_TYPES.has(questionType) ? 'Reading Comprehension' : 'Logical Reasoning'
}

/** Recoverable LSAT points for a question-type group. Bonus only with enough sample. */
export function recoverablePoints(missed: number, total: number): number {
  if (total <= 0 || missed <= 0) return Math.max(0, missed)
  const missRate = missed / total
  return Math.max(1, Math.round(missed + (total >= 3 && missRate > 0.6 ? 1 : 0)))
}

export function computePointLeaks(
  outcomes: GuestDiagnosticResult['outcomes'],
  intentId: GuestDiagnosticIntentId,
): PointLeak[] {
  const groups: Record<
    string,
    { missed: number; total: number; totalTime: number; totalTarget: number; count: number }
  > = {}

  for (const outcome of outcomes) {
    const meta = getDiagnosticQuestionMeta(outcome.questionId, intentId)
    if (!meta?.questionType) continue
    const type = meta.questionType
    if (!groups[type]) groups[type] = { missed: 0, total: 0, totalTime: 0, totalTarget: 0, count: 0 }
    groups[type].total++
    if (!outcome.isCorrect) groups[type].missed++
    if (outcome.timeSpentSeconds != null && meta.targetTimeSeconds) {
      groups[type].totalTime += outcome.timeSpentSeconds
      groups[type].totalTarget += meta.targetTimeSeconds
      groups[type].count++
    }
  }

  return Object.entries(groups)
    .filter(([, g]) => g.missed > 0)
    .map(([questionType, g]) => {
      const avgTime = g.count > 0 ? g.totalTime / g.count : null
      const avgTarget = g.count > 0 ? g.totalTarget / g.count : null
      const overSeconds = avgTime != null && avgTarget != null ? avgTime - avgTarget : null
      return {
        questionType,
        section: getQuestionSection(questionType),
        total: g.total,
        missed: g.missed,
        avgTimeSeconds: avgTime,
        avgTargetSeconds: avgTarget,
        overSeconds,
        pointsRecoverable: recoverablePoints(g.missed, g.total),
      }
    })
    .sort((a, b) => b.pointsRecoverable - a.pointsRecoverable || b.missed - a.missed)
}
