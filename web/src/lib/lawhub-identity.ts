/** Client-side LawHub identity helpers (mirrors edge `_shared/lawhub-student-identity`). */

export function splitFullName(fullName: string | null | undefined): {
  firstName: string
  lastName: string
} {
  const trimmed = fullName?.trim() ?? ""
  if (!trimmed) return { firstName: "", lastName: "" }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" }
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") }
}

export function profileHasLawHubName(profile: {
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
} | null | undefined): boolean {
  const first = profile?.first_name?.trim() ?? ""
  const last = profile?.last_name?.trim() ?? ""
  if (first && last) return true
  const fromFull = splitFullName(profile?.full_name)
  return Boolean(fromFull.firstName && fromFull.lastName)
}

export function emailAllowsLawHub(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? ""
  if (!normalized) return false
  const local = normalized.split("@")[0] ?? ""
  return !local.includes("+")
}
