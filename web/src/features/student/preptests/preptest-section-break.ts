import type {
  PrepTestDetailResponse,
  PrepTestDetailSection,
  PrepTestSectionBreak,
} from "@/features/student/preptests/preptest-types"

export const PREPTEST_SECTION_BREAK_SECONDS = 60

const STORAGE_PREFIX = "preptest-section-break:"

type StoredSectionBreak = {
  afterSectionId: string
  endsAt: string
}

function storageKey(prepTestId: string): string {
  return `${STORAGE_PREFIX}${prepTestId}`
}

export function readStoredSectionBreak(prepTestId: string): PrepTestSectionBreak | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(storageKey(prepTestId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredSectionBreak
    if (typeof parsed.afterSectionId !== "string" || typeof parsed.endsAt !== "string") return null
    const endsAtMs = Date.parse(parsed.endsAt)
    if (!Number.isFinite(endsAtMs)) return null
    const remainingMs = endsAtMs - Date.now()
    if (remainingMs <= 0) {
      sessionStorage.removeItem(storageKey(prepTestId))
      return null
    }
    return {
      afterSectionId: parsed.afterSectionId,
      endsAt: parsed.endsAt,
      remainingSeconds: Math.ceil(remainingMs / 1000),
    }
  } catch {
    sessionStorage.removeItem(storageKey(prepTestId))
    return null
  }
}

export function writeStoredSectionBreak(prepTestId: string, afterSectionId: string): void {
  if (typeof window === "undefined") return
  const endsAt = new Date(Date.now() + PREPTEST_SECTION_BREAK_SECONDS * 1000).toISOString()
  sessionStorage.setItem(
    storageKey(prepTestId),
    JSON.stringify({ afterSectionId, endsAt } satisfies StoredSectionBreak),
  )
}

export function clearStoredSectionBreak(prepTestId: string): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(storageKey(prepTestId))
}

function orderedPracticeableSections(detail: PrepTestDetailResponse) {
  return [...detail.sections]
    .filter((s) => s.practiceable)
    .sort((a, b) => (a.sectionNumber ?? 0) - (b.sectionNumber ?? 0))
}

/** Next practiceable section after a completed section row (used after break skip/expiry). */
export function findNextSectionAfterBreak(
  detail: PrepTestDetailResponse,
  completedSectionRowId: string,
): PrepTestDetailSection | null {
  const practiceable = orderedPracticeableSections(detail)
  const idx = practiceable.findIndex((section) => section.id === completedSectionRowId)
  if (idx < 0 || idx >= practiceable.length - 1) return null
  const next = practiceable[idx + 1]!
  if (!next.practiceable || next.completed) return null
  return next
}

function deriveSectionAccess(
  practiceableIds: string[],
  completedSectionIds: Set<string>,
  sectionBreak: PrepTestSectionBreak | null,
): Map<string, { unlocked: boolean; onBreak: boolean }> {
  const access = new Map<string, { unlocked: boolean; onBreak: boolean }>()
  for (let i = 0; i < practiceableIds.length; i += 1) {
    const sectionId = practiceableIds[i]!
    if (i === 0) {
      access.set(sectionId, { unlocked: true, onBreak: false })
      continue
    }
    const prevSectionId = practiceableIds[i - 1]!
    const prevCompleted = completedSectionIds.has(prevSectionId)
    const breakBlocking =
      sectionBreak != null && sectionBreak.afterSectionId === prevSectionId && prevCompleted
    access.set(sectionId, {
      unlocked: prevCompleted && !breakBlocking,
      onBreak: breakBlocking,
    })
  }
  return access
}

/** Map a section session id to the PrepTest hub section row id used for break UI. */
export function resolvePrepTestBreakAfterSectionId(
  detail: PrepTestDetailResponse,
  sessionSectionId: string | null | undefined,
  poolSectionId?: string | null,
): string | null {
  const candidates = [sessionSectionId, poolSectionId].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  )
  for (const candidate of candidates) {
    const byRowId = detail.sections.find((section) => section.id === candidate)
    if (byRowId) return byRowId.id
    const bySectionId = detail.sections.find((section) => section.sectionId === candidate)
    if (bySectionId) return bySectionId.id
  }
  return candidates[0] ?? null
}

/** Normalize legacy API responses and merge local break state after section completion. */
export function normalizePrepTestDetail(
  detail: PrepTestDetailResponse,
  options?: { prepTestId?: string },
): PrepTestDetailResponse {
  const practiceable = orderedPracticeableSections(detail)
  const practiceableIds = practiceable.map((s) => s.id)
  const completedSectionIds = new Set(
    practiceable.filter((s) => s.completed).map((s) => s.id),
  )

  const prepTestId = options?.prepTestId ?? detail.prepTest.id
  const storedBreak = readStoredSectionBreak(prepTestId)
  const sectionBreak = detail.sectionBreak ?? storedBreak
  const access = deriveSectionAccess(practiceableIds, completedSectionIds, sectionBreak)

  const sections = detail.sections.map((sec) => {
    const nextAccess = access.get(sec.id)
    if (!sec.practiceable || !nextAccess) {
      return { ...sec, unlocked: false, onBreak: false }
    }
    return {
      ...sec,
      unlocked: nextAccess.unlocked,
      onBreak: nextAccess.onBreak,
    }
  })

  return {
    ...detail,
    sections,
    sectionBreak,
  }
}
