import { Navigate, Route, Routes } from "react-router-dom"

import { StudentAppShell } from "@/features/app-shell/student-app-shell"
import { AuthCallbackPage } from "@/features/auth/pages/auth-callback-page"
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page"
import { LoginPage } from "@/features/auth/pages/login-page"
import { OnboardingPage } from "@/features/auth/pages/onboarding-page"
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page"
import { SignupPage } from "@/features/auth/pages/signup-page"
import { SignupCheckEmailPage } from "@/features/auth/pages/signup-check-email-page"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { PrepCourseContentPage } from "@/features/prep-course/pages/prep-course-content-page"
import { PrepCourseLessonPage } from "@/features/prep-course/pages/prep-course-lesson-page"
import { PrepCourseListPage } from "@/features/prep-course/pages/prep-course-list-page"
import { AnalyticsDrillResultsPage } from "@/features/student/pages/analytics-drill-results-page"
import { AnalyticsDrillsPage } from "@/features/student/pages/analytics-drills-page"
import { AnalyticsPage } from "@/features/student/pages/analytics-page"
import { AnalyticsPrepTestResultsPage } from "@/features/student/pages/analytics-prep-test-results-page"
import { AnalyticsPrepTestsPage } from "@/features/student/pages/analytics-preptests-page"
import { AnalyticsSectionsPage } from "@/features/student/pages/analytics-sections-page"
import { ExplanationQuestionDetailPage } from "@/features/student/pages/explanation-question-detail-page"
import { ExplanationsPage } from "@/features/student/pages/explanations-page"
import { DrillSessionPage } from "@/features/student/pages/drill-session-page"
import { LrNewDrillPage } from "@/features/student/pages/lr-new-drill-page"
import { RcNewDrillPage } from "@/features/student/pages/rc-new-drill-page"
import { PracticeBlindReviewPage } from "@/features/student/pages/practice-blind-review-page"
import { PracticeBlindReviewPrepTestPage } from "@/features/student/pages/practice-blind-review-prep-test-page"
import { PracticeDrillsPage } from "@/features/student/pages/practice-drills-page"
import { PracticePrepTestPage } from "@/features/student/pages/practice-preptest-page"
import { PracticePrepTestsListPage } from "@/features/student/pages/practice-preptests-list-page"
import { PracticePrepTestSectionPage } from "@/features/student/pages/practice-preptest-section-page"
import { PracticeSectionsPage } from "@/features/student/pages/practice-sections-page"
import { SectionSessionPage } from "@/features/student/pages/section-session-page"

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
        <Route path="learn/explanations/q/:questionId" element={<ExplanationQuestionDetailPage />} />
        <Route path="prep-course" element={<PrepCourseListPage />} />
        <Route path="prep-course/:courseSlug" element={<PrepCourseContentPage />} />
        <Route path="prep-course/:courseSlug/:lessonSlug" element={<PrepCourseLessonPage />} />
        <Route path="practice/drills" element={<PracticeDrillsPage />} />
        <Route path="practice/drills/lr/new" element={<LrNewDrillPage />} />
        <Route path="practice/drills/rc/new" element={<RcNewDrillPage />} />
        <Route path="practice/drills/session/:sessionId" element={<DrillSessionPage />} />
        <Route path="practice/sections" element={<PracticeSectionsPage />} />
        <Route path="practice/sections/session/:sessionId" element={<SectionSessionPage />} />
        <Route path="practice/sections/rc" element={<Navigate to="/app/practice/sections" replace />} />
        <Route path="practice/sections/rc/session" element={<Navigate to="/app/practice/sections" replace />} />
        <Route path="practice/preptest/:testId/section/:sectionId" element={<PracticePrepTestSectionPage />} />
        <Route path="practice/preptest/:testId" element={<PracticePrepTestPage />} />
        <Route path="practice/preptest" element={<PracticePrepTestsListPage />} />
        <Route path="practice/blind-review" element={<PracticeBlindReviewPage />} />
        <Route path="practice/blind-review/:testId" element={<PracticeBlindReviewPrepTestPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="analytics/drills" element={<AnalyticsDrillsPage />} />
        <Route path="analytics/drills/results/:sessionId" element={<AnalyticsDrillResultsPage />} />
        <Route path="analytics/sections" element={<AnalyticsSectionsPage />} />
        <Route path="analytics/preptests" element={<AnalyticsPrepTestsPage />} />
        <Route path="analytics/preptests/results/:testId" element={<AnalyticsPrepTestResultsPage />} />
      </Route>
    </Routes>
  )
}

export { AppRoutes }
