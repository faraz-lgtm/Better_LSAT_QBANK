import type { GuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import type { GuestDiagnosticAnswerState } from "@/features/guest/diagnostic/guest-diagnostic-exam-utils"
import {
  formatDiagnosticDateLabel,
  getDiagnosticIntentTitle,
  listDiagnosticHistory,
  type GuestDiagnosticQuestionOutcome,
  type GuestDiagnosticResult,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import type { ExplanationHistoryRow } from "@/features/student/explanation-detail/types"
import type { ExplanationQuestionStatus } from "@/features/student/explanation-detail/explanation-tree-types"
import { formatMmSs } from "@/features/student/practice-session/practice-results-ui"

/** Must match `guest-diagnostic-exam-layout.tsx` session answer key. */
export const GUEST_DIAGNOSTIC_ANSWERS_STORAGE_PREFIX = "guestDiagnosticAnswers:"

export type DiagnosticExplanationQuestionProgress = {
  status: ExplanationQuestionStatus
  /** Latest submitted (or in-progress) answer letter A–E, when known. */
  userSelectedLetter: string | null
  /** Seconds spent on the question in the latest completed attempt, when tracked. */
  yourTimeSeconds: number | null
}

export type DiagnosticExplanationProgressMap = Map<string, DiagnosticExplanationQuestionProgress>

type CompletedOutcome = GuestDiagnosticQuestionOutcome & {
  completedAt: string
  intentId: GuestDiagnosticIntentId
}

function normalizeLetter(raw: string | null | undefined): string | null {
  const letter = raw?.trim().toUpperCase().slice(0, 1) ?? ""
  return /^[A-E]$/.test(letter) ? letter : null
}

function hasSelectedAnswer(outcome: GuestDiagnosticQuestionOutcome): boolean {
  return Boolean(normalizeLetter(outcome.selectedAnswer ?? null))
}

function normalizeTimeSpentSeconds(raw: number | null | undefined): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) return null
  return Math.round(raw)
}

/**
 * Prefer the most recent completed attempt that includes the question.
 * Falling back across history keeps Mini + Section independent by question id.
 */
function latestCompletedOutcomeByQuestion(
  attempts: readonly GuestDiagnosticResult[],
): Map<string, CompletedOutcome> {
  const chronological = [...attempts].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  )
  const latest = new Map<string, CompletedOutcome>()
  for (const attempt of chronological) {
    for (const outcome of attempt.outcomes) {
      latest.set(outcome.questionId, {
        ...outcome,
        completedAt: attempt.completedAt,
        intentId: attempt.intentId,
      })
    }
  }
  return latest
}

function readInProgressAnswers(
  intentId: GuestDiagnosticIntentId,
): Record<string, GuestDiagnosticAnswerState> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.sessionStorage.getItem(`${GUEST_DIAGNOSTIC_ANSWERS_STORAGE_PREFIX}${intentId}`)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, GuestDiagnosticAnswerState>
  } catch {
    return {}
  }
}

/**
 * Resolve Fresh / Seen / Answered / In Process from diagnostic attempt history
 * + in-progress session answers (same semantics as Academy Explanations, adapted
 * to guest diagnostic storage).
 *
 * - answered: latest completed attempt has a selected letter
 * - seen: latest completed attempt includes the question but left blank
 * - in_process: in-progress session answer and no completed selection yet
 * - fresh: never touched
 */
export function buildDiagnosticExplanationProgressMap(input?: {
  attempts?: readonly GuestDiagnosticResult[]
  inProgressByIntent?: Partial<
    Record<GuestDiagnosticIntentId, Record<string, GuestDiagnosticAnswerState>>
  >
}): DiagnosticExplanationProgressMap {
  const attempts = input?.attempts ?? []
  const latestCompleted = latestCompletedOutcomeByQuestion(attempts)
  const inProgressMini =
    input?.inProgressByIntent?.mini ?? ({} as Record<string, GuestDiagnosticAnswerState>)
  const inProgressQuick =
    input?.inProgressByIntent?.quick ?? ({} as Record<string, GuestDiagnosticAnswerState>)
  const inProgressFull =
    input?.inProgressByIntent?.full ?? ({} as Record<string, GuestDiagnosticAnswerState>)

  const questionIds = new Set<string>([
    ...latestCompleted.keys(),
    ...Object.keys(inProgressMini),
    ...Object.keys(inProgressQuick),
    ...Object.keys(inProgressFull),
  ])

  const out: DiagnosticExplanationProgressMap = new Map()
  for (const questionId of questionIds) {
    const completed = latestCompleted.get(questionId)
    const completedLetter = completed ? normalizeLetter(completed.selectedAnswer ?? null) : null
    const inProgressLetter =
      normalizeLetter(inProgressMini[questionId]?.selectedAnswer) ??
      normalizeLetter(inProgressQuick[questionId]?.selectedAnswer) ??
      normalizeLetter(inProgressFull[questionId]?.selectedAnswer)

    const yourTimeSeconds = completed
      ? normalizeTimeSpentSeconds(completed.timeSpentSeconds)
      : null

    if (completed && hasSelectedAnswer(completed)) {
      out.set(questionId, {
        status: "answered",
        userSelectedLetter: completedLetter,
        yourTimeSeconds,
      })
      continue
    }

    if (completed && !hasSelectedAnswer(completed)) {
      out.set(questionId, {
        status: "seen",
        userSelectedLetter: inProgressLetter,
        yourTimeSeconds,
      })
      continue
    }

    if (inProgressLetter) {
      out.set(questionId, {
        status: "in_process",
        userSelectedLetter: inProgressLetter,
        yourTimeSeconds: null,
      })
      continue
    }
  }

  return out
}

/** Browser helper — reads local attempt history + session in-progress answers. */
export function readDiagnosticExplanationProgressMap(): DiagnosticExplanationProgressMap {
  return buildDiagnosticExplanationProgressMap({
    attempts: listDiagnosticHistory(),
    inProgressByIntent: {
      mini: readInProgressAnswers("mini"),
      quick: readInProgressAnswers("quick"),
      full: readInProgressAnswers("full"),
    },
  })
}

export function getDiagnosticExplanationQuestionProgress(
  progress: DiagnosticExplanationProgressMap,
  questionId: string,
): DiagnosticExplanationQuestionProgress {
  return (
    progress.get(questionId) ?? {
      status: "fresh",
      userSelectedLetter: null,
      yourTimeSeconds: null,
    }
  )
}

/**
 * Question History rows for Insights — one row per completed diagnostic attempt
 * that includes this question (newest first).
 */
export function buildDiagnosticExplanationHistoryRows(
  questionId: string,
  attempts: readonly GuestDiagnosticResult[],
): ExplanationHistoryRow[] {
  const matching = attempts
    .map((attempt) => {
      const outcome = attempt.outcomes.find((row) => row.questionId === questionId)
      if (!outcome) return null
      const spent = normalizeTimeSpentSeconds(outcome.timeSpentSeconds)
      return {
        source: getDiagnosticIntentTitle(attempt.intentId),
        dateLabel: formatDiagnosticDateLabel(attempt.completedAt),
        /** Completed diagnostic attempts always count as Completed in Insights history. */
        status: "answered" as const,
        timeRange: spent != null ? formatMmSs(spent) : "—",
        completedAtMs: new Date(attempt.completedAt).getTime(),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row != null)

  matching.sort((a, b) => b.completedAtMs - a.completedAtMs)

  return matching.map(({ source, dateLabel, status, timeRange }) => ({
    source,
    dateLabel,
    status,
    timeRange,
  }))
}
