/** Normalize RC / LR / LG from codes or free-text titles (aligned with question editor). */
export function normalizeSectionCode(sectionType: unknown, title?: unknown): "LR" | "RC" | "LG" | "" {
  const candidates = [sectionType, title]
    .map((v) => (typeof v === "string" ? v.trim().toLowerCase() : ""))
    .filter(Boolean)
  for (const value of candidates) {
    if (!value) continue
    if (value === "lr" || value.includes("logical reasoning")) return "LR"
    if (value === "rc" || value.includes("reading comprehension")) return "RC"
    if (value === "lg" || value.includes("logic game") || value.includes("analytical reasoning")) return "LG"
  }
  const head = typeof sectionType === "string" ? sectionType.trim().toUpperCase() : ""
  if (head === "LR" || head === "RC" || head === "LG") return head as "LR" | "RC" | "LG"
  return ""
}

export function sectionLongName(sectionType: unknown, title?: unknown): string {
  const code = normalizeSectionCode(sectionType, title)
  if (code === "RC") return "Reading Comprehension"
  if (code === "LR") return "Logical Reasoning"
  if (code === "LG") return "Logic Games"
  const t = typeof title === "string" ? title.trim() : ""
  if (t) return t
  const raw = typeof sectionType === "string" ? sectionType.trim() : ""
  return raw || "Unknown"
}

export function formatSectionOptionLabel(section: {
  section_number?: number | null
  section_type?: string | null
  title?: string | null
}): string {
  const n = section.section_number ?? "-"
  const name = sectionLongName(section.section_type, section.title)
  return `Section ${n} · ${name}`
}
