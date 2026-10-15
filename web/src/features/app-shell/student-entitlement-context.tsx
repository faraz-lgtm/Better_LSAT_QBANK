import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"

import { useAppDispatch, useAppSelector } from "@/app/hooks"
import {
  invalidateEntitlement,
  loadEntitlement,
  selectEntitlement,
  type LoadStatus,
} from "@/features/student-session/studentSessionSlice"
import type { UserEntitlement } from "@/lib/api/users"

type StudentEntitlementContextValue = {
  entitlement: UserEntitlement | null
  loading: boolean
  error: string | null
  /** True only when LawHub coach is linked and eligible for LSAC content. */
  canAccessLsacContent: boolean
  isPaymentRequired: boolean
  isLsacSetupRequired: boolean
  refresh: () => Promise<UserEntitlement | null>
}

const StudentEntitlementContext = createContext<StudentEntitlementContextValue | null>(null)

function StudentEntitlementProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const entitlement = useAppSelector(selectEntitlement)
  const entitlementStatus = useAppSelector(
    (state) => state.studentSession.entitlementStatus as LoadStatus,
  )
  const entitlementError = useAppSelector((state) => state.studentSession.entitlementError)

  useEffect(() => {
    void dispatch(loadEntitlement())
  }, [dispatch])

  const refresh = useCallback(async (): Promise<UserEntitlement | null> => {
    dispatch(invalidateEntitlement())
    const result = await dispatch(loadEntitlement())
    if (loadEntitlement.fulfilled.match(result)) return result.payload
    return null
  }, [dispatch])

  const loading = entitlementStatus === "idle" || entitlementStatus === "loading"

  const value = useMemo<StudentEntitlementContextValue>(() => {
    const canAccessLsacContent = Boolean(entitlement?.isLsacEligible)
    const isPaymentRequired = entitlement?.accessState === "PAYMENT_REQUIRED"
    const isLsacSetupRequired = Boolean(entitlement && !entitlement.isLsacEligible && !isPaymentRequired)

    return {
      entitlement,
      loading,
      error: entitlementError,
      canAccessLsacContent,
      isPaymentRequired,
      isLsacSetupRequired,
      refresh,
    }
  }, [entitlement, entitlementError, loading, refresh])

  return (
    <StudentEntitlementContext.Provider value={value}>{children}</StudentEntitlementContext.Provider>
  )
}

function useStudentEntitlement(): StudentEntitlementContextValue {
  const ctx = useContext(StudentEntitlementContext)
  if (!ctx) {
    throw new Error("useStudentEntitlement must be used within StudentEntitlementProvider")
  }
  return ctx
}

/** Safe for components that may render outside the provider (returns locked defaults). */
function useStudentEntitlementOptional(): StudentEntitlementContextValue | null {
  return useContext(StudentEntitlementContext)
}

function isLsacContentPath(pathname: string): boolean {
  if (pathname === "/app" || pathname === "/app/") return false
  if (pathname.startsWith("/app/diagnostic")) return false
  if (pathname.startsWith("/app/lsac-link")) return false
  if (pathname.startsWith("/app/lsac-link-step")) return false
  // Academy Prep Course is BetterLSAT curriculum — available before LawHub coach link.
  if (pathname.startsWith("/app/prep-course")) return false

  return (
    pathname.startsWith("/app/practice") ||
    pathname.startsWith("/app/preptest") ||
    pathname.startsWith("/app/learn") ||
    pathname.startsWith("/app/analytics")
  )
}

function isLsacLockedNavItem(href: string): boolean {
  // Prep Course stays clickable while LSAC pool content remains locked.
  if (href === "/app/prep-course" || href.startsWith("/app/prep-course/")) return false
  // Diagnostic explanations are BetterLSAT marketing content, not LawHub pool.
  if (href === "/app/diagnostic/explanations" || href.startsWith("/app/diagnostic/explanations/")) {
    return false
  }
  // Produktly feedback / roadmap are available without LawHub coach link.
  if (href === "/app/feedback" || href === "/app/roadmap") return false
  return true
}

export {
  StudentEntitlementProvider,
  useStudentEntitlement,
  useStudentEntitlementOptional,
  isLsacContentPath,
  isLsacLockedNavItem,
}
