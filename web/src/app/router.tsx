import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
  type ReactElement,
  useEffect,
  useState,
} from "react"
import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation } from "react-router-dom"

import { StudentAppShell } from "@/features/app-shell/student-app-shell"
import { LoginPage } from "@/features/auth/pages/login-page"
import { SignupPage } from "@/features/auth/pages/signup-page"
import {
  LoginEmailCheckPage,
  SignupCheckEmailPage,
} from "@/features/auth/pages/signup-check-email-page"
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page"
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page"
import { AuthCallbackPage } from "@/features/auth/pages/auth-callback-page"
import { LsacLinkPage } from "@/features/auth/pages/lsac-link-page"
import { LsacLinkStepPage } from "@/features/auth/pages/lsac-link-step-page"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import {
  loadEntitlement,
  selectEntitlement,
  selectEntitlementLoading,
} from "@/features/student-session/studentSessionSlice"
import { CheckoutDetailsPage } from "@/features/billing/pages/checkout-details-page"
import { CheckoutPage } from "@/features/billing/pages/checkout-page"
import { PricingPage } from "@/features/billing/pages/pricing-page"
import { OnboardingPage } from "@/features/auth/pages/onboarding-page"
import { OnboardingWelcomePreviewPage } from "@/features/auth/pages/onboarding-welcome-preview-page"
import { IntentPage } from "@/features/auth/pages/intent-page"
import { resolveStudentShellVariant } from "@/features/app-shell/student-shell-plan-variant"
import { LegacyPrepTestPathRedirect } from "@/features/student/preptests/legacy-preptest-path-redirect"
import { isPrepTestStudentPath } from "@/features/student/preptests/preptest-routes"
import { AdminShell } from "@/features/admin/layout/admin-shell"
import type { UserEntitlement, UserProfile } from "@/lib/api/users"
import {
  ensureEntitlement,
  ensureProfile,
} from "@/features/student-session/ensure-student-session"
import { readDiagnosticFunnelState } from "@/lib/auth/diagnostic-intent"
import { shouldAllowAuthenticatedIntentPage } from "@/lib/auth/diagnostic-funnel-redirect"
import { shouldRedirectAuthenticatedUserToOnboarding } from "@/lib/auth/missing-profile-redirect"
import {
  parseSignupPlan,
  resolvePendingCheckoutDestination,
  savePendingCheckoutPlan,
} from "@/lib/auth/pending-checkout-plan"
import {
  resolvePostAuthDestination,
  type PostAuthDestination,
} from "@/lib/auth/post-auth-redirect"
import { allowsPrepTestUnauthenticatedPreview } from "@/lib/dev/prep-test-ui-preview"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/**
 * Defer work started from `onAuthStateChange`. Calling `getSession` / edge invokes
 * synchronously inside that callback can deadlock the GoTrue client after OAuth.
 */
function deferAuthWork(work: () => void) {
  window.setTimeout(work, 0)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lazy named exports keep page prop types loose at the route boundary
function lazyNamed(
  loader: () => Promise<Record<string, any>>,
  name: string,
): LazyExoticComponent<ComponentType<any>> {
  return lazy(async () => {
    const mod = await loader()
    return { default: mod[name] as ComponentType<any> }
  })
}

function LazyPage({ children }: { children: ReactElement }) {
  return <Suspense fallback={<StudentPageLoader centered label="Loading…" />}>{children}</Suspense>
}

const AccountPage = lazyNamed(() => import("@/features/account/pages/account-page"), "AccountPage")
const PrepTestPoolsPage = lazyNamed(
  () => import("@/features/account/pages/prep-test-pools-page"),
  "PrepTestPoolsPage",
)
const DashboardPage = lazyNamed(() => import("@/features/dashboard/pages/dashboard-page"), "DashboardPage")
const GuestDiagnosticStartPage = lazyNamed(
  () => import("@/features/guest/pages/guest-diagnostic-start-page"),
  "GuestDiagnosticStartPage",
)
const GuestDiagnosticResultsPage = lazyNamed(
  () => import("@/features/guest/pages/guest-diagnostic-results-page"),
  "GuestDiagnosticResultsPage",
)
const GuestDiagnosticResultsPreviewPage = lazyNamed(
  () => import("@/features/guest/pages/guest-diagnostic-results-preview-page"),
  "GuestDiagnosticResultsPreviewPage",
)
const GuestDiagnosticReviewPage = lazyNamed(
  () => import("@/features/guest/pages/guest-diagnostic-review-page"),
  "GuestDiagnosticReviewPage",
)
const DiagnosticResultsHistoryPage = lazyNamed(
  () => import("@/features/student/pages/diagnostic-results-history-page"),
  "DiagnosticResultsHistoryPage",
)
const DiagnosticResultsIndexRedirect = lazyNamed(
  () => import("@/features/student/pages/diagnostic-results-history-page"),
  "DiagnosticResultsIndexRedirect",
)
const PrepCourseCoursePage = lazyNamed(
  () => import("@/features/prep-course/pages/prep-course-course-page"),
  "PrepCourseCoursePage",
)
const PrepCourseLessonPage = lazyNamed(
  () => import("@/features/prep-course/pages/prep-course-lesson-page"),
  "PrepCourseLessonPage",
)
const PrepCourseListPage = lazyNamed(
  () => import("@/features/prep-course/pages/prep-course-list-page"),
  "PrepCourseListPage",
)
const AnalyticsDrillResultsPage = lazyNamed(
  () => import("@/features/student/pages/analytics-drill-results-page"),
  "AnalyticsDrillResultsPage",
)
const PracticeSessionResultsPage = lazyNamed(
  () => import("@/features/student/pages/practice-session-results-page"),
  "PracticeSessionResultsPage",
)
const AnalyticsDrillsPage = lazyNamed(
  () => import("@/features/student/pages/analytics-drills-page"),
  "AnalyticsDrillsPage",
)
const AnalyticsPage = lazyNamed(() => import("@/features/student/pages/analytics-page"), "AnalyticsPage")
const AnalyticsPrepTestResultsPage = lazyNamed(
  () => import("@/features/student/pages/analytics-prep-test-results-page"),
  "AnalyticsPrepTestResultsPage",
)
const AnalyticsPrepTestsPage = lazyNamed(
  () => import("@/features/student/pages/analytics-preptests-page"),
  "AnalyticsPrepTestsPage",
)
const AnalyticsQuestionTypeReviewPage = lazyNamed(
  () => import("@/features/student/pages/analytics-question-type-review-page"),
  "AnalyticsQuestionTypeReviewPage",
)
const AnalyticsSectionsPage = lazyNamed(
  () => import("@/features/student/pages/analytics-sections-page"),
  "AnalyticsSectionsPage",
)
const DiagnosticExplanationQuestionDetailPage = lazyNamed(
  () => import("@/features/student/pages/diagnostic-explanation-question-detail-page"),
  "DiagnosticExplanationQuestionDetailPage",
)
const DiagnosticExplanationsPage = lazyNamed(
  () => import("@/features/student/pages/diagnostic-explanations-page"),
  "DiagnosticExplanationsPage",
)
const ExplanationQuestionDetailPage = lazyNamed(
  () => import("@/features/student/pages/explanation-question-detail-page"),
  "ExplanationQuestionDetailPage",
)
const ExplanationsPage = lazyNamed(
  () => import("@/features/student/pages/explanations-page"),
  "ExplanationsPage",
)
const PracticeBlindReviewPage = lazyNamed(
  () => import("@/features/student/pages/practice-blind-review-page"),
  "PracticeBlindReviewPage",
)
const PracticeBlindReviewPrepTestPage = lazyNamed(
  () => import("@/features/student/pages/practice-blind-review-prep-test-page"),
  "PracticeBlindReviewPrepTestPage",
)
const DrillSessionPage = lazyNamed(
  () => import("@/features/student/pages/drill-session-page"),
  "DrillSessionPage",
)
const LrNewDrillPage = lazyNamed(() => import("@/features/student/pages/lr-new-drill-page"), "LrNewDrillPage")
const RcNewDrillPage = lazyNamed(() => import("@/features/student/pages/rc-new-drill-page"), "RcNewDrillPage")
const PracticeDrillsPage = lazyNamed(
  () => import("@/features/student/pages/practice-drills-page"),
  "PracticeDrillsPage",
)
const PracticePrepTestPage = lazyNamed(
  () => import("@/features/student/pages/practice-preptest-page"),
  "PracticePrepTestPage",
)
const PracticePrepTestsListPage = lazyNamed(
  () => import("@/features/student/pages/practice-preptests-list-page"),
  "PracticePrepTestsListPage",
)
const PracticePrepTestSectionPage = lazyNamed(
  () => import("@/features/student/pages/practice-preptest-section-page"),
  "PracticePrepTestSectionPage",
)
const LrNewSectionPage = lazyNamed(
  () => import("@/features/student/pages/lr-new-section-page"),
  "LrNewSectionPage",
)
const PracticeSectionsPage = lazyNamed(
  () => import("@/features/student/pages/practice-sections-page"),
  "PracticeSectionsPage",
)
const RcNewSectionPage = lazyNamed(
  () => import("@/features/student/pages/rc-new-section-page"),
  "RcNewSectionPage",
)
const RcQuestionNavPreviewPage = lazyNamed(
  () => import("@/features/student/pages/rc-question-nav-preview-page"),
  "RcQuestionNavPreviewPage",
)
const SectionSessionPage = lazyNamed(
  () => import("@/features/student/pages/section-session-page"),
  "SectionSessionPage",
)
const AdminDashboardPage = lazyNamed(
  () => import("@/features/admin/pages/admin-dashboard-page"),
  "AdminDashboardPage",
)
const AdminTaxonomyPage = lazyNamed(
  () => import("@/features/admin/pages/admin-taxonomy-page"),
  "AdminTaxonomyPage",
)
const AdminPrepTestsPage = lazyNamed(
  () => import("@/features/admin/pages/admin-preptests-page"),
  "AdminPrepTestsPage",
)
const AdminPrepTestDetailPage = lazyNamed(
  () => import("@/features/admin/pages/admin-preptest-detail-page"),
  "AdminPrepTestDetailPage",
)
const AdminQuestionEditorPage = lazyNamed(
  () => import("@/features/admin/pages/admin-question-editor-page"),
  "AdminQuestionEditorPage",
)
const AdminQuestionVideoRecordPage = lazyNamed(
  () => import("@/features/admin/pages/admin-question-video-record-page"),
  "AdminQuestionVideoRecordPage",
)
const AdminCoursesPage = lazyNamed(
  () => import("@/features/admin/pages/admin-courses-page"),
  "AdminCoursesPage",
)
const AdminYouTryPage = lazyNamed(() => import("@/features/admin/pages/admin-you-try-page"), "AdminYouTryPage")
const AdminConfigPage = lazyNamed(() => import("@/features/admin/pages/admin-config-page"), "AdminConfigPage")
const AdminScoreTablesPage = lazyNamed(
  () => import("@/features/admin/pages/admin-score-tables-page"),
  "AdminScoreTablesPage",
)
const AdminUsersPage = lazyNamed(() => import("@/features/admin/pages/admin-users-page"), "AdminUsersPage")
const AdminUserDetailPage = lazyNamed(
  () => import("@/features/admin/pages/admin-user-detail-page"),
  "AdminUserDetailPage",
)

function PublicOnly({ children }: { children: ReactElement }) {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [destination, setDestination] = useState<string | null>(null)
  const [profileChecked, setProfileChecked] = useState(false)

  useEffect(() => {
    let alive = true
    const supabase = getSupabaseBrowserClient()
    const selectedPlan = parseSignupPlan(new URLSearchParams(location.search).get("plan"))
    if (selectedPlan) savePendingCheckoutPlan(selectedPlan)

    const syncDestination = async (nextProfile: UserProfile | null) => {
      if (!nextProfile) {
        setDestination(null)
        return
      }
      const nextEntitlement = await ensureEntitlement()
      if (!alive) return
      setDestination(
        resolvePendingCheckoutDestination(
          resolvePostAuthDestination(nextProfile, nextEntitlement, readDiagnosticFunnelState()),
        ),
      )
    }

    const syncState = async () => {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      const hasSession = Boolean(data.session)
      setIsAuthenticated(hasSession)
      if (!hasSession) {
        setProfile(null)
        setDestination(null)
        setProfileChecked(true)
        return
      }
      try {
        const nextProfile = await ensureProfile()
        if (!alive) return
        setProfile(nextProfile)
        await syncDestination(nextProfile)
      } catch {
        if (!alive) return
        setProfile(null)
        setDestination(null)
      } finally {
        if (alive) setProfileChecked(true)
      }
    }

    void syncState()
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      const hasSession = Boolean(session)
      setIsAuthenticated(hasSession)
      if (!hasSession) {
        setProfile(null)
        setDestination(null)
        setProfileChecked(true)
        return
      }
      // Logged-out visit left profileChecked=true with a null profile. Clear that until
      // the post-login fetch finishes — otherwise we flash /onboarding for returning users.
      setProfileChecked(false)
      setDestination(null)
      // Defer: avoid getSession deadlock inside onAuthStateChange (common after Google OAuth).
      deferAuthWork(() => {
        void ensureProfile()
          .then(async (nextProfile) => {
            if (!alive) return
            // Never wipe a loaded profile with a null background refetch.
            if (nextProfile) {
              setProfile(nextProfile)
              await syncDestination(nextProfile)
            } else {
              setProfile(null)
              setDestination(null)
            }
            setProfileChecked(true)
          })
          .catch(() => {
            // Keep the existing profile on transient refetch failures (e.g. token refresh
            // after edge function calls). Clearing profile here unmounts the whole app shell.
            if (alive) setProfileChecked(true)
          })
      })
    })
    return () => {
      alive = false
      authListener.subscription.unsubscribe()
    }
  }, [location.search])

  if (isAuthenticated === null) return null
  if (!isAuthenticated) return children
  // Keep login/signup mounted while the post-sign-in profile fetch runs so the
  // page can finish navigate(); only redirect once profileChecked is true.
  if (!profileChecked) return children
  if (shouldRedirectAuthenticatedUserToOnboarding(profileChecked, profile)) {
    return <Navigate to="/onboarding" replace />
  }
  if (!destination) return null
  return <Navigate to={destination} replace />
}

function IntentRouteGuard({
  render,
}: {
  render: (opts: {
    isAuthenticated: boolean
    showUpgradeCta: boolean
    requiresOnboarding: boolean
  }) => ReactElement
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [entitlement, setEntitlement] = useState<UserEntitlement | null>(null)
  const [destination, setDestination] = useState<PostAuthDestination | null>(null)
  const [profileChecked, setProfileChecked] = useState(false)

  useEffect(() => {
    let alive = true
    const supabase = getSupabaseBrowserClient()
    const funnel = readDiagnosticFunnelState()

    const syncDestination = async (nextProfile: UserProfile | null) => {
      if (!nextProfile) {
        setEntitlement(null)
        setDestination(null)
        return
      }
      const nextEntitlement = await ensureEntitlement()
      if (!alive) return
      setEntitlement(nextEntitlement)
      // Exam done but first-login flag still set — land on results, not the intent picker.
      // Do NOT force /onboarding for all first-time users here: email magic-link flows often
      // land on /intent to re-pick a tier after storage was lost, and blocking that loops
      // diagnostic/start → intent → onboarding.
      if (nextProfile.is_first_time_login && funnel.completedDiagnostic) {
        setDestination(resolvePostAuthDestination(nextProfile, nextEntitlement, funnel))
        return
      }
      if (shouldAllowAuthenticatedIntentPage(nextEntitlement, funnel)) {
        setDestination(null)
        return
      }
      setDestination(resolvePostAuthDestination(nextProfile, nextEntitlement, funnel))
    }

    const syncState = async () => {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      const hasSession = Boolean(data.session)
      setIsAuthenticated(hasSession)
      if (!hasSession) {
        setProfile(null)
        setEntitlement(null)
        setDestination(null)
        setProfileChecked(true)
        return
      }
      try {
        const nextProfile = await ensureProfile()
        if (!alive) return
        setProfile(nextProfile)
        await syncDestination(nextProfile)
      } catch {
        if (!alive) return
        setProfile(null)
        setEntitlement(null)
        setDestination(null)
      } finally {
        if (alive) setProfileChecked(true)
      }
    }

    void syncState()
    return () => {
      alive = false
    }
  }, [])

  if (isAuthenticated === null) return null
  if (!isAuthenticated) {
    return render({ isAuthenticated: false, showUpgradeCta: true, requiresOnboarding: false })
  }
  if (!profileChecked) return null
  if (shouldRedirectAuthenticatedUserToOnboarding(profileChecked, profile)) {
    return <Navigate to="/onboarding" replace />
  }
  if (destination) return <Navigate to={destination} replace />
  if (shouldAllowAuthenticatedIntentPage(entitlement, readDiagnosticFunnelState())) {
    const showUpgradeCta =
      resolveStudentShellVariant({
        accessState: entitlement?.accessState ?? null,
      }) === "free-plan"
    return render({
      isAuthenticated: true,
      showUpgradeCta,
      requiresOnboarding: Boolean(profile?.is_first_time_login),
    })
  }
  return null
}

function RequireRole({ children, requiredRole }: { children: ReactElement; requiredRole: "admin" | "student" }) {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const studentPrepTestUiPreview =
    requiredRole === "student" &&
    allowsPrepTestUnauthenticatedPreview() &&
    (location.pathname.startsWith("/app/practice/preptest") || isPrepTestStudentPath(location.pathname))

  useEffect(() => {
    let alive = true
    const supabase = getSupabaseBrowserClient()

    const syncAuthAndProfile = async () => {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      const hasSession = Boolean(data.session)
      setIsAuthenticated(hasSession)
      if (!hasSession) {
        setProfile(null)
        setAuthChecked(true)
        return
      }
      try {
        const nextProfile = await ensureProfile()
        if (!alive) return
        setProfile(nextProfile)
      } catch {
        if (!alive) return
        setProfile(null)
      } finally {
        if (alive) setAuthChecked(true)
      }
    }

    void syncAuthAndProfile()
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      const hasSession = Boolean(session)
      setIsAuthenticated(hasSession)
      if (!hasSession) {
        setProfile(null)
        setAuthChecked(true)
        return
      }
      // Avoid flashing /onboarding when a prior logged-out pass left authChecked=true
      // with a null profile (same race as PublicOnly on /login).
      setAuthChecked(false)
      // Defer: avoid getSession deadlock inside onAuthStateChange (common after Google OAuth).
      deferAuthWork(() => {
        void ensureProfile()
          .then((nextProfile) => {
            if (!alive) return
            // Never wipe a loaded profile with a null background refetch.
            if (nextProfile) setProfile(nextProfile)
            setAuthChecked(true)
          })
          .catch(() => {
            // Preserve profile during background refetches triggered by Supabase auth events.
            if (alive) setAuthChecked(true)
          })
      })
    })
    return () => {
      alive = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (isAuthenticated === null) {
    if (studentPrepTestUiPreview) return children
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--primary-0)]">
        <StudentPageLoader centered label="Loading…" />
      </div>
    )
  }
  if (!isAuthenticated) {
    if (studentPrepTestUiPreview) return children
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!profile) {
    if (studentPrepTestUiPreview) return children
    if (!authChecked) {
      return (
        <div className="flex min-h-svh items-center justify-center bg-[var(--primary-0)]">
          <StudentPageLoader centered label="Loading…" />
        </div>
      )
    }
    // Authenticated but no app profile yet (typical right after Google signup).
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />
  }
  if (requiredRole === "admin" && profile.role !== "admin" && profile.role !== "super_admin") {
    return <Navigate to="/app" replace />
  }
  if (requiredRole === "student" && profile.role === "admin") return <Navigate to="/admin" replace />
  return children
}

function RequireLsacEntitlement({ children }: { children: ReactElement }) {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const entitlement = useAppSelector(selectEntitlement)
  const loading = useAppSelector(selectEntitlementLoading)
  const onLsacSetupPath = location.pathname.startsWith("/app/lsac-link-step")

  useEffect(() => {
    void dispatch(loadEntitlement())
  }, [dispatch])

  if (loading && !entitlement) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--primary-0)]">
        <StudentPageLoader centered label="Loading…" />
      </div>
    )
  }

  // Prefer hasActiveCore + !isLsacEligible over accessState === LSAC_REQUIRED
  // (link wall env flag defaults off). Allow the setup page itself through.
  if (
    !onLsacSetupPath &&
    entitlement?.hasActiveCore &&
    !entitlement.isLsacEligible
  ) {
    return <Navigate to="/app/lsac-link-step" replace />
  }

  return children
}

function RequireAuthenticated({ children }: { children: ReactElement }) {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true
    const supabase = getSupabaseBrowserClient()

    void supabase.auth.getSession().then(({ data }) => {
      if (alive) setIsAuthenticated(Boolean(data.session))
    })
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setIsAuthenticated(Boolean(session))
    })

    return () => {
      alive = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--primary-0)]">
        <StudentPageLoader centered label="Loading…" />
      </div>
    )
  }
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }
  return children
}

const router = createBrowserRouter([
  { path: "/", element: <PublicOnly><LoginPage /></PublicOnly> },
  { path: "/login", element: <PublicOnly><LoginPage /></PublicOnly> },
  { path: "/login/email-check", element: <LoginEmailCheckPage /> },
  {
    path: "/intent",
    element: (
      <IntentRouteGuard
        render={({ isAuthenticated, showUpgradeCta, requiresOnboarding }) => (
          <IntentPage
            isAuthenticated={isAuthenticated}
            showUpgradeCta={showUpgradeCta}
            requiresOnboarding={requiresOnboarding}
          />
        )}
      />
    ),
  },
  { path: "/signup", element: <PublicOnly><SignupPage /></PublicOnly> },
  { path: "/signup/check-email", element: <SignupCheckEmailPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  { path: "/onboarding/preview", element: <OnboardingWelcomePreviewPage /> },
  { path: "/lsac-link-step", element: <Navigate to="/app/lsac-link-step" replace /> },
  {
    path: "/checkout",
    element: (
      <RequireAuthenticated>
        <CheckoutPage />
      </RequireAuthenticated>
    ),
  },
  {
    path: "/checkout/details",
    element: (
      <RequireAuthenticated>
        <CheckoutDetailsPage />
      </RequireAuthenticated>
    ),
  },
  {
    path: "/diagnostic/start",
    // Session only — exam UI does not need a profiles row. Avoids onboarding↔diagnostic
    // loops when the session cache still holds a pre-onboarding null profile.
    element: (
      <RequireAuthenticated>
        <LazyPage>
          <GuestDiagnosticStartPage />
        </LazyPage>
      </RequireAuthenticated>
    ),
  },
  {
    path: "/diagnostic/start/preview",
    element: (
      <LazyPage>
        <GuestDiagnosticStartPage preview />
      </LazyPage>
    ),
  },
  {
    path: "/diagnostic/results/preview",
    element: (
      <LazyPage>
        <GuestDiagnosticResultsPreviewPage />
      </LazyPage>
    ),
  },
  {
    path: "/diagnostic/review",
    element: (
      <RequireAuthenticated>
        <LazyPage>
          <GuestDiagnosticReviewPage mode="review" />
        </LazyPage>
      </RequireAuthenticated>
    ),
  },
  {
    path: "/diagnostic/tester",
    element: (
      <RequireAuthenticated>
        <LazyPage>
          <GuestDiagnosticReviewPage mode="tester" />
        </LazyPage>
      </RequireAuthenticated>
    ),
  },
  {
    path: "/diagnostic/review/preview",
    element: (
      <LazyPage>
        <GuestDiagnosticReviewPage mode="review" preview />
      </LazyPage>
    ),
  },
  {
    path: "/diagnostic/tester/preview",
    element: (
      <LazyPage>
        <GuestDiagnosticReviewPage mode="tester" preview />
      </LazyPage>
    ),
  },
  {
    path: "/practice/rc-nav/preview",
    element: (
      <LazyPage>
        <RcQuestionNavPreviewPage />
      </LazyPage>
    ),
  },
  {
    path: "/app",
    element: (
      <RequireRole requiredRole="student">
        <Outlet />
      </RequireRole>
    ),
    children: [
      { path: "pricing", element: <PricingPage /> },
      { path: "lsac-link", element: <LsacLinkPage /> },
      {
        element: (
          <RequireLsacEntitlement>
            <StudentAppShell />
          </RequireLsacEntitlement>
        ),
        children: [
          {
            path: "lsac-link-step",
            element: <LsacLinkStepPage />,
          },
          {
            index: true,
            element: (
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            ),
          },
          {
            path: "diagnostic/results",
            element: (
              <LazyPage>
                <DiagnosticResultsIndexRedirect />
              </LazyPage>
            ),
          },
          {
            path: "diagnostic/results/mini",
            element: (
              <LazyPage>
                <DiagnosticResultsHistoryPage section="mini" />
              </LazyPage>
            ),
          },
          {
            path: "diagnostic/results/mini/:attemptId",
            element: (
              <LazyPage>
                <GuestDiagnosticResultsPage section="mini" />
              </LazyPage>
            ),
          },
          {
            path: "diagnostic/results/full",
            element: (
              <LazyPage>
                <DiagnosticResultsHistoryPage section="full" />
              </LazyPage>
            ),
          },
          {
            path: "diagnostic/results/full/:attemptId",
            element: (
              <LazyPage>
                <GuestDiagnosticResultsPage section="full" />
              </LazyPage>
            ),
          },
          {
            path: "account",
            element: (
              <LazyPage>
                <AccountPage />
              </LazyPage>
            ),
          },
          {
            path: "settings",
            element: (
              <LazyPage>
                <PrepTestPoolsPage />
              </LazyPage>
            ),
          },
          { path: "account/prep-test-pools", element: <Navigate to="/app/settings" replace /> },
          { path: "account/settings", element: <Navigate to="/app/settings" replace /> },
          { path: "diagnostic/review", element: <Navigate to="/diagnostic/review" replace /> },
          { path: "diagnostic/tester", element: <Navigate to="/diagnostic/tester" replace /> },
          {
            path: "diagnostic/explanations",
            element: (
              <LazyPage>
                <DiagnosticExplanationsPage />
              </LazyPage>
            ),
          },
          {
            path: "diagnostic/explanations/q/:questionId",
            element: (
              <LazyPage>
                <DiagnosticExplanationQuestionDetailPage />
              </LazyPage>
            ),
          },
          {
            path: "learn/explanations",
            element: (
              <LazyPage>
                <ExplanationsPage />
              </LazyPage>
            ),
          },
          {
            path: "learn/explanations/q/:questionId",
            element: (
              <LazyPage>
                <ExplanationQuestionDetailPage />
              </LazyPage>
            ),
          },
          {
            path: "prep-course",
            element: (
              <LazyPage>
                <PrepCourseListPage />
              </LazyPage>
            ),
          },
          {
            path: "prep-course/:courseSlug",
            element: (
              <LazyPage>
                <PrepCourseCoursePage />
              </LazyPage>
            ),
          },
          {
            path: "prep-course/:courseSlug/:lessonSlug",
            element: (
              <LazyPage>
                <PrepCourseLessonPage />
              </LazyPage>
            ),
          },
          {
            path: "prep-course/:courseSlug/:lessonSlug/start",
            element: (
              <LazyPage>
                <PrepCourseLessonPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/drills",
            element: (
              <LazyPage>
                <PracticeDrillsPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/drills/lr/new",
            element: (
              <LazyPage>
                <LrNewDrillPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/drills/rc/new",
            element: (
              <LazyPage>
                <RcNewDrillPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/drills/session/:sessionId",
            element: (
              <LazyPage>
                <DrillSessionPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/results/:sessionId",
            element: (
              <LazyPage>
                <PracticeSessionResultsPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/sections",
            element: (
              <LazyPage>
                <PracticeSectionsPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/sections/lr/new",
            element: (
              <LazyPage>
                <LrNewSectionPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/sections/rc/new",
            element: (
              <LazyPage>
                <RcNewSectionPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/sections/rc/nav-preview",
            element: (
              <LazyPage>
                <RcQuestionNavPreviewPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/sections/session/:sessionId",
            element: (
              <LazyPage>
                <SectionSessionPage />
              </LazyPage>
            ),
          },
          { path: "practice/sections/rc", element: <Navigate to="/app/practice/sections/rc/new" replace /> },
          { path: "practice/sections/rc/session", element: <Navigate to="/app/practice/sections/rc/new" replace /> },
          {
            path: "preptest/:testId/section/:sectionId",
            element: (
              <LazyPage>
                <PracticePrepTestSectionPage />
              </LazyPage>
            ),
          },
          {
            path: "preptest/:testId",
            element: (
              <LazyPage>
                <PracticePrepTestPage />
              </LazyPage>
            ),
          },
          {
            path: "preptest",
            element: (
              <LazyPage>
                <PracticePrepTestsListPage />
              </LazyPage>
            ),
          },
          { path: "practice/preptest/:testId/section/:sectionId", element: <LegacyPrepTestPathRedirect /> },
          { path: "practice/preptest/:testId", element: <LegacyPrepTestPathRedirect /> },
          { path: "practice/preptest", element: <LegacyPrepTestPathRedirect /> },
          {
            path: "practice/blind-review",
            element: (
              <LazyPage>
                <PracticeBlindReviewPage />
              </LazyPage>
            ),
          },
          {
            path: "practice/blind-review/:testId",
            element: (
              <LazyPage>
                <PracticeBlindReviewPrepTestPage />
              </LazyPage>
            ),
          },
          {
            path: "analytics",
            element: (
              <LazyPage>
                <AnalyticsPage />
              </LazyPage>
            ),
          },
          {
            path: "analytics/drills",
            element: (
              <LazyPage>
                <AnalyticsDrillsPage />
              </LazyPage>
            ),
          },
          {
            path: "analytics/drills/results/:sessionId",
            element: (
              <LazyPage>
                <AnalyticsDrillResultsPage />
              </LazyPage>
            ),
          },
          {
            path: "analytics/review/:questionTypeId",
            element: (
              <LazyPage>
                <AnalyticsQuestionTypeReviewPage />
              </LazyPage>
            ),
          },
          {
            path: "analytics/sections",
            element: (
              <LazyPage>
                <AnalyticsSectionsPage />
              </LazyPage>
            ),
          },
          {
            path: "analytics/preptests",
            element: (
              <LazyPage>
                <AnalyticsPrepTestsPage />
              </LazyPage>
            ),
          },
          {
            path: "analytics/preptests/results/:testId",
            element: (
              <LazyPage>
                <AnalyticsPrepTestResultsPage />
              </LazyPage>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <RequireRole requiredRole="admin">
        <Outlet />
      </RequireRole>
    ),
    children: [
      {
        path: "preptests/:prepTestId/sections/:sectionId/questions/:questionId/record",
        element: (
          <LazyPage>
            <AdminQuestionVideoRecordPage />
          </LazyPage>
        ),
      },
      {
        element: <AdminShell />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          {
            path: "dashboard",
            element: (
              <LazyPage>
                <AdminDashboardPage />
              </LazyPage>
            ),
          },
          {
            path: "taxonomy",
            element: (
              <LazyPage>
                <AdminTaxonomyPage />
              </LazyPage>
            ),
          },
          {
            path: "preptests",
            element: (
              <LazyPage>
                <AdminPrepTestsPage />
              </LazyPage>
            ),
          },
          {
            path: "preptests/:prepTestId",
            element: (
              <LazyPage>
                <AdminPrepTestDetailPage />
              </LazyPage>
            ),
          },
          {
            path: "preptests/:prepTestId/sections/:sectionId/questions/:questionId",
            element: (
              <LazyPage>
                <AdminQuestionEditorPage />
              </LazyPage>
            ),
          },
          {
            path: "courses",
            element: (
              <LazyPage>
                <AdminCoursesPage />
              </LazyPage>
            ),
          },
          {
            path: "you-try",
            element: (
              <LazyPage>
                <AdminYouTryPage />
              </LazyPage>
            ),
          },
          {
            path: "config",
            element: (
              <LazyPage>
                <AdminConfigPage />
              </LazyPage>
            ),
          },
          {
            path: "score-tables",
            element: (
              <LazyPage>
                <AdminScoreTablesPage />
              </LazyPage>
            ),
          },
          {
            path: "users",
            element: (
              <LazyPage>
                <AdminUsersPage />
              </LazyPage>
            ),
          },
          {
            path: "users/:userId",
            element: (
              <LazyPage>
                <AdminUserDetailPage />
              </LazyPage>
            ),
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
])

function AppRouter() {
  return <RouterProvider router={router} />
}

export { AppRouter }
