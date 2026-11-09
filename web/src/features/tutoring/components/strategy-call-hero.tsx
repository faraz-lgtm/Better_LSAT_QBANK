import { Button } from "@/components/ui/button"

type StrategyCallHeroProps = {
  onBookClick?: () => void
  /** Figma Book Sessions CTA; defaults to Free Strategy Call copy. */
  ctaLabel?: string
}

function StrategyCallHero({
  onBookClick,
  ctaLabel = "Book your FREE Call with a 175+ Scorer",
}: StrategyCallHeroProps) {
  return (
    <section className="w-full rounded-[20px] border border-[#dbe5f3] bg-[var(--greyscale-0)] p-[30px]">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex h-[34px] items-center rounded-[14px] bg-[#ddf3e7] px-4 text-xs font-bold tracking-[0.02em] text-[#17996f]">
          ✓ 175+ Scoring Tutors
        </span>
        <span className="inline-flex h-[34px] items-center rounded-[14px] bg-[var(--primary-0)] px-4 text-xs font-semibold tracking-[0.02em] text-[var(--primary)]">
          200+ Students Tutored
        </span>
      </div>

      <h2 className="py-3 text-[20px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
        Not sure what to fix first?
        <br />
        Ask someone who scored 175+ in LSAT.
      </h2>
      <p className="max-w-[1014px] text-sm leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
        In 15 minutes, we&apos;ll look at where you are, where you want to be, and how much time you have. Then
        we&apos;ll show you the fastest way to close the gap.
      </p>

      <div className="grid gap-4 pb-3 pt-6 md:grid-cols-2">
        <div className="flex gap-4 rounded-[14px] bg-[var(--primary-25)] p-[18px]">
          <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--greyscale-0)] text-[18px] font-bold text-[var(--primary)]">
            1
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-[0.02em] text-[var(--color-student-heading)]">
              Tell us where you are
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
              Leave with a clear next step
            </h3>
            <p className="mt-1 text-sm tracking-[0.02em] text-[#5a718f]">
              Know what to focus on for the next few weeks, and get an honest answer on whether you need tutoring
              or can get there on your own.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <Button
          type="button"
          size="lg"
          className="h-12 rounded-[10px] px-4"
          aria-controls="strategy-call-scheduler"
          onClick={onBookClick}
        >
          {ctaLabel}
        </Button>
        <p className="pt-3.5 text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
          15 minutes with a 175+ scorer. No cost, and nothing to buy on the call.
        </p>
      </div>
    </section>
  )
}

export { StrategyCallHero }
