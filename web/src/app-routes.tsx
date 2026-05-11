import { Route, Routes } from "react-router-dom"

import { StudentAppShell } from "@/features/app-shell/student-app-shell"
import { AuthCallbackPage } from "@/features/auth/pages/auth-callback-page"
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page"
import { LoginPage } from "@/features/auth/pages/login-page"
import { OnboardingPage } from "@/features/auth/pages/onboarding-page"
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page"
import { SignupPage } from "@/features/auth/pages/signup-page"
import { SignupCheckEmailPage } from "@/features/auth/pages/signup-check-email-page"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { PrepCourseOutlinePage } from "@/features/prep-course/pages/prep-course-outline-page"
import { PrepCourseLessonPage } from "@/features/prep-course/pages/prep-course-lesson-page"
import { PrepCoursePage } from "@/features/prep-course/pages/prep-course-page"
import { AnalyticsPage } from "@/features/student/pages/analytics-page"
import { ExplanationsPage } from "@/features/student/pages/explanations-page"
import { PracticeBlindReviewPage } from "@/features/student/pages/practice-blind-review-page"
import { PracticeDrillsPage } from "@/features/student/pages/practice-drills-page"
import { PracticePrepTestPage } from "@/features/student/pages/practice-preptest-page"
import { PracticeSectionsPage } from "@/features/student/pages/practice-sections-page"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/signup/check-email" element={<SignupCheckEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/app" element={<StudentAppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="learn/explanations" element={<ExplanationsPage />} />
        <Route path="prep-course" element={<PrepCoursePage />} />
        <Route path="prep-course/:courseSlug" element={<PrepCourseOutlinePage />} />
        <Route path="prep-course/:courseSlug/:lessonSlug" element={<PrepCourseLessonPage />} />
        <Route path="practice/drills" element={<PracticeDrillsPage />} />
        <Route path="practice/sections" element={<PracticeSectionsPage />} />
        <Route path="practice/preptest" element={<PracticePrepTestPage />} />
        <Route path="practice/blind-review" element={<PracticeBlindReviewPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  )
}

export { AppRoutes }
