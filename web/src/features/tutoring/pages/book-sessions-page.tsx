import { Navigate } from "react-router-dom"

import { STUDENT_FREE_STRATEGY_CALL_HREF } from "@/features/app-shell/student-nav-config"

/** Legacy `/app/tutoring/book` → Free Strategy Call screen. */
function BookSessionsPage() {
  return <Navigate to={STUDENT_FREE_STRATEGY_CALL_HREF} replace />
}

export { BookSessionsPage }
