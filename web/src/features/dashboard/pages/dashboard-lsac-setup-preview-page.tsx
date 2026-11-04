import { useEffect, useMemo } from "react"

import { useAppDispatch } from "@/app/hooks"
import {
  StudentEntitlementPreviewProvider,
  type StudentEntitlementContextValue,
} from "@/features/app-shell/student-entitlement-context"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { GuestPremiumLsacSetupShell } from "@/features/guest/diagnostic/guest-premium-lsac-setup-shell"
import { hydrateStudentSession } from "@/features/student-session/studentSessionSlice"
import type { UserEntitlement, UserProfile } from "@/lib/api/users"

const PREVIEW_DASHBOARD_HREF = "/dashboard/lsac-setup/preview"

const PREVIEW_ENTITLEMENT: UserEntitlement = {
  isAuthenticated: true,
  isLsacLinked: false,
  isLsacEligible: false,
  hasActiveCore: true,
  accessState: "LSAC_REQUIRED",
}

const PREVIEW_PROFILE: UserProfile = {
  id: "preview-premium-lsac-setup",
  email: "preview@betterlsat.local",
  full_name: "Alex Preview",
  first_name: "Alex",
  last_name: "Preview",
  phone: null,
  avatar_url: null,
  role: "student",
  student_coaching_id: null,
  is_first_time_login: false,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
}

/** Unauthenticated UI preview: premium student, LSAC / LawHub not linked. */
function DashboardLsacSetupPreviewPage() {
  const dispatch = useAppDispatch()

  const entitlementValue = useMemo<StudentEntitlementContextValue>(
    () => ({
      entitlement: PREVIEW_ENTITLEMENT,
      loading: false,
      error: null,
      canAccessLsacContent: false,
      isPaymentRequired: false,
      isLsacSetupRequired: true,
      refresh: async () => PREVIEW_ENTITLEMENT,
    }),
    [],
  )

  useEffect(() => {
    dispatch(
      hydrateStudentSession({
        profile: PREVIEW_PROFILE,
        entitlement: PREVIEW_ENTITLEMENT,
        studyContext: {
          preferences: {
            userId: PREVIEW_PROFILE.id,
            username: null,
            plannedLsatWindow: null,
            plannedLsatDate: "2026-06-01",
            lawSchoolCycle: null,
            goalScore: 170,
            startingScore: 150,
            studyDays: [],
            studyHoursLabel: null,
            wantsLessons: false,
            extraTimeSetting: "none",
            extraTimeCustomMinutes: null,
          },
          officialScores: [],
        },
      }),
    )
  }, [dispatch])

  return (
    <StudentEntitlementPreviewProvider value={entitlementValue}>
      <GuestPremiumLsacSetupShell dashboardHref={PREVIEW_DASHBOARD_HREF}>
        <div className="border-b border-[var(--greyscale-100)] bg-[var(--primary-25)] px-4 py-2 text-center text-xs font-medium tracking-[0.24px] text-[var(--color-student-heading)] sm:px-6">
          UI preview · premium plan, LSAC not linked — sidebar locks open the Link LSAC modal; Smart
          Drill / Practice drills open the dashboard prompt.
        </div>
        <DashboardPage />
      </GuestPremiumLsacSetupShell>
    </StudentEntitlementPreviewProvider>
  )
}

export { DashboardLsacSetupPreviewPage, PREVIEW_DASHBOARD_HREF }
