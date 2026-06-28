/** Lowest LSAC PrepTest number shown to students (PT100+). */
export const MIN_STUDENT_VISIBLE_PREP_TEST = 100

export function lsacPrepTestOrdinal(moduleId: string): number | null {
  const m = /^LSAC(\d+)$/i.exec(moduleId.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function prepTestNumberFromModuleId(moduleId: string): string | null {
  const n = lsacPrepTestOrdinal(moduleId.split(':')[0] ?? moduleId)
  return n != null ? String(n) : null
}

export function isStudentVisiblePrepTest(moduleId: string | null | undefined): boolean {
  if (!moduleId) return false
  const base = moduleId.split(':')[0] ?? moduleId
  const n = lsacPrepTestOrdinal(base)
  return n != null && n >= MIN_STUDENT_VISIBLE_PREP_TEST
}
