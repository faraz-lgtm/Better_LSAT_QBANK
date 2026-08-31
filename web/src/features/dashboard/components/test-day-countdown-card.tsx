import { useEffect, useId, useRef, useState } from "react"
import { Check } from "lucide-react"

import {
  LSAC_OFFICIAL_TEST_WINDOWS,
  type LsatTestWindowOption,
} from "@/lib/lsac-test-window-options"
import { cn } from "@/lib/utils"

const TEST_DATE_OPTIONS: readonly LsatTestWindowOption[] = LSAC_OFFICIAL_TEST_WINDOWS

type TestDayCountdownCardProps = {
  daysRemaining: number | null
  firstName: string
  testMeta: string
  testDateLabel: string
  /** Selected window value (`yyyy-mm-dd`) */
  testDateValue: string
  adaptiveLoading?: boolean
  adaptiveDisabled?: boolean
  savingTestDate?: boolean
  onTestDateChange: (value: string) => void
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
  const controlsRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const [pickerOpen, setPickerOpen] = useState(false)

  function openDatePicker() {
    if (savingTestDate) return
    setPickerOpen((current) => !current)
  }

  useEffect(() => {
    if (!pickerOpen) return
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (controlsRef.current?.contains(event.target)) return
      setPickerOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPickerOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [pickerOpen])

  function handleSelect(nextValue: string) {
    if (!nextValue || nextValue === testDateValue) {
      setPickerOpen(false)
      return
    }
    onTestDateChange(nextValue)
    setPickerOpen(false)
  }

  return (
    <article className={cn("test-day-countdown", pickerOpen && "test-day-countdown--picker-open")}>
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
          <div ref={controlsRef} className="test-day-countdown__date-controls">
            <span className="test-day-countdown__date-chip">{testDateLabel}</span>
            <button
              type="button"
              onClick={openDatePicker}
              disabled={savingTestDate}
              className="test-day-countdown__edit"
              aria-label="Choose test date"
              aria-expanded={pickerOpen}
              aria-haspopup="listbox"
              aria-controls={pickerOpen ? listboxId : undefined}
            >
              {savingTestDate ? "Saving…" : "Edit"}
            </button>

            {pickerOpen ? (
              <div
                id={listboxId}
                role="listbox"
                aria-label="Choose LSAC test date"
                className="test-day-countdown__date-menu"
              >
                {TEST_DATE_OPTIONS.map((option) => {
                  const isSelected = option.value === testDateValue
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "test-day-countdown__date-menu-item",
                        isSelected && "test-day-countdown__date-menu-item--selected",
                      )}
                      onClick={() => handleSelect(option.value)}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{option.label}</span>
                        {option.detail ? (
                          <span className="mt-0.5 block truncate text-xs font-normal tracking-[0.24px] text-[#666d80]">
                            {option.detail}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <Check className="size-4 shrink-0 text-[#082c6b]" strokeWidth={2} aria-hidden />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
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
