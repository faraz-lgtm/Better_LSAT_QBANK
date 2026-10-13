import type { SectionSessionResponse } from "@/features/student/sections/section-types"

type CacheEntry = {
  result: SectionSessionResponse
  savedAt: number
}

const memory = new Map<string, CacheEntry>()
/** Short TTL: warm start→navigate and avoid stale answers after edits. */
const TTL_MS = 45_000

export function getCachedSectionSession(sessionId: string): SectionSessionResponse | null {
  const entry = memory.get(sessionId)
  if (!entry) return null
  if (Date.now() - entry.savedAt > TTL_MS) {
    memory.delete(sessionId)
    return null
  }
  return entry.result
}

/** One-shot take for start→session navigation (avoids remount refetch). */
export function takeCachedSectionSession(sessionId: string): SectionSessionResponse | null {
  const entry = memory.get(sessionId)
  if (!entry) return null
  memory.delete(sessionId)
  if (Date.now() - entry.savedAt > TTL_MS) return null
  return entry.result
}

export function cacheSectionSession(sessionId: string, result: SectionSessionResponse): void {
  memory.set(sessionId, { result, savedAt: Date.now() })
}

export function clearSectionSessionCache(): void {
  memory.clear()
}
