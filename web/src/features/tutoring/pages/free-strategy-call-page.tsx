import { StrategyCallHero } from "@/features/tutoring/components/strategy-call-hero"
import { StrategyCallScheduler } from "@/features/tutoring/components/strategy-call-scheduler"
import { StudentMain } from "@/features/student/components/student-main"

function FreeStrategyCallPage() {
  function scrollToScheduler() {
    window.requestAnimationFrame(() => {
      document.getElementById("strategy-call-scheduler")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
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
        <p className="mt-2 max-w-[920px] text-sm leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
          Talk to a 175+ LSAT scorer about your score, your test date, and what to fix first. It&apos;s free, and
          there&apos;s no pressure to buy anything.
        </p>
      </header>

      <StrategyCallHero onBookClick={scrollToScheduler} />
      <StrategyCallScheduler />
    </StudentMain>
  )
}

export { FreeStrategyCallPage }
