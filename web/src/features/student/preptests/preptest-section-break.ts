import type { PrepTestDetailResponse, PrepTestSectionBreak } from "@/features/student/preptests/preptest-types"

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

/** Normalize legacy API responses and merge local break state after section completion. */
export function normalizePrepTestDetail(detail: PrepTestDetailResponse): PrepTestDetailResponse {
  const practiceable = orderedPracticeableSections(detail)
  const practiceableIds = practiceable.map((s) => s.id)
  const completedSectionIds = new Set(
    practiceable.filter((s) => s.completed).map((s) => s.id),
  )

  const storedBreak = readStoredSectionBreak(detail.prepTest.id)
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
