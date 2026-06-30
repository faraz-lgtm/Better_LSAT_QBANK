/** Keep in sync with `supabase/functions/_shared/prep-test-visibility.ts`. */
export const MIN_STUDENT_VISIBLE_PREP_TEST = 100

export function lsacPrepTestOrdinal(moduleId: string): number | null {
  const m = /^LSAC(\d+)$/i.exec(moduleId.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function isStudentVisiblePrepTest(moduleId: string | null | undefined): boolean {
  if (!moduleId) return false
  const base = moduleId.split(":")[0] ?? moduleId
  const n = lsacPrepTestOrdinal(base)
  return n != null && n >= MIN_STUDENT_VISIBLE_PREP_TEST
}

export function prepTestOrdinalFromModuleId(moduleId: string | null | undefined): number | null {
  if (!moduleId) return null
  const base = moduleId.split(":")[0] ?? moduleId
  return lsacPrepTestOrdinal(base)
}

export function filterStudentVisiblePrepTestRows<T extends { module_id?: unknown }>(rows: T[]): T[] {
  return rows.filter((row) => isStudentVisiblePrepTest(String(row.module_id ?? "")))
}

/** PT100 first, then ascending (100, 101, …). */
export function sortPrepTestsByNumberAsc<T extends { module_id?: unknown }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const na = prepTestOrdinalFromModuleId(String(a.module_id ?? "")) ?? Number.POSITIVE_INFINITY
    const nb = prepTestOrdinalFromModuleId(String(b.module_id ?? "")) ?? Number.POSITIVE_INFINITY
    return na - nb
  })
}
