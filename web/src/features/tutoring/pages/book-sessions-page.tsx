import { useState } from "react"

import { StrategyCallHero } from "@/features/tutoring/components/strategy-call-hero"
import { StrategyCallScheduler } from "@/features/tutoring/components/strategy-call-scheduler"
import { TutoringPackagesSection } from "@/features/tutoring/components/tutoring-packages-section"
import { TutoringTestimonials } from "@/features/tutoring/components/tutoring-testimonials"
import {
  MOCK_TUTORING_SESSIONS,
  TUTORING_PACKAGES,
} from "@/features/tutoring/lib/mock-sessions-data"
import type { TutoringPackageId } from "@/features/tutoring/lib/types"
import { StudentMain } from "@/features/student/components/student-main"

/** Figma `Book Sessions` (21584:28663) — strategy call + packages booking screen. */
function BookSessionsPage() {
  const [selectedPackageId, setSelectedPackageId] = useState<TutoringPackageId>("pack-5")
  const [calendarOpen, setCalendarOpen] = useState(false)

  function scrollToScheduler() {
    window.requestAnimationFrame(() => {
      document.getElementById("strategy-call-scheduler")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function showCalendar() {
    if (calendarOpen) {
      scrollToScheduler()
      return
    }
    setCalendarOpen(true)
    scrollToScheduler()
  }

  return (
    <StudentMain
      className="bg-[var(--primary-0)]"
      contentClassName="flex flex-col gap-6 bg-[var(--primary-0)] pb-12"
    >
      <header>
        <h1 className="student-page-heading text-[18px] font-bold leading-[1.35]">My Sessions</h1>
        <p className="mt-2 text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
          Start with a strategy call, then choose the level of support that fits your prep.
        </p>
      </header>

      <StrategyCallHero
        ctaLabel="Book Your Free 15-Minute Call"
        onBookClick={showCalendar}
      />

      <StrategyCallScheduler
        calendarOpen={calendarOpen}
        onOpenCalendar={showCalendar}
        onCloseCalendar={() => setCalendarOpen(false)}
      />

      <TutoringPackagesSection
        packages={TUTORING_PACKAGES}
        title="Choose Your Tutoring Package"
        helperLinkLabel="Book a strategy call →"
        selectedPackageId={selectedPackageId}
        onSelectPackage={setSelectedPackageId}
        onHelperClick={showCalendar}
      />

      <TutoringTestimonials testimonials={MOCK_TUTORING_SESSIONS.testimonials} />
    </StudentMain>
  )
}

export { BookSessionsPage }
