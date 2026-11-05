import { Navigate } from "react-router-dom"

import { STUDENT_TUTORING_SESSIONS_HREF } from "@/features/app-shell/student-nav-config"

/** `/sessions/all` → My Sessions (View all Sessions screen). */
function ViewAllSessionsPage() {
  return <Navigate to={STUDENT_TUTORING_SESSIONS_HREF} replace />
}

export { ViewAllSessionsPage }
