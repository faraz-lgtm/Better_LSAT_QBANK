import { type ReactElement, useEffect, useState } from "react"
import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation } from "react-router-dom"

import { StudentAppShell } from "@/features/app-shell/student-app-shell"
import { LoginPage } from "@/features/auth/pages/login-page"
import { SignupPage } from "@/features/auth/pages/signup-page"
import { SignupCheckEmailPage } from "@/features/auth/pages/signup-check-email-page"
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page"
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page"
import { AuthCallbackPage } from "@/features/auth/pages/auth-callback-page"
import { OnboardingPage } from "@/features/auth/pages/onboarding-page"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { PrepCourseOutlinePage } from "@/features/prep-course/pages/prep-course-outline-page"
import { PrepCoursePage } from "@/features/prep-course/pages/prep-course-page"
import { PrepCourseLessonPage } from "@/features/prep-course/pages/prep-course-lesson-page"
import { AnalyticsPage } from "@/features/student/pages/analytics-page"
import { ExplanationsPage } from "@/features/student/pages/explanations-page"
import { PracticeBlindReviewPage } from "@/features/student/pages/practice-blind-review-page"
import { PracticeDrillsPage } from "@/features/student/pages/practice-drills-page"
import { PracticePrepTestPage } from "@/features/student/pages/practice-preptest-page"
import { PracticeSectionsPage } from "@/features/student/pages/practice-sections-page"
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
import { createUsersApi, type UserProfile } from "@/lib/api/users"
import { getPostAuthDestination } from "@/lib/auth/post-auth-redirect"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function PublicOnly({ children }: { children: ReactElement }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    let alive = true
    const supabase = getSupabaseBrowserClient()
    const usersApi = createUsersApi(supabase)

    const syncState = async () => {
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
      }
    }

    void syncState()
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
          if (!alive) return
          setProfile(null)
        })
    })
    return () => {
      alive = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (isAuthenticated === null) return null
  if (!isAuthenticated) return children
  if (!profile) return null
  return <Navigate to={getPostAuthDestination(profile)} replace />
}

function RequireRole({ children, requiredRole }: { children: ReactElement; requiredRole: "admin" | "student" }) {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

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
          if (!alive) return
          setProfile(null)
        })
    })
    return () => {
      alive = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (isAuthenticated === null) return null
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!profile) return null
  if (requiredRole === "admin" && profile.role !== "admin" && profile.role !== "super_admin") {
    return <Navigate to="/app" replace />
  }
  if (requiredRole === "student" && profile.role === "admin") return <Navigate to="/admin" replace />
  return children
}

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <PublicOnly><LoginPage /></PublicOnly> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/signup/check-email", element: <SignupCheckEmailPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  {
    path: "/app",
    element: (
      <RequireRole requiredRole="student">
        <StudentAppShell />
      </RequireRole>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "learn/explanations", element: <ExplanationsPage /> },
      { path: "prep-course", element: <PrepCoursePage /> },
      { path: "prep-course/:courseSlug", element: <PrepCourseOutlinePage /> },
      { path: "prep-course/:courseSlug/:lessonSlug", element: <PrepCourseLessonPage /> },
      { path: "practice/drills", element: <PracticeDrillsPage /> },
      { path: "practice/sections", element: <PracticeSectionsPage /> },
      { path: "practice/preptest", element: <PracticePrepTestPage /> },
      { path: "practice/blind-review", element: <PracticeBlindReviewPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
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
