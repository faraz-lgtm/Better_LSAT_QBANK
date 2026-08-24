import { useRef, useState } from "react"
import { Calendar } from "lucide-react"

type TestDayCountdownCardProps = {
  daysRemaining: number | null
  firstName: string
  testMeta: string
  testDateLabel: string
  /** ISO date `yyyy-mm-dd` for the native date picker value */
  testDateValue: string
  adaptiveLoading?: boolean
  adaptiveDisabled?: boolean
  savingTestDate?: boolean
  onTestDateChange: (isoDate: string) => void
  onStartAdaptiveDrill: () => void
}

function TestDayCountdownCard({
  daysRemaining,
  firstName,
  testMeta,
  testDateLabel,
  testDateValue,
  adaptiveLoading = false,
  adaptiveDisabled = false,
  savingTestDate = false,
  onTestDateChange,
  onStartAdaptiveDrill,
}: TestDayCountdownCardProps) {
  const greetingName = firstName.trim() || "there"
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  function openDatePicker() {
    const input = dateInputRef.current
    if (!input || savingTestDate) return
    setPickerOpen(true)
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker()
        return
      }
    } catch {
      // Fall through to focus/click for browsers that block showPicker.
    }
    input.focus()
    input.click()
  }

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
      </div>

      <p className="test-day-countdown__greeting">
        You&apos;ve got this, {greetingName}. Let&apos;s make every day count.
      </p>
      <p className="test-day-countdown__meta">{testMeta}</p>

      <div className="test-day-countdown__actions">
        <div className="test-day-countdown__date-bar">
          <span className="test-day-countdown__date-label">Test Date</span>
          <span className="test-day-countdown__date-chip relative">
            <span>{testDateLabel}</span>
            <Calendar className="size-4 shrink-0 text-[#666d80]" strokeWidth={1.75} aria-hidden />
            <input
              ref={dateInputRef}
              type="date"
              value={testDateValue}
              aria-label="Choose test date"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => {
                const next = event.target.value
                if (!next) return
                onTestDateChange(next)
                setPickerOpen(false)
              }}
              onBlur={() => setPickerOpen(false)}
            />
          </span>
          <button
            type="button"
            onClick={openDatePicker}
            disabled={savingTestDate}
            className="test-day-countdown__edit"
            aria-expanded={pickerOpen}
            aria-haspopup="dialog"
          >
            {savingTestDate ? "Saving…" : "Edit"}
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
