import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown, Minus, Plus } from "lucide-react"

import {
  customPercentFromTiming,
  customTimeFromTiming,
  DRILL_CUSTOM_PERCENT_MAX,
  DRILL_CUSTOM_PERCENT_MIN,
  DRILL_CUSTOM_TIME_MAX_SECONDS,
  DRILL_CUSTOM_TIME_MIN_SECONDS,
  DRILL_CUSTOM_TIME_STEP_SECONDS,
  DRILL_SPEED_PERCENTS,
  drillTimingTriggerLabel,
  formatDrillMmSs,
  speedDrillSeconds,
  standardDrillSeconds,
  targetDrillSeconds,
} from "@/features/student/drills/drill-timing"
import { cn } from "@/lib/utils"

type DrillTimingMenuProps = {
  value: string
  onChange: (value: string) => void
  questionCount: number
  scaleFactor?: number
  perQuestionSeconds?: number
  ariaLabel?: string
}

function averageLabel(totalSeconds: number, questionCount: number): string {
  const n = Math.max(1, questionCount)
  return `Average ${formatDrillMmSs(totalSeconds / n)}/question`
}

function Stepper({
  label,
  onDecrement,
  onIncrement,
}: {
  label: string
  onDecrement: () => void
  onIncrement: () => void
}) {
  return (
    <div className="inline-flex h-9 shrink-0 items-center rounded-[10px] border border-[#dfe1e7] bg-white">
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center text-[#666d80] transition hover:text-[#062357]"
        aria-label={`Decrease ${label}`}
        onClick={(event) => {
          event.stopPropagation()
          onDecrement()
        }}
      >
        <Minus className="size-4" strokeWidth={2} aria-hidden />
      </button>
      <span className="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums text-[#062357]">{label}</span>
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center text-[#666d80] transition hover:text-[#062357]"
        aria-label={`Increase ${label}`}
        onClick={(event) => {
          event.stopPropagation()
          onIncrement()
        }}
      >
        <Plus className="size-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}

function PresetRow({
  selected,
  title,
  detail,
  onSelect,
}: {
  selected: boolean
  title: string
  detail?: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors",
        selected ? "bg-[#edf3ff] text-[#082c6b]" : "text-[#062357] hover:bg-[#edf3ff]/60",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">{title}</span>
        {detail ? (
          <span className="mt-0.5 block text-xs font-normal tracking-[0.24px] text-[#666d80]">{detail}</span>
        ) : null}
      </span>
      {selected ? <Check className="size-4 shrink-0" aria-hidden /> : <span className="size-4 shrink-0" aria-hidden />}
    </button>
  )
}

function DrillTimingMenu({
  value,
  onChange,
  questionCount,
  scaleFactor = 1,
  perQuestionSeconds = 80,
  ariaLabel = "Pace",
}: DrillTimingMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const listboxId = useId()
  const count = Math.max(1, questionCount)
  const standardSeconds = standardDrillSeconds(count, scaleFactor)
  const targetSeconds = targetDrillSeconds(count, scaleFactor)
  const triggerLabel = drillTimingTriggerLabel(value, count, scaleFactor, perQuestionSeconds)
  const customPercent = customPercentFromTiming(value, count, scaleFactor)
  const customTime = customTimeFromTiming(value, count, scaleFactor)
  const customPercentSeconds = Math.round((standardSeconds * customPercent) / 100)
  const customTimePercent = Math.max(
    DRILL_CUSTOM_PERCENT_MIN,
    Math.min(DRILL_CUSTOM_PERCENT_MAX, Math.round((customTime * 100) / standardSeconds)),
  )

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (containerRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  function select(next: string) {
    onChange(next)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function setPercent(next: number) {
    const clamped = Math.max(DRILL_CUSTOM_PERCENT_MIN, Math.min(DRILL_CUSTOM_PERCENT_MAX, next))
    onChange(clamped === 100 ? "pace" : `pct:${clamped}`)
  }

  function setTime(next: number) {
    const clamped = Math.max(DRILL_CUSTOM_TIME_MIN_SECONDS, Math.min(DRILL_CUSTOM_TIME_MAX_SECONDS, next))
    const snapped = Math.round(clamped / DRILL_CUSTOM_TIME_STEP_SECONDS) * DRILL_CUSTOM_TIME_STEP_SECONDS
    onChange(snapped === standardSeconds ? "pace" : `time:${snapped}`)
  }

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        className={cn(
          "flex h-[52px] w-full min-w-[140px] items-center gap-2 border px-3 text-base font-normal tracking-[0.32px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1]/30",
          "rounded-[16px]",
          open
            ? "border-[#0d47a1] bg-[#f0f5ff] font-medium text-[#062357]"
            : "border-[#dfe1e7] bg-[#f0f5ff] text-[#062357] hover:border-[#c5d4ef]",
        )}
      >
        <span className="flex-1 truncate text-left">{triggerLabel}</span>
        <ChevronDown
          className={cn("size-5 shrink-0 text-[#666d80] transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 z-40 mt-2 flex max-h-[min(32rem,calc(100vh-8rem))] w-max min-w-full max-w-[min(26.25rem,calc(100vw-2rem))] flex-col overflow-y-auto rounded-[12px] border border-[#dfe1e7] bg-white p-2 shadow-[0px_12px_24px_rgba(13,13,18,0.12)]"
        >
          <PresetRow
            selected={value === "pace"}
            title="Standard"
            detail={`${formatDrillMmSs(standardSeconds)} • ${averageLabel(standardSeconds, count)}`}
            onSelect={() => select("pace")}
          />
          <PresetRow selected={value === "unlimited"} title="Unlimited" detail="∞" onSelect={() => select("unlimited")} />
          <PresetRow
            selected={value === "target"}
            title="Target"
            detail={`${formatDrillMmSs(targetSeconds)} • ${averageLabel(targetSeconds, count)}`}
            onSelect={() => select("target")}
          />
          <PresetRow
            selected={value === "per-q"}
            title={drillTimingTriggerLabel("per-q", count, scaleFactor, perQuestionSeconds)}
            onSelect={() => select("per-q")}
          />

          <p className="mb-1 mt-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-[#666d80]">SPEED TRAINING</p>
          {DRILL_SPEED_PERCENTS.map((percent) => {
            const seconds = speedDrillSeconds(count, percent, scaleFactor)
            return (
              <PresetRow
                key={percent}
                selected={value === `speed:${percent}`}
                title={`${percent}%`}
                detail={`${formatDrillMmSs(seconds)} • ${averageLabel(seconds, count)}`}
                onSelect={() => select(`speed:${percent}`)}
              />
            )
          })}

          <p className="mb-1 mt-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-[#666d80]">CUSTOM</p>
          <div className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-2">
            <Stepper
              label={`${customPercent} %`}
              onDecrement={() => setPercent(customPercent - 1)}
              onIncrement={() => setPercent(customPercent + 1)}
            />
            <p className="m-0 min-w-0 text-right text-xs leading-snug text-[#666d80]">
              <span className="block font-semibold tabular-nums text-[#062357]">{formatDrillMmSs(customPercentSeconds)}</span>
              {averageLabel(customPercentSeconds, count)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-2">
            <Stepper
              label={formatDrillMmSs(customTime)}
              onDecrement={() => setTime(customTime - DRILL_CUSTOM_TIME_STEP_SECONDS)}
              onIncrement={() => setTime(customTime + DRILL_CUSTOM_TIME_STEP_SECONDS)}
            />
            <p className="m-0 min-w-0 text-right text-xs leading-snug text-[#666d80]">
              <span className="block font-semibold text-[#062357]">{customTimePercent}% standard</span>
              {formatDrillMmSs(customTime / count)}/question
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { DrillTimingMenu }
