import { Calendar } from "lucide-react"

type TestDayCountdownCardProps = {
  daysRemaining: number | null
  firstName: string
  testMeta: string
  testDateLabel: string
  adaptiveLoading?: boolean
  adaptiveDisabled?: boolean
  onEditTestDate: () => void
  onStartAdaptiveDrill: () => void
}

function TestDayCountdownCard({
  daysRemaining,
  firstName,
  testMeta,
  testDateLabel,
  adaptiveLoading = false,
  adaptiveDisabled = false,
  onEditTestDate,
  onStartAdaptiveDrill,
}: TestDayCountdownCardProps) {
  const greetingName = firstName.trim() || "there"

  return (
    <article className="test-day-countdown">
      <div className="test-day-countdown__glow" aria-hidden />

      <div className="test-day-countdown__header">
        <div className="test-day-countdown__title-block">
          <p className="test-day-countdown__eyebrow">Test Day Countdown</p>
          <div className="test-day-countdown__days">
            <span className="test-day-countdown__days-value">
              {daysRemaining != null ? daysRemaining : "—"}
            </span>
            <span className="test-day-countdown__days-unit">days</span>
          </div>
        </div>
        <span className="test-day-countdown__flame">
          <img src="/dashboard/flame.svg" alt="" width={28} height={28} />
        </span>
      </div>

      <p className="test-day-countdown__greeting">
        You&apos;ve got this, {greetingName}. Let&apos;s make every day count.
      </p>
      <p className="test-day-countdown__meta">{testMeta}</p>

      <div className="test-day-countdown__actions">
        <div className="test-day-countdown__date-bar">
          <span className="test-day-countdown__date-label">Test Date</span>
          <span className="test-day-countdown__date-chip">
            <span>{testDateLabel}</span>
            <Calendar className="size-4 shrink-0 text-[#666d80]" strokeWidth={1.75} aria-hidden />
          </span>
          <button type="button" onClick={onEditTestDate} className="test-day-countdown__edit">
            Edit
          </button>
        </div>

        <div className="test-day-countdown__cta-wrap">
          <button
            type="button"
            disabled={adaptiveDisabled || adaptiveLoading}
            onClick={onStartAdaptiveDrill}
            className="test-day-countdown__cta"
          >
            {adaptiveLoading ? "Starting…" : "Start Smart Drill"}
          </button>
        </div>
      </div>
    </article>
  )
}

export { TestDayCountdownCard }
