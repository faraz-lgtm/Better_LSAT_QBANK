import { createAdminApi } from "@/lib/api/admin"
import { createAuthApi } from "@/lib/api/auth"
import { clearStudentSessionCaches } from "@/lib/auth/clear-student-session-caches"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export const IMPERSONATION_STORAGE_KEY = "betterlsat.admin.impersonation"

export type ImpersonationMeta = {
  studentId: string
  studentEmail: string
  studentFullName: string
  adminAccessToken: string
  adminRefreshToken: string
  startedAt: string
}

type NavigateFn = (to: string) => void

function readStorage(): Storage | null {
  try {
    if (typeof sessionStorage === "undefined") return null
    return sessionStorage
  } catch {
    return null
  }
}

export function getImpersonationMeta(): ImpersonationMeta | null {
  const storage = readStorage()
  if (!storage) return null
  const raw = storage.getItem(IMPERSONATION_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ImpersonationMeta>
    if (
      typeof parsed.studentId !== "string" ||
      typeof parsed.studentEmail !== "string" ||
      typeof parsed.studentFullName !== "string" ||
      typeof parsed.adminAccessToken !== "string" ||
      typeof parsed.adminRefreshToken !== "string"
    ) {
      return null
    }
    return {
      studentId: parsed.studentId,
      studentEmail: parsed.studentEmail,
      studentFullName: parsed.studentFullName,
      adminAccessToken: parsed.adminAccessToken,
      adminRefreshToken: parsed.adminRefreshToken,
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function clearImpersonationMeta(): void {
  readStorage()?.removeItem(IMPERSONATION_STORAGE_KEY)
}

function stashImpersonationMeta(meta: ImpersonationMeta): void {
  const storage = readStorage()
  if (!storage) throw new Error("sessionStorage is unavailable")
  storage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(meta))
}

/**
 * Mint a student session via admin edge, stash the admin tokens, and open /app as the student.
 */
export async function startImpersonation(studentUserId: string, navigate: NavigateFn): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const adminSession = sessionData.session
  if (!adminSession?.access_token || !adminSession.refresh_token) {
    throw new Error("Admin session is required to view as student")
  }

  const adminApi = createAdminApi(supabase)
  const { tokenHash, student } = await adminApi.impersonateStudent(studentUserId)

  stashImpersonationMeta({
    studentId: student.id,
    studentEmail: student.email,
    studentFullName: student.full_name,
    adminAccessToken: adminSession.access_token,
    adminRefreshToken: adminSession.refresh_token,
    startedAt: new Date().toISOString(),
  })

  clearStudentSessionCaches()

  const authApi = createAuthApi(supabase)
  try {
    await authApi.verifyOtpWithTokenHash(tokenHash, "magiclink")
  } catch (error) {
    clearImpersonationMeta()
    // Best-effort restore if OTP verification fails after stash.
    await supabase.auth.setSession({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    })
    clearStudentSessionCaches()
    throw error
  }

  navigate("/app")
}

/**
 * Restore the stashed admin session, audit end, and return to admin students.
 */
export async function endImpersonation(navigate: NavigateFn): Promise<void> {
  const meta = getImpersonationMeta()
  if (!meta) {
    navigate("/admin/students")
    return
  }

  const supabase = getSupabaseBrowserClient()
  const { error: restoreError } = await supabase.auth.setSession({
    access_token: meta.adminAccessToken,
    refresh_token: meta.adminRefreshToken,
  })
  if (restoreError) throw restoreError

  clearStudentSessionCaches()
  clearImpersonationMeta()

  try {
    await createAdminApi(supabase).endImpersonation(meta.studentId)
  } catch (error) {
    // Audit is best-effort; admin session is already restored.
    console.warn("Failed to audit end impersonation", error)
  }

  navigate("/admin/students")
}
