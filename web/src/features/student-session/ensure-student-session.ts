import { getAppStore } from "@/app/store-ref"
import {
  invalidateProfile,
  loadEntitlement,
  loadProfile,
  loadStudyContext,
  resetStudentSession,
  type StudentSessionState,
} from "@/features/student-session/studentSessionSlice"
import type { StudentStudyContext, UserEntitlement, UserProfile } from "@/lib/api/users"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const inflight = {
  profile: null as Promise<UserProfile | null> | null,
  entitlement: null as Promise<UserEntitlement | null> | null,
  studyContext: null as Promise<StudentStudyContext | null> | null,
}

function session(): StudentSessionState {
  return (getAppStore().getState() as { studentSession: StudentSessionState }).studentSession
}

/** Auth user id for the current session, or null when signed out. */
async function currentAuthUserId(): Promise<string | null> {
  const { data } = await getSupabaseBrowserClient().auth.getSession()
  return data.session?.user?.id ?? null
}

/**
 * Drop a cached profile that belongs to a different auth user (e.g. admin → student
 * login after a soft logout that left Redux intact).
 */
function dropStaleSessionCache(): void {
  getAppStore().dispatch(resetStudentSession())
  resetEnsureStudentSessionInflight()
}

async function waitWhile(
  isBusy: (state: StudentSessionState) => boolean,
  timeoutMs = 30_000,
): Promise<void> {
  const started = Date.now()
  while (isBusy(session())) {
    if (Date.now() - started > timeoutMs) {
      throw new Error("Timed out waiting for student session load")
    }
    await new Promise((resolve) => setTimeout(resolve, 16))
  }
}

/**
 * Return cached profile or share one in-flight load across login, route guards, and shell.
 *
 * A prior successful load that returned `null` (no row yet) is not treated as a permanent
 * cache hit — Google signup → onboarding → saveOnboarding creates the row, and route guards
 * must be able to see it without a full page reload.
 *
 * A cached profile whose `id` does not match the current auth user is discarded so account
 * switches cannot reuse the previous role (admin → student soft logout).
 */
export async function ensureProfile(): Promise<UserProfile | null> {
  const current = session()
  if (current.profileStatus === "succeeded" && current.profile) {
    const authUserId = await currentAuthUserId()
    if (authUserId && current.profile.id === authUserId) return current.profile
    dropStaleSessionCache()
    if (!authUserId) return null
  }
  if (inflight.profile) return inflight.profile

  const store = getAppStore()
  inflight.profile = (async () => {
    if (session().profileStatus === "succeeded" && session().profile === null) {
      store.dispatch(invalidateProfile())
    }
    if (session().profileStatus === "loading") {
      await waitWhile((s) => s.profileStatus === "loading")
      return session().profile
    }
    await store.dispatch(loadProfile())
    if (session().profileStatus === "loading") {
      await waitWhile((s) => s.profileStatus === "loading")
    }
    return session().profile
  })().finally(() => {
    inflight.profile = null
  })

  return inflight.profile
}

/**
 * Return cached entitlement or share one in-flight load.
 * Returns null when the entitlement request fails.
 */
export async function ensureEntitlement(): Promise<UserEntitlement | null> {
  const current = session()
  if (current.entitlementStatus === "succeeded") return current.entitlement
  if (inflight.entitlement) return inflight.entitlement

  const store = getAppStore()
  inflight.entitlement = (async () => {
    if (session().entitlementStatus === "loading") {
      await waitWhile((s) => s.entitlementStatus === "loading")
      return session().entitlement
    }
    await store.dispatch(loadEntitlement())
    if (session().entitlementStatus === "loading") {
      await waitWhile((s) => s.entitlementStatus === "loading")
    }
    return session().entitlement
  })().finally(() => {
    inflight.entitlement = null
  })

  return inflight.entitlement
}

/** Return cached study context or share one in-flight load. */
export async function ensureStudyContext(): Promise<StudentStudyContext | null> {
  const current = session()
  if (current.studyContextStatus === "succeeded") return current.studyContext
  if (inflight.studyContext) return inflight.studyContext

  const store = getAppStore()
  inflight.studyContext = (async () => {
    if (session().studyContextStatus === "loading") {
      await waitWhile((s) => s.studyContextStatus === "loading")
      return session().studyContext
    }
    await store.dispatch(loadStudyContext())
    if (session().studyContextStatus === "loading") {
      await waitWhile((s) => s.studyContextStatus === "loading")
    }
    return session().studyContext
  })().finally(() => {
    inflight.studyContext = null
  })

  return inflight.studyContext
}

/** Clear shared in-flight promises (logout / tests). */
export function resetEnsureStudentSessionInflight(): void {
  inflight.profile = null
  inflight.entitlement = null
  inflight.studyContext = null
}
