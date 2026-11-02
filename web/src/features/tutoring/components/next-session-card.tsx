import { Button } from "@/components/ui/button"
import type { TutoringSessionSummary } from "@/features/tutoring/lib/types"

type NextSessionCardProps = {
  session: TutoringSessionSummary
  onReschedule?: () => void
  onJoin?: () => void
}

function NextSessionCard({ session, onReschedule, onJoin }: NextSessionCardProps) {
  const [datePart, ...rest] = session.whenLabel.split(" · ")
  const meta = rest.join(" · ")

  return (
    <section className="flex min-h-[231px] flex-1 flex-col justify-between rounded-[16px] border border-[var(--primary-25)] bg-[var(--greyscale-0)] p-6">
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-bold tracking-[0.02em] text-[var(--primary)]">NEXT SESSION</p>
        <p className="tracking-[0.02em] text-[var(--greyscale-800)]">
          <span className="text-2xl font-extrabold leading-[1.4] tracking-[0.02em]">{datePart}</span>
          {meta ? (
            <span className="text-lg font-semibold leading-[1.4] text-[var(--primary)]"> · {meta}</span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-[14px] bg-[var(--primary-25)] text-[11px] font-bold text-[var(--primary)]">
            {session.tutorInitials}
          </span>
          <span className="text-sm tracking-[0.02em] text-[var(--greyscale-500)]">with</span>
          <span className="text-sm font-semibold tracking-[0.02em] text-[var(--greyscale-800)]">
            {session.tutorName}
          </span>
          <span className="text-xs tracking-[0.02em] text-[var(--greyscale-500)]">· Focus: {session.focus}</span>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2.5">
        <Button type="button" variant="outline" size="lg" className="h-12 rounded-[10px]" onClick={onReschedule}>
          Reschedule
        </Button>
        <Button type="button" size="lg" className="h-12 rounded-[10px]" onClick={onJoin}>
          Join Session
        </Button>
      </div>
    </section>
  )
}

export { NextSessionCard }
