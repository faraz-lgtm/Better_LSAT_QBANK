import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { NextSessionCard } from "@/features/tutoring/components/next-session-card"
import { PackageStatusCard } from "@/features/tutoring/components/package-status-card"
import { PastSessionsPanel } from "@/features/tutoring/components/past-sessions-panel"
import { TodoListSection } from "@/features/tutoring/components/todo-list-section"
import { TutoringPackagesSection } from "@/features/tutoring/components/tutoring-packages-section"
import { UpcomingSessionsList } from "@/features/tutoring/components/upcoming-sessions-list"
import {
  STUDENT_TUTORING_BOOK_HREF,
  STUDENT_TUTORING_SESSIONS_HREF,
} from "@/features/app-shell/student-nav-config"
import { getTutoringSessionsView } from "@/features/tutoring/lib/mock-sessions-data"
import type { TutoringPackageId } from "@/features/tutoring/lib/types"
import { StudentMain } from "@/features/student/components/student-main"

function AfterBookingSessionsPage() {
  const navigate = useNavigate()
  const view = getTutoringSessionsView(true)
  const [selectedPackageId, setSelectedPackageId] = useState<TutoringPackageId>("pack-5")

  if (!view.nextSession || !view.activePackage) {
    return null
  }

  return (
    <StudentMain
      className="bg-[var(--primary-0)]"
      contentClassName="flex flex-col gap-6 bg-[var(--primary-0)] pb-12"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="student-page-heading text-[18px] font-bold leading-[1.35]">My Sessions</h1>
          <p className="mt-2 text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
            Start with a strategy call, then choose the level of support that fits your prep.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="h-10 rounded-[10px]">
            <Link to={STUDENT_TUTORING_BOOK_HREF}>View booking screen</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10 rounded-[10px]">
            <Link to={STUDENT_TUTORING_SESSIONS_HREF}>View all Sessions</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <NextSessionCard session={view.nextSession} />
        <PackageStatusCard packageSummary={view.activePackage} />
      </div>

      <PastSessionsPanel sessions={view.pastSessions} transcript={view.transcript} />

      <div>
        <TodoListSection todos={view.todos} />
        <UpcomingSessionsList sessions={view.upcomingSessions} />
      </div>

      <TutoringPackagesSection
        packages={view.packages}
        title="Book your next Sessions"
        ctaLabel="Book More Sessions"
        helperLinkLabel="Talk to Us →"
        selectedPackageId={selectedPackageId}
        onSelectPackage={setSelectedPackageId}
        onCtaClick={() => navigate(STUDENT_TUTORING_BOOK_HREF)}
        onHelperClick={() => navigate(STUDENT_TUTORING_BOOK_HREF)}
      />
    </StudentMain>
  )
}

export { AfterBookingSessionsPage }
