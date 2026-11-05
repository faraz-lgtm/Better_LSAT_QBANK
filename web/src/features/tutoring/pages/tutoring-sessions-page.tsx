import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PastSessionsTable } from "@/features/tutoring/components/past-sessions-table"
import { STUDENT_TUTORING_BOOK_HREF } from "@/features/app-shell/student-nav-config"
import { MOCK_TUTORING_SESSIONS } from "@/features/tutoring/lib/mock-sessions-data"
import { StudentMain } from "@/features/student/components/student-main"

/** My Sessions → View all Sessions screen. */
function TutoringSessionsPage() {
  return (
    <StudentMain
      className="bg-[var(--primary-0)]"
      contentClassName="flex flex-col gap-6 bg-[var(--primary-0)] pb-12"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="student-page-heading text-[18px] font-bold leading-[1.35]">View all Sessions</h1>
          <p className="mt-2 text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
            Join, reschedule and review your tutoring sessions.
          </p>
        </div>
        <Button asChild size="lg" className="h-12 shrink-0 rounded-[10px] px-4">
          <Link to={STUDENT_TUTORING_BOOK_HREF}>Book More Sessions</Link>
        </Button>
      </header>

      <PastSessionsTable sessions={MOCK_TUTORING_SESSIONS.pastSessions} />
    </StudentMain>
  )
}

export { TutoringSessionsPage }
