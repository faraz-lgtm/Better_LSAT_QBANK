import { Button } from "@/components/ui/button"

type StrategyCallHeroProps = {
  onBookClick?: () => void
}

function StrategyCallHero({ onBookClick }: StrategyCallHeroProps) {
  return (
    <section className="rounded-[20px] border border-[#dbe5f3] bg-[var(--greyscale-0)] p-[30px]">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-[14px] bg-[#ddf3e7] px-4 py-2 text-xs font-bold tracking-[0.02em] text-[#17996f]">
          ✓ 175+ Scoring Tutors
        </span>
        <span className="rounded-[14px] bg-[var(--primary-0)] px-4 py-2 text-xs font-semibold tracking-[0.02em] text-[var(--primary)]">
          200+ Students Tutored
        </span>
      </div>

      <h2 className="mt-4 text-[20px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
        Know exactly what to work on next.
      </h2>
      <p className="mt-2 max-w-[1014px] text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
        In 15 minutes, we&apos;ll review your current score, target score, test date, and biggest weak spots then
        recommend the clearest next step for your prep.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="flex gap-4 rounded-[14px] bg-[var(--primary-25)] p-[18px]">
          <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--greyscale-0)] text-[18px] font-bold text-[var(--primary)]">
            1
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-[0.02em] text-[var(--color-student-heading)]">
              Bring your numbers
            </h3>
            <p className="mt-1 text-sm tracking-[0.02em] text-[#5a718f]">
              Your current score, target score, test date, and the part of the LSAT giving you the most trouble.
            </p>
          </div>
        </div>
        <div className="flex gap-4 rounded-[14px] bg-[var(--primary-25)] p-[18px]">
          <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--greyscale-0)] text-[18px] font-bold text-[var(--primary)]">
            2
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-[0.02em] text-[var(--color-student-heading)]">
              Leave with a plan
            </h3>
            <p className="mt-1 text-sm tracking-[0.02em] text-[#5a718f]">
              Know what to prioritize next and whether 1-on-1 tutoring would actually help you reach your goal.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2.5">
        <Button type="button" size="lg" className="h-12 rounded-[10px] px-4" onClick={onBookClick}>
          Book a Free Strategy Call
        </Button>
        <p className="text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
          15 minutes on Zoom. No cost, and nothing to buy on the call.
        </p>
      </div>
    </section>
  )
}

export { StrategyCallHero }
