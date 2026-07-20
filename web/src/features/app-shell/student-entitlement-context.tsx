import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { createUsersApi, type UserEntitlement } from "@/lib/api/users"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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
  const [entitlement, setEntitlement] = useState<UserEntitlement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const refresh = useCallback(async (): Promise<UserEntitlement | null> => {
    if (!usersApi) {
      setEntitlement(null)
      setLoading(false)
      setError("Supabase env is missing.")
      return null
    }

    try {
      const next = await usersApi.getEntitlementState()
      setEntitlement(next)
      setError(null)
      return next
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load entitlement.")
      return null
    } finally {
      setLoading(false)
    }
  }, [usersApi])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<StudentEntitlementContextValue>(() => {
    const canAccessLsacContent = Boolean(entitlement?.isLsacEligible)
    const isPaymentRequired = entitlement?.accessState === "PAYMENT_REQUIRED"
    const isLsacSetupRequired = Boolean(entitlement && !entitlement.isLsacEligible && !isPaymentRequired)

    return {
      entitlement,
      loading,
      error,
      canAccessLsacContent,
      isPaymentRequired,
      isLsacSetupRequired,
      refresh,
    }
  }, [entitlement, error, loading, refresh])

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
  if (pathname.startsWith("/app/pricing")) return false
  if (pathname.startsWith("/app/lsac-link")) return false
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
  return true
}

export {
  StudentEntitlementProvider,
  useStudentEntitlement,
  useStudentEntitlementOptional,
  isLsacContentPath,
  isLsacLockedNavItem,
}
