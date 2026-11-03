import { useState } from "react"

import { StrategyCallHero } from "@/features/tutoring/components/strategy-call-hero"
import { StrategyCallScheduler } from "@/features/tutoring/components/strategy-call-scheduler"
import { TutoringPackagesSection } from "@/features/tutoring/components/tutoring-packages-section"
import { TutoringTestimonials } from "@/features/tutoring/components/tutoring-testimonials"
import { MOCK_TUTORING_SESSIONS, TUTORING_PACKAGES } from "@/features/tutoring/lib/mock-sessions-data"
import type { TutoringPackageId } from "@/features/tutoring/lib/types"
import { StudentMain } from "@/features/student/components/student-main"
import { cn } from "@/lib/utils"

function FreeStrategyCallPage() {
  const [selectedPackageId, setSelectedPackageId] = useState<TutoringPackageId>("pack-5")
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  const [schedulerMounted, setSchedulerMounted] = useState(false)

  function scrollToScheduler() {
    window.requestAnimationFrame(() => {
      document.getElementById("strategy-call-scheduler")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  /** Opens the widget if needed; never collapses — only scrolls when already open. */
  function showScheduler() {
    if (schedulerOpen) {
      scrollToScheduler()
      return
    }
    setSchedulerMounted(true)
    setSchedulerOpen(true)
    scrollToScheduler()
  }

  function closeScheduler() {
    setSchedulerOpen(false)
  }

  return (
    <StudentMain
      className="bg-[var(--primary-0)]"
      contentClassName="flex flex-col gap-6 bg-[var(--primary-0)] pb-12"
    >
      <header>
        <h1 className="student-page-heading text-[18px] font-bold leading-[1.35]">
          Free 15-Minute Strategy Call
        </h1>
        <p className="mt-2 max-w-[920px] text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
          Talk to a 175+ LSAT scorer about your score, your test date, and what to fix first. It&apos;s free, and
          there&apos;s no pressure to buy anything.
        </p>
      </header>

      <StrategyCallHero
        onBookClick={showScheduler}
        bookButtonExpanded={schedulerOpen}
      />

      <div
        id="strategy-call-scheduler"
        className={cn(
          "grid transition-[grid-template-rows] duration-500 ease-in-out",
          schedulerOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        aria-hidden={!schedulerOpen}
      >
        <div className="min-h-0 overflow-hidden">
          {schedulerMounted ? <StrategyCallScheduler onClose={closeScheduler} /> : null}
        </div>
      </div>

      <TutoringPackagesSection
        packages={TUTORING_PACKAGES}
        title="Choose Your Tutoring Package"
        helperLinkLabel="Book a strategy call →"
        selectedPackageId={selectedPackageId}
        onSelectPackage={setSelectedPackageId}
        onHelperClick={showScheduler}
      />
      <TutoringTestimonials testimonials={MOCK_TUTORING_SESSIONS.testimonials} />
    </StudentMain>
  )
}

export { FreeStrategyCallPage }
