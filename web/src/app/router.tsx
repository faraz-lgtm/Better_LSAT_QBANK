import { type ReactElement, useEffect, useState } from "react"
import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation } from "react-router-dom"

import { StudentAppShell } from "@/features/app-shell/student-app-shell"
import { LoginPage } from "@/features/auth/pages/login-page"
import { SignupPage } from "@/features/auth/pages/signup-page"
import { SignupCheckEmailPage } from "@/features/auth/pages/signup-check-email-page"
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page"
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page"
import { AuthCallbackPage } from "@/features/auth/pages/auth-callback-page"
import { LsacLinkPage } from "@/features/auth/pages/lsac-link-page"
import { PricingPage } from "@/features/billing/pages/pricing-page"
import { OnboardingPage } from "@/features/auth/pages/onboarding-page"
import { OnboardingWelcomePreviewPage } from "@/features/auth/pages/onboarding-welcome-preview-page"
import { GuestDiagnosticStartPage } from "@/features/guest/pages/guest-diagnostic-start-page"
import { GuestDiagnosticResultsPage } from "@/features/guest/pages/guest-diagnostic-results-page"
import { GuestDiagnosticResultsPreviewPage } from "@/features/guest/pages/guest-diagnostic-results-preview-page"
import { MarketingHomePage } from "@/features/marketing/pages/marketing-home-page"
import { IntentPage } from "@/features/auth/pages/intent-page"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { PrepCourseContentPage } from "@/features/prep-course/pages/prep-course-content-page"
import { PrepCourseLessonPage } from "@/features/prep-course/pages/prep-course-lesson-page"
import { PrepCourseListPage } from "@/features/prep-course/pages/prep-course-list-page"
import { AnalyticsDrillResultsPage } from "@/features/student/pages/analytics-drill-results-page"
import { PracticeSessionResultsPage } from "@/features/student/pages/practice-session-results-page"
import { AnalyticsDrillsPage } from "@/features/student/pages/analytics-drills-page"
import { AnalyticsPage } from "@/features/student/pages/analytics-page"
import { AnalyticsPrepTestResultsPage } from "@/features/student/pages/analytics-prep-test-results-page"
import { AnalyticsPrepTestsPage } from "@/features/student/pages/analytics-preptests-page"
import { AnalyticsQuestionTypeReviewPage } from "@/features/student/pages/analytics-question-type-review-page"
import { AnalyticsSectionsPage } from "@/features/student/pages/analytics-sections-page"
import { ExplanationQuestionDetailPage } from "@/features/student/pages/explanation-question-detail-page"
import { ExplanationsPage } from "@/features/student/pages/explanations-page"
import { PracticeBlindReviewPage } from "@/features/student/pages/practice-blind-review-page"
import { PracticeBlindReviewPrepTestPage } from "@/features/student/pages/practice-blind-review-prep-test-page"
import { DrillSessionPage } from "@/features/student/pages/drill-session-page"
import { LrNewDrillPage } from "@/features/student/pages/lr-new-drill-page"
import { RcNewDrillPage } from "@/features/student/pages/rc-new-drill-page"
import { PracticeDrillsPage } from "@/features/student/pages/practice-drills-page"
import { LegacyPrepTestPathRedirect } from "@/features/student/preptests/legacy-preptest-path-redirect"
import { isPrepTestStudentPath } from "@/features/student/preptests/preptest-routes"
import { PracticePrepTestPage } from "@/features/student/pages/practice-preptest-page"
import { PracticePrepTestsListPage } from "@/features/student/pages/practice-preptests-list-page"
import { PracticePrepTestSectionPage } from "@/features/student/pages/practice-preptest-section-page"
import { LrNewSectionPage } from "@/features/student/pages/lr-new-section-page"
import { PracticeSectionsPage } from "@/features/student/pages/practice-sections-page"
import { RcNewSectionPage } from "@/features/student/pages/rc-new-section-page"
import { RcQuestionNavPreviewPage } from "@/features/student/pages/rc-question-nav-preview-page"
import { SectionSessionPage } from "@/features/student/pages/section-session-page"
import { AdminShell } from "@/features/admin/layout/admin-shell"
import { AdminDashboardPage } from "@/features/admin/pages/admin-dashboard-page"
import { AdminTaxonomyPage } from "@/features/admin/pages/admin-taxonomy-page"
import { AdminPrepTestsPage } from "@/features/admin/pages/admin-preptests-page"
import { AdminPrepTestDetailPage } from "@/features/admin/pages/admin-preptest-detail-page"
import { AdminQuestionEditorPage } from "@/features/admin/pages/admin-question-editor-page"
import { AdminQuestionVideoRecordPage } from "@/features/admin/pages/admin-question-video-record-page"
import { AdminCoursesPage } from "@/features/admin/pages/admin-courses-page"
import { AdminYouTryPage } from "@/features/admin/pages/admin-you-try-page"
import { AdminConfigPage } from "@/features/admin/pages/admin-config-page"
import { AdminScoreTablesPage } from "@/features/admin/pages/admin-score-tables-page"
import { AdminUsersPage } from "@/features/admin/pages/admin-users-page"
import { AdminUserDetailPage } from "@/features/admin/pages/admin-user-detail-page"
import { createUsersApi, type UserEntitlement, type UserProfile } from "@/lib/api/users"
import { readDiagnosticFunnelState } from "@/lib/auth/diagnostic-intent"
import { shouldAllowAuthenticatedIntentPage } from "@/lib/auth/diagnostic-funnel-redirect"
import { resolvePostAuthDestination, type PostAuthDestination } from "@/lib/auth/post-auth-redirect"
import { allowsPrepTestUnauthenticatedPreview } from "@/lib/dev/prep-test-ui-preview"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function PublicOnly({ children }: { children: ReactElement }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [destination, setDestination] = useState<PostAuthDestination | null>(null)

  useEffect(() => {
    let alive = true
    const supabase = getSupabaseBrowserClient()
    const usersApi = createUsersApi(supabase)

    const syncDestination = async (nextProfile: UserProfile | null) => {
      if (!nextProfile) {
        setDestination(null)
        return
      }
      try {
        const nextEntitlement = await usersApi.getEntitlementState()
        if (!alive) return
        setDestination(resolvePostAuthDestination(nextProfile, nextEntitlement, readDiagnosticFunnelState()))
      } catch {
        if (!alive) return
        setDestination(resolvePostAuthDestination(nextProfile, null, readDiagnosticFunnelState()))
      }
    }

    const syncState = async () => {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      const hasSession = Boolean(data.session)
      setIsAuthenticated(hasSession)
      if (!hasSession) {
        setProfile(null)
        setDestination(null)
        return
      }
      try {
        const nextProfile = await usersApi.getMyProfile()
        if (!alive) return
        setProfile(nextProfile)
        await syncDestination(nextProfile)
      } catch {
        if (!alive) return
        setProfile(null)
        setDestination(null)
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
        return
      }
      void usersApi
        .getMyProfile()
        .then(async (nextProfile) => {
          if (!alive) return
          setProfile(nextProfile)
          await syncDestination(nextProfile)
        })
        .catch(() => {
          // Keep the existing profile on transient refetch failures (e.g. token refresh
          // after edge function calls). Clearing profile here unmounts the whole app shell.
        })
    })
    return () => {
      alive = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (isAuthenticated === null) return null
  if (!isAuthenticated) return children
  if (!profile || !destination) return null
  return <Navigate to={destination} replace />
}

function IntentRouteGuard({
  render,
}: {
  render: (isAuthenticated: boolean) => ReactElement
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [entitlement, setEntitlement] = useState<UserEntitlement | null>(null)
  const [destination, setDestination] = useState<PostAuthDestination | null>(null)

  useEffect(() => {
    let alive = true
    const supabase = getSupabaseBrowserClient()
    const usersApi = createUsersApi(supabase)
    const funnel = readDiagnosticFunnelState()

    const syncDestination = async (nextProfile: UserProfile | null) => {
      if (!nextProfile) {
        setEntitlement(null)
        setDestination(null)
        return
      }
      try {
        const nextEntitlement = await usersApi.getEntitlementState()
        if (!alive) return
        setEntitlement(nextEntitlement)
        if (shouldAllowAuthenticatedIntentPage(nextEntitlement, funnel)) {
          setDestination(null)
          return
        }
        setDestination(resolvePostAuthDestination(nextProfile, nextEntitlement, funnel))
      } catch {
        if (!alive) return
        setEntitlement(null)
        if (shouldAllowAuthenticatedIntentPage(null, funnel)) {
          setDestination(null)
          return
        }
        setDestination(resolvePostAuthDestination(nextProfile, null, funnel))
      }
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
        return
      }
      try {
        const nextProfile = await usersApi.getMyProfile()
        if (!alive) return
        setProfile(nextProfile)
        await syncDestination(nextProfile)
      } catch {
        if (!alive) return
        setProfile(null)
        setEntitlement(null)
        setDestination(null)
      }
    }

    void syncState()
    return () => {
      alive = false
    }
  }, [])

  if (isAuthenticated === null) return null
  if (!isAuthenticated) return render(false)
  if (!profile) return null
  if (destination) return <Navigate to={destination} replace />
  if (shouldAllowAuthenticatedIntentPage(entitlement, readDiagnosticFunnelState())) return render(true)
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
    location.pathname.startsWith("/app/practice/preptest") || isPrepTestStudentPath(location.pathname)

  useEffect(() => {
    let alive = true
    const supabase = getSupabaseBrowserClient()
    const usersApi = createUsersApi(supabase)

    const syncAuthAndProfile = async () => {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      const hasSession = Boolean(data.session)
      setIsAuthenticated(hasSession)
      if (!hasSession) {
        setProfile(null)
        return
      }
      try {
        const nextProfile = await usersApi.getMyProfile()
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
        return
      }
      void usersApi
        .getMyProfile()
        .then((nextProfile) => {
          if (!alive) return
          setProfile(nextProfile)
        })
        .catch(() => {
          // Preserve profile during background refetches triggered by Supabase auth events.
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
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--primary-0)]">
        <StudentPageLoader centered label="Loading…" />
      </div>
    )
  }
  if (requiredRole === "admin" && profile.role !== "admin" && profile.role !== "super_admin") {
    return <Navigate to="/app" replace />
  }
  if (requiredRole === "student" && profile.role === "admin") return <Navigate to="/admin" replace />
  return children
}

function RequireLsacEntitlement({ children }: { children: ReactElement }) {
  // Payment and LawHub linking are soft-gated in the dashboard — do not hard-block the app shell.
  return children
}

const router = createBrowserRouter([
  { path: "/", element: <MarketingHomePage /> },
  { path: "/login", element: <PublicOnly><LoginPage /></PublicOnly> },
  {
    path: "/intent",
    element: <IntentRouteGuard render={(isAuthenticated) => <IntentPage isAuthenticated={isAuthenticated} />} />,
  },
  { path: "/signup", element: <PublicOnly><SignupPage /></PublicOnly> },
  { path: "/signup/check-email", element: <SignupCheckEmailPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  { path: "/onboarding/preview", element: <OnboardingWelcomePreviewPage /> },
  {
    path: "/diagnostic/start",
    element: (
      <RequireRole requiredRole="student">
        <GuestDiagnosticStartPage />
      </RequireRole>
    ),
  },
  { path: "/diagnostic/start/preview", element: <GuestDiagnosticStartPage preview /> },
  { path: "/diagnostic/results/preview", element: <GuestDiagnosticResultsPreviewPage /> },
  { path: "/practice/rc-nav/preview", element: <RcQuestionNavPreviewPage /> },
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
          { index: true, element: <DashboardPage /> },
          { path: "diagnostic/results", element: <GuestDiagnosticResultsPage /> },
          { path: "learn/explanations", element: <ExplanationsPage /> },
          { path: "learn/explanations/q/:questionId", element: <ExplanationQuestionDetailPage /> },
          { path: "prep-course", element: <PrepCourseListPage /> },
          { path: "prep-course/:courseSlug", element: <PrepCourseContentPage /> },
          { path: "prep-course/:courseSlug/:lessonSlug", element: <PrepCourseLessonPage /> },
          { path: "practice/drills", element: <PracticeDrillsPage /> },
          { path: "practice/drills/lr/new", element: <LrNewDrillPage /> },
          { path: "practice/drills/rc/new", element: <RcNewDrillPage /> },
          { path: "practice/drills/session/:sessionId", element: <DrillSessionPage /> },
          { path: "practice/results/:sessionId", element: <PracticeSessionResultsPage /> },
          { path: "practice/sections", element: <PracticeSectionsPage /> },
          { path: "practice/sections/lr/new", element: <LrNewSectionPage /> },
          { path: "practice/sections/rc/new", element: <RcNewSectionPage /> },
          { path: "practice/sections/rc/nav-preview", element: <RcQuestionNavPreviewPage /> },
          { path: "practice/sections/session/:sessionId", element: <SectionSessionPage /> },
          { path: "practice/sections/rc", element: <Navigate to="/app/practice/sections/rc/new" replace /> },
          { path: "practice/sections/rc/session", element: <Navigate to="/app/practice/sections/rc/new" replace /> },
          { path: "preptest/:testId/section/:sectionId", element: <PracticePrepTestSectionPage /> },
          { path: "preptest/:testId", element: <PracticePrepTestPage /> },
          { path: "preptest", element: <PracticePrepTestsListPage /> },
          { path: "practice/preptest/:testId/section/:sectionId", element: <LegacyPrepTestPathRedirect /> },
          { path: "practice/preptest/:testId", element: <LegacyPrepTestPathRedirect /> },
          { path: "practice/preptest", element: <LegacyPrepTestPathRedirect /> },
          { path: "practice/blind-review", element: <PracticeBlindReviewPage /> },
          { path: "practice/blind-review/:testId", element: <PracticeBlindReviewPrepTestPage /> },
          { path: "analytics", element: <AnalyticsPage /> },
          { path: "analytics/drills", element: <AnalyticsDrillsPage /> },
          { path: "analytics/drills/results/:sessionId", element: <AnalyticsDrillResultsPage /> },
          { path: "analytics/review/:questionTypeId", element: <AnalyticsQuestionTypeReviewPage /> },
          { path: "analytics/sections", element: <AnalyticsSectionsPage /> },
          { path: "analytics/preptests", element: <AnalyticsPrepTestsPage /> },
          { path: "analytics/preptests/results/:testId", element: <AnalyticsPrepTestResultsPage /> },
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
        element: <AdminQuestionVideoRecordPage />,
      },
      {
        element: <AdminShell />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboardPage /> },
          { path: "taxonomy", element: <AdminTaxonomyPage /> },
          { path: "preptests", element: <AdminPrepTestsPage /> },
          { path: "preptests/:prepTestId", element: <AdminPrepTestDetailPage /> },
          {
            path: "preptests/:prepTestId/sections/:sectionId/questions/:questionId",
            element: <AdminQuestionEditorPage />,
          },
          { path: "courses", element: <AdminCoursesPage /> },
          { path: "you-try", element: <AdminYouTryPage /> },
          { path: "config", element: <AdminConfigPage /> },
          { path: "score-tables", element: <AdminScoreTablesPage /> },
          { path: "users", element: <AdminUsersPage /> },
          { path: "users/:userId", element: <AdminUserDetailPage /> },
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
