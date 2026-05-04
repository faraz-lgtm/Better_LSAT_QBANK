import { Route, Routes } from "react-router-dom"

import { AuthCallbackPage } from "@/features/auth/pages/auth-callback-page"
import { LoginPage } from "@/features/auth/pages/login-page"
import { OnboardingPage } from "@/features/auth/pages/onboarding-page"
import { SignupPage } from "@/features/auth/pages/signup-page"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { PrepCourseLessonPage } from "@/features/prep-course/pages/prep-course-lesson-page"
import { PrepCoursePage } from "@/features/prep-course/pages/prep-course-page"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/app" element={<DashboardPage />} />
      <Route path="/app/prep-course" element={<PrepCoursePage />} />
      <Route path="/app/prep-course/:courseSlug/:lessonSlug" element={<PrepCourseLessonPage />} />
    </Routes>
  )
}

export { AppRoutes }
