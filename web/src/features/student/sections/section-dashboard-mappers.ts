import type { PracticeSessionSummary } from "@/lib/api/analytics"
import { BASE_SECTION_TIMER_SECONDS } from "@/features/student/accommodations/accommodations-context"
import { formatRelativeTime, type ContinueDrill } from "@/features/student/drills/drill-dashboard-mappers"

const LSAC_SECTION_ID_RE = /^(?:LR|RC|LG)(\d+)[A-Z]-(\d+)$/i

export type ContinueSection = {
  id: string
  section: "LR" | "RC"
  title: string
  timeLeftLabel: string
  answered: string
  lastAttempt: string
  progressPct: number
  difficulty: ContinueDrill["difficulty"]
  difficultyBars: number
  difficultyColor: string
  continuePath: string
}

function sessionSectionType(session: PracticeSessionSummary): "LR" | "RC" | null {
  const meta = session.metadata
  if (meta.sectionType === "LR" || meta.sectionType === "RC") return meta.sectionType
  if (session.sectionType === "LR" || session.sectionType === "RC") return session.sectionType
  return null
}

function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

/** Figma continue-row copy: "Time: 23:30 min left" or unlimited. */
export function formatSectionTimeLeftLabel(
  session: Pick<PracticeSessionSummary, "startedAt" | "metadata">,
  nowMs = Date.now(),
): string {
  const timing = typeof session.metadata.timing === "string" ? session.metadata.timing : null
  if (timing === "unlimited") return "Time: Unlimited"

  const metaMinutes =
    typeof session.metadata.timeMinutes === "number" ? session.metadata.timeMinutes : null
  const budgetSeconds =
    metaMinutes != null && metaMinutes > 0
      ? Math.round(metaMinutes * 60)
      : BASE_SECTION_TIMER_SECONDS

  const start = new Date(session.startedAt).getTime()
  if (Number.isNaN(start)) return `Time: ${formatMmSs(budgetSeconds)} min left`

  const elapsedSec = Math.max(0, Math.floor((nowMs - start) / 1000))
  const left = Math.max(0, budgetSeconds - elapsedSec)
  return `Time: ${formatMmSs(left)} min left`
}

function parseLsacSectionId(
  ...values: Array<string | null | undefined>
): { pt: string; section: number } | null {
  for (const value of values) {
    if (!value) continue
    const parsed = LSAC_SECTION_ID_RE.exec(value.trim())
    if (parsed?.[1] && parsed[2]) {
      return { pt: parsed[1], section: Number(parsed[2]) }
    }
  }
  return null
}

/** Figma title: "Section - PT128.S3". */
export function formatContinueSectionTitle(session: PracticeSessionSummary): string {
  const meta = session.metadata
  const moduleId =
    typeof meta.moduleId === "string"
      ? meta.moduleId
      : typeof session.prepTestId === "string"
        ? session.prepTestId
        : null
  const sectionNumber =
    typeof meta.sectionNumber === "number"
      ? meta.sectionNumber
      : typeof meta.section_number === "number"
        ? meta.section_number
        : null
  const sessionLabel = typeof meta.sessionLabel === "string" ? meta.sessionLabel : null

  const fromLsac = parseLsacSectionId(sessionLabel, session.sectionTitle, moduleId)
  if (fromLsac) {
    return `Section - PT${fromLsac.pt}.S${fromLsac.section}`
  }

  const fromModule = moduleId ? /^LSAC(\d+)$/i.exec(moduleId)?.[1] : undefined
  if (fromModule && sectionNumber != null) {
    return `Section - PT${fromModule}.S${sectionNumber}`
  }

  const ptNum = session.prepTestTitle?.match(/\d+/)?.[0] ?? fromModule
  if (ptNum && sectionNumber != null) {
    return `Section - PT${ptNum}.S${sectionNumber}`
  }

  if (sessionLabel?.trim()) {
    return `Section - ${sessionLabel.trim()}`
  }

  const fallback = session.sectionTitle ?? session.prepTestTitle ?? "In progress"
  return `Section - ${fallback}`
}

export function continueSectionToDrill(row: ContinueSection): ContinueDrill {
  return {
    id: row.id,
    section: row.section,
    title: row.title,
    progressPct: row.progressPct,
    answered: row.answered,
    timeLabel: row.timeLeftLabel,
    lastAttempt: row.lastAttempt,
    accent: row.section === "LR" ? "orange" : "mint",
    difficulty: row.difficulty,
    difficultyBars: row.difficultyBars,
    difficultyColor: row.difficultyColor,
    continuePath: row.continuePath,
  }
}

export function mapSessionToContinueSection(session: PracticeSessionSummary): ContinueSection | null {
  const section = sessionSectionType(session)
  if (!section) return null

  const meta = session.metadata
  const questionIds = Array.isArray(meta.questionIds) ? meta.questionIds.length : 0
  const total = typeof meta.questionCount === "number" ? meta.questionCount : questionIds
  const answeredIds = Array.isArray(meta.answeredQuestionIds) ? meta.answeredQuestionIds.length : 0
  const progressPct = total > 0 ? Math.round((100 * answeredIds) / total) : 0

  return {
    id: session.id,
    section,
    title: formatContinueSectionTitle(session),
    timeLeftLabel: formatSectionTimeLeftLabel(session),
    answered: `${answeredIds}/${total || "—"}`,
    lastAttempt: formatRelativeTime(session.startedAt),
    progressPct,
    difficulty: "hardest",
    difficultyBars: 5,
    difficultyColor: "#df1c41",
    continuePath: `/app/practice/sections/session/${session.id}`,
  }
}
