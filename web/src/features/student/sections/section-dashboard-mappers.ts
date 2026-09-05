import type { PracticeSessionSummary } from "@/lib/api/analytics"
import { BASE_SECTION_TIMER_SECONDS } from "@/features/student/accommodations/accommodations-context"

export type ContinueSection = {
  id: string
  section: "LR" | "RC"
  title: string
  timeLeftLabel: string
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

  const fromModule = moduleId ? /^LSAC(\d+)$/i.exec(moduleId)?.[1] : undefined
  if (fromModule && sectionNumber != null) {
    return `Section - PT${fromModule}.S${sectionNumber}`
  }

  const ptNum = session.prepTestTitle?.match(/\d+/)?.[0]
  const sectionFromTitle = session.sectionTitle?.match(/\d+/)?.[0]
  const secNum = sectionNumber ?? (sectionFromTitle ? Number(sectionFromTitle) : null)
  if (ptNum && secNum != null && !Number.isNaN(secNum)) {
    return `Section - PT${ptNum}.S${secNum}`
  }

  if (typeof meta.sessionLabel === "string" && meta.sessionLabel.trim()) {
    return `Section - ${meta.sessionLabel.trim()}`
  }

  const fallback = session.sectionTitle ?? session.prepTestTitle ?? "In progress"
  return `Section - ${fallback}`
}

export function mapSessionToContinueSection(session: PracticeSessionSummary): ContinueSection | null {
  const section = sessionSectionType(session)
  if (!section) return null

  return {
    id: session.id,
    section,
    title: formatContinueSectionTitle(session),
    timeLeftLabel: formatSectionTimeLeftLabel(session),
    continuePath: `/app/practice/sections/session/${session.id}`,
  }
}
