import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { StrategyCallHero } from "@/features/tutoring/components/strategy-call-hero"
import { StrategyCallScheduler } from "@/features/tutoring/components/strategy-call-scheduler"
import { TutoringPackagesSection } from "@/features/tutoring/components/tutoring-packages-section"
import { TutoringTestimonials } from "@/features/tutoring/components/tutoring-testimonials"
import { STUDENT_TUTORING_AFTER_BOOKING_HREF } from "@/features/app-shell/student-nav-config"
import { MOCK_TUTORING_SESSIONS, TUTORING_PACKAGES } from "@/features/tutoring/lib/mock-sessions-data"
import type { TutoringPackageId } from "@/features/tutoring/lib/types"
import { StudentMain } from "@/features/student/components/student-main"

function BookSessionsPage() {
  const [selectedPackageId, setSelectedPackageId] = useState<TutoringPackageId>("pack-5")

  function scrollToScheduler() {
    document.getElementById("strategy-call-scheduler")?.scrollIntoView({ behavior: "smooth", block: "start" })
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
        <Button asChild variant="outline" size="sm" className="h-10 shrink-0 rounded-[10px]">
          <Link to={STUDENT_TUTORING_AFTER_BOOKING_HREF}>View after booking</Link>
        </Button>
      </header>

      <StrategyCallHero onBookClick={scrollToScheduler} />
      <div id="strategy-call-scheduler">
        <StrategyCallScheduler />
      </div>
      <TutoringPackagesSection
        packages={TUTORING_PACKAGES}
        title="Choose Your Tutoring Package"
        helperLinkLabel="Book a strategy call →"
        selectedPackageId={selectedPackageId}
        onSelectPackage={setSelectedPackageId}
        onHelperClick={scrollToScheduler}
      />
      <TutoringTestimonials testimonials={MOCK_TUTORING_SESSIONS.testimonials} />
    </StudentMain>
  )
}

export { BookSessionsPage }
