import { getAppStore } from "@/app/store-ref"
import {
  loadEntitlement,
  loadProfile,
  loadStudyContext,
  type StudentSessionState,
} from "@/features/student-session/studentSessionSlice"
import type { StudentStudyContext, UserEntitlement, UserProfile } from "@/lib/api/users"

const inflight = {
  profile: null as Promise<UserProfile | null> | null,
  entitlement: null as Promise<UserEntitlement | null> | null,
  studyContext: null as Promise<StudentStudyContext | null> | null,
}

function session(): StudentSessionState {
  return (getAppStore().getState() as { studentSession: StudentSessionState }).studentSession
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
 */
export async function ensureProfile(): Promise<UserProfile | null> {
  const current = session()
  if (current.profileStatus === "succeeded") return current.profile
  if (inflight.profile) return inflight.profile

  const store = getAppStore()
  inflight.profile = (async () => {
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
