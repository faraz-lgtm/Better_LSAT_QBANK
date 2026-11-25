import { useEffect, useMemo, useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react"

import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"

export type DateRangeValue = { start: Date; end: Date }

type QuickPickId =
  | "last_14"
  | "last_60"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "ytd"
  | "since_launch"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return startOfDay(next)
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isBefore(a: Date, b: Date) {
  return startOfDay(a).getTime() < startOfDay(b).getTime()
}

function isAfter(a: Date, b: Date) {
  return startOfDay(a).getTime() > startOfDay(b).getTime()
}

function inRange(day: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false
  const t = startOfDay(day).getTime()
  return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime()
}

function daysInclusive(start: Date, end: Date) {
  const ms = startOfDay(end).getTime() - startOfDay(start).getTime()
  return Math.max(1, Math.round(ms / 86400000) + 1)
}

function formatDisplay(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function monthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

function parseLooseDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return startOfDay(parsed)
}

function resolveQuickPick(id: QuickPickId, launchDate: Date | null): DateRangeValue {
  const today = startOfDay(new Date())
  if (id === "last_14") return { start: addDays(today, -13), end: today }
  if (id === "last_60") return { start: addDays(today, -59), end: today }
  if (id === "this_month") return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today }
  if (id === "last_month") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const end = new Date(today.getFullYear(), today.getMonth(), 0)
    return { start, end }
  }
  if (id === "this_quarter") {
    const q = Math.floor(today.getMonth() / 3) * 3
    return { start: new Date(today.getFullYear(), q, 1), end: today }
  }
  if (id === "ytd") return { start: new Date(today.getFullYear(), 0, 1), end: today }
  const launch = launchDate ? startOfDay(launchDate) : addDays(today, -365)
  return { start: launch, end: today }
}

const QUICK_PICKS: Array<{ id: QuickPickId; label: string }> = [
  { id: "last_14", label: "Last 14 days" },
  { id: "last_60", label: "Last 60 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "this_quarter", label: "This quarter" },
  { id: "ytd", label: "Year to date" },
  { id: "since_launch", label: "Since course launch" },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRange: DateRangeValue
  launchDate?: Date | null
  onApply: (range: DateRangeValue) => void
}

function AdminCustomDateRangeDialog({
  open,
  onOpenChange,
  initialRange,
  launchDate = null,
  onApply,
}: Props) {
  const [draftStart, setDraftStart] = useState<Date | null>(startOfDay(initialRange.start))
  const [draftEnd, setDraftEnd] = useState<Date | null>(startOfDay(initialRange.end))
  const [startText, setStartText] = useState(formatDisplay(initialRange.start))
  const [endText, setEndText] = useState(formatDisplay(initialRange.end))
  const [leftMonth, setLeftMonth] = useState(() => new Date(initialRange.start.getFullYear(), initialRange.start.getMonth(), 1))
  const [activeQuick, setActiveQuick] = useState<QuickPickId | null>(null)
  const [picking, setPicking] = useState<"start" | "end">("start")

  useEffect(() => {
    if (!open) return
    const start = startOfDay(initialRange.start)
    const end = startOfDay(initialRange.end)
    setDraftStart(start)
    setDraftEnd(end)
    setStartText(formatDisplay(start))
    setEndText(formatDisplay(end))
    setLeftMonth(new Date(start.getFullYear(), start.getMonth(), 1))
    setActiveQuick(null)
    setPicking("start")
  }, [open, initialRange.start, initialRange.end])

  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth])
  const selectedCount = draftStart && draftEnd ? daysInclusive(draftStart, draftEnd) : 0
  const canApply = Boolean(draftStart && draftEnd && !isAfter(draftStart, draftEnd))

  function applyQuick(id: QuickPickId) {
    const range = resolveQuickPick(id, launchDate)
    setActiveQuick(id)
    setDraftStart(range.start)
    setDraftEnd(range.end)
    setStartText(formatDisplay(range.start))
    setEndText(formatDisplay(range.end))
    setLeftMonth(new Date(range.start.getFullYear(), range.start.getMonth(), 1))
    setPicking("start")
  }

  function onDayClick(day: Date) {
    setActiveQuick(null)
    const clicked = startOfDay(day)
    if (picking === "start" || !draftStart || (draftStart && draftEnd)) {
      setDraftStart(clicked)
      setDraftEnd(null)
      setStartText(formatDisplay(clicked))
      setEndText("")
      setPicking("end")
      return
    }
    if (isBefore(clicked, draftStart)) {
      setDraftStart(clicked)
      setDraftEnd(draftStart)
      setStartText(formatDisplay(clicked))
      setEndText(formatDisplay(draftStart))
      setPicking("start")
      return
    }
    setDraftEnd(clicked)
    setEndText(formatDisplay(clicked))
    setPicking("start")
  }

  function commitStartText() {
    const parsed = parseLooseDate(startText)
    if (!parsed) {
      if (draftStart) setStartText(formatDisplay(draftStart))
      return
    }
    setDraftStart(parsed)
    setStartText(formatDisplay(parsed))
    setActiveQuick(null)
    if (draftEnd && isAfter(parsed, draftEnd)) {
      setDraftEnd(parsed)
      setEndText(formatDisplay(parsed))
    }
  }

  function commitEndText() {
    const parsed = parseLooseDate(endText)
    if (!parsed) {
      if (draftEnd) setEndText(formatDisplay(draftEnd))
      return
    }
    setDraftEnd(parsed)
    setEndText(formatDisplay(parsed))
    setActiveQuick(null)
    if (draftStart && isBefore(parsed, draftStart)) {
      setDraftStart(parsed)
      setStartText(formatDisplay(parsed))
    }
  }

  function handleApply() {
    if (!draftStart || !draftEnd || isAfter(draftStart, draftEnd)) return
    onApply({ start: draftStart, end: draftEnd })
    onOpenChange(false)
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-page max-w-[920px] gap-0 overflow-hidden border-[#dfe1e7] p-0 sm:max-w-[920px]">
        <div className="flex items-start justify-between border-b border-[#dfe1e7] px-6 py-5">
          <div>
            <DialogTitle className="text-[20px] font-semibold text-[#1a1b25]">Custom date range</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-[#666d80]">
              Every chart and number on the dashboard will use this range.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-lg p-1.5 text-[#666d80] hover:bg-[#f3f4f6]"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </DialogClose>
        </div>

        <div className="grid gap-0 md:grid-cols-[200px_1fr]">
          <aside className="border-b border-[#dfe1e7] bg-[#f9fafb] px-4 py-4 md:border-b-0 md:border-r">
            <p className="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#666d80]">
              Quick picks
            </p>
            <div className="space-y-1">
              {QUICK_PICKS.map((pick) => (
                <button
                  key={pick.id}
                  type="button"
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    activeQuick === pick.id
                      ? "bg-[#f3f7ff] font-medium text-[#0d47a1]"
                      : "text-[#364153] hover:bg-white"
                  }`}
                  onClick={() => applyQuick(pick.id)}
                >
                  {pick.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="px-5 py-4">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="min-w-[160px] flex-1 text-xs font-medium text-[#666d80]">
                Start date
                <input
                  className="mt-1 w-full rounded-lg border border-[#dfe1e7] px-3 py-2 text-sm text-[#1a1b25]"
                  value={startText}
                  onChange={(e) => setStartText(e.target.value)}
                  onBlur={commitStartText}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitStartText()
                  }}
                />
              </label>
              <ArrowRight className="mt-5 size-4 shrink-0 text-[#98a2b3]" />
              <label className="min-w-[160px] flex-1 text-xs font-medium text-[#666d80]">
                End date
                <input
                  className="mt-1 w-full rounded-lg border border-[#dfe1e7] px-3 py-2 text-sm text-[#1a1b25]"
                  value={endText}
                  onChange={(e) => setEndText(e.target.value)}
                  onBlur={commitEndText}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEndText()
                  }}
                />
              </label>
            </div>

            <div className="mb-3 flex items-center justify-end gap-1">
              <button
                type="button"
                className="rounded-lg p-1.5 text-[#364153] hover:bg-[#f3f4f6]"
                aria-label="Previous month"
                onClick={() => setLeftMonth((m) => addMonths(m, -1))}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                className="rounded-lg p-1.5 text-[#364153] hover:bg-[#f3f4f6]"
                aria-label="Next month"
                onClick={() => setLeftMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <MonthGrid
                month={leftMonth}
                start={draftStart}
                end={draftEnd}
                onDayClick={onDayClick}
              />
              <MonthGrid
                month={rightMonth}
                start={draftStart}
                end={draftEnd}
                onDayClick={onDayClick}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe1e7] px-6 py-4">
          <p className="text-sm text-[#1a1b25]">
            {canApply ? `${selectedCount} day${selectedCount === 1 ? "" : "s"} selected` : "Select a start and end date"}
          </p>
          <div className="flex items-center gap-2">
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-lg border border-[#dfe1e7] bg-white px-4 py-2 text-sm font-medium text-[#1a1b25] hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              className="rounded-lg bg-[#0d47a1] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={!canApply}
              onClick={handleApply}
            >
              Apply range
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}

function MonthGrid({
  month,
  start,
  end,
  onDayClick,
}: {
  month: Date
  start: Date | null
  end: Date | null
  onDayClick: (day: Date) => void
}) {
  const today = startOfDay(new Date())
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const out: Array<Date | null> = []
    for (let i = 0; i < startPad; i += 1) out.push(null)
    for (let day = 1; day <= daysInMonth; day += 1) {
      out.push(new Date(month.getFullYear(), month.getMonth(), day))
    }
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [month])

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[#1a1b25]">{monthLabel(month)}</p>
      <div className="mb-2 grid grid-cols-7 gap-y-1 text-center text-[11px] font-medium text-[#98a2b3]">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-9" />
          const isStart = sameDay(day, start)
          const isEnd = sameDay(day, end)
          const selectedEdge = isStart || isEnd
          const mid = inRange(day, start, end) && !selectedEdge
          const isToday = sameDay(day, today)
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={`relative flex h-9 items-center justify-center text-sm ${
                mid ? "bg-[#eff6ff] text-[#0d47a1]" : "text-[#1a1b25]"
              } ${start && end && mid && day.getDay() === 0 ? "rounded-l-full" : ""} ${
                start && end && mid && day.getDay() === 6 ? "rounded-r-full" : ""
              }`}
              onClick={() => onDayClick(day)}
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full ${
                  selectedEdge
                    ? "bg-[#0d47a1] font-semibold text-white"
                    : isToday
                      ? "border border-[#0d47a1] text-[#0d47a1]"
                      : ""
                }`}
              >
                {day.getDate()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { AdminCustomDateRangeDialog, startOfDay, addDays, daysInclusive }
