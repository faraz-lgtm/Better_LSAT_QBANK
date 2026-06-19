import type { PracticeSessionSummary, PriorityRow } from "@/lib/api/analytics"

export type ContinueDrill = {
  id: string
  section: "LR" | "RC"
  title: string
  progressPct: number
  answered: string
  timeLabel: string
  lastAttempt: string
  accent: "orange" | "mint"
  difficulty: "hardest" | "medium" | "easy"
  difficultyBars: number
  difficultyColor: string
  continuePath: string
}

export type SuggestedDrill = {
  id: string
  section: "LR" | "RC"
  title: string
  progressPct: number
  answered: string
  timeLabel: string
  lastAttempt: string
  accent: "orange" | "mint"
  difficulty: "hardest" | "medium" | "easy"
  difficultyBars: number
  difficultyColor: string
  configPath: string
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = Math.max(0, now - then)
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return hours === 1 ? "1 hour ago" : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return days === 1 ? "1 day ago" : `${days} days ago`
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return iso
  }
}

function sessionSectionType(session: PracticeSessionSummary): "LR" | "RC" | null {
  const meta = session.metadata
  if (meta.sectionType === "LR" || meta.sectionType === "RC") return meta.sectionType
  if (session.sectionType === "LR" || session.sectionType === "RC") return session.sectionType
  return null
}

function priorityVisual(priority: PriorityRow["priorityLevel"]) {
  if (priority === "high") {
    return { label: "hardest" as const, bars: 5, color: "#df1c41" }
  }
  if (priority === "medium") {
    return { label: "medium" as const, bars: 3, color: "#ff6f00" }
  }
  return { label: "easy" as const, bars: 2, color: "#ffbd4c" }
}

/** Figma continue-drill card Time stat — maps session metadata to a display label. */
export function formatDrillTimeLabel(
  session: Pick<PracticeSessionSummary, "startedAt" | "completedAt">,
  meta: Record<string, unknown>,
  nowMs = Date.now(),
): string {
  const timing = typeof meta.timing === "string" ? meta.timing : null
  const questionCount =
    typeof meta.questionCount === "number"
      ? meta.questionCount
      : Array.isArray(meta.questionIds)
        ? meta.questionIds.length
        : 0

  if (timing === "35") return "35 min"
  if (timing === "per-q") {
    const totalMinutes = Math.max(1, Math.round((questionCount * 80) / 60))
    return `${totalMinutes} min`
  }
  if (timing === "unlimited") {
    return formatDrillElapsedLabel(session.startedAt, session.completedAt, nowMs)
  }
  if (timing) return timing
  return "—"
}

function formatDrillElapsedLabel(
  startedAt: string,
  completedAt: string | null,
  nowMs: number,
): string {
  const start = new Date(startedAt).getTime()
  if (Number.isNaN(start)) return "—"
  const end = completedAt ? new Date(completedAt).getTime() : nowMs
  if (Number.isNaN(end)) return "—"
  const mins = Math.max(0, Math.round((end - start) / 60_000))
  if (mins < 1) return "<1 min"
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
}

export function mapSessionToContinueDrill(session: PracticeSessionSummary): ContinueDrill | null {
  const section = sessionSectionType(session)
  if (!section) return null

  const meta = session.metadata
  const questionIds = Array.isArray(meta.questionIds) ? meta.questionIds.length : 0
  const total = typeof meta.questionCount === "number" ? meta.questionCount : questionIds
  const answeredIds = Array.isArray(meta.answeredQuestionIds) ? meta.answeredQuestionIds.length : 0
  const progressPct = total > 0 ? Math.round((100 * answeredIds) / total) : 0

  const title =
    (typeof meta.title === "string" && meta.title) ||
    (typeof meta.tagLabel === "string" && meta.tagLabel) ||
    `${section} drill`

  return {
    id: session.id,
    section,
    title,
    progressPct,
    answered: `${answeredIds}/${total || "—"}`,
    timeLabel: formatDrillTimeLabel(session, meta),
    lastAttempt: formatRelativeTime(session.startedAt),
    accent: section === "LR" ? "orange" : "mint",
    difficulty: "hardest",
    difficultyBars: 5,
    difficultyColor: "#df1c41",
    continuePath: `/app/practice/drills/session/${session.id}`,
  }
}

export function mapPriorityToSuggestedDrill(row: PriorityRow): SuggestedDrill | null {
  const section = row.sectionType === "LR" || row.sectionType === "RC" ? row.sectionType : "LR"
  const visual = priorityVisual(row.priorityLevel)
  const configPath =
    section === "LR"
      ? `/app/practice/drills/lr/new?questionTypeId=${encodeURIComponent(row.questionTypeId)}&tag=${encodeURIComponent(row.name)}`
      : `/app/practice/drills/rc/new?questionTypeId=${encodeURIComponent(row.questionTypeId)}&tag=${encodeURIComponent(row.name)}`

  return {
    id: row.questionTypeId,
    section,
    title: row.name,
    progressPct: row.accuracyPct,
    answered: `${row.correctCount}/${row.attemptCount}`,
    timeLabel: "—",
    lastAttempt: `${row.attemptCount} attempts`,
    accent: section === "LR" ? "orange" : "mint",
    difficulty: visual.label,
    difficultyBars: visual.bars,
    difficultyColor: visual.color,
    configPath,
  }
}

export function sumSessionStudyHours(sessions: PracticeSessionSummary[], nowMs = Date.now()): number {
  let totalMs = 0
  for (const session of sessions) {
    const start = new Date(session.startedAt).getTime()
    if (Number.isNaN(start)) continue
    const end = session.completedAt ? new Date(session.completedAt).getTime() : nowMs
    if (Number.isNaN(end)) continue
    totalMs += Math.max(0, end - start)
  }
  return totalMs / 3_600_000
}

export function formatStudyHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 10) / 10}h`
  return `${Math.round(hours)}h`
}

export async function fetchAllSessionsForStudyHours(
  getSessions: (input: { limit: number; offset: number }) => Promise<{
    sessions: PracticeSessionSummary[]
    total: number
  }>,
  pageSize = 100,
  maxSessions = 500,
): Promise<PracticeSessionSummary[]> {
  const all: PracticeSessionSummary[] = []
  let offset = 0
  while (all.length < maxSessions) {
    const page = await getSessions({ limit: pageSize, offset })
    all.push(...page.sessions)
    if (page.sessions.length < pageSize || all.length >= page.total) break
    offset += pageSize
  }
  return all.slice(0, maxSessions)
}
