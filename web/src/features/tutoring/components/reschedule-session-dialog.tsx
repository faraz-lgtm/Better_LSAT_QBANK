import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Info, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import {
  AMELIA_DEFAULT_TIME_ZONE,
  formatAmeliaLocalDateTime,
  parseAmeliaSlots,
  type AmeliaSlotOption,
} from "@/features/tutoring/lib/parse-amelia-slots"
import type { TutoringSessionSummary } from "@/features/tutoring/lib/types"
import type { createTutoringApi } from "@/lib/api/tutoring"
import { cn } from "@/lib/utils"

type TutoringApi = ReturnType<typeof createTutoringApi>

type RescheduleSessionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: TutoringSessionSummary | null
  api: TutoringApi
  timeZone?: string
  onRescheduled: () => void | Promise<void>
}

type CalendarDay = {
  dateKey: string
  weekdayShort: string
  dayNumber: string
  available: boolean
  isCurrent: boolean
  isPast: boolean
}

const RESCHEDULE_REASON_OPTIONS = [
  { value: "schedule-conflict", label: "Schedule conflict" },
  { value: "feeling-unprepared", label: "Feeling unprepared" },
  { value: "personal-emergency", label: "Personal emergency" },
  { value: "prefer-different-time", label: "Prefer a different time" },
  { value: "other", label: "Other" },
]

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

function timeZoneDisplayLabel(timeZone: string): string {
  if (timeZone === "America/New_York") return "Eastern Time (ET)"
  return timeZone.replace(/_/g, " ")
}

function formatCurrentWhen(whenLabel: string): string {
  return whenLabel
    .replace(/\s·\s\d+\s*min$/i, "")
    .replace(/\s·\swith\s.+$/i, "")
    .trim()
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function localDateParts(
  timeZone: string,
  now = new Date(),
): { year: number; month: number; day: number; dateKey: string } {
  const dateKey = formatAmeliaLocalDateTime(now, timeZone).slice(0, 10)
  const [year, month, day] = dateKey.split("-").map(Number)
  return { year: year!, month: month!, day: day!, dateKey }
}

function monthLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1, 12))
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date)
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1, 12))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
}

function monthCompare(
  left: { year: number; month: number },
  right: { year: number; month: number },
): number {
  return left.year * 12 + left.month - (right.year * 12 + right.month)
}

/** Slot query covering the visible calendar month (from today if current month). */
function monthSlotsQueryRange(
  year: number,
  month: number,
  timeZone: string,
  now = new Date(),
): { startDateTime: string; endDateTime: string } {
  const today = localDateParts(timeZone, now)
  const lastDay = new Date(Date.UTC(year, month, 0, 12)).getUTCDate()
  const startDay =
    year === today.year && month === today.month ? today.day : 1
  return {
    startDateTime: `${year}-${pad2(month)}-${pad2(startDay)} 00:00`,
    endDateTime: `${year}-${pad2(month)}-${pad2(lastDay)} 23:59`,
  }
}

function sessionCurrentDateKey(
  session: TutoringSessionSummary,
  timeZone: string,
  now = new Date(),
): string | null {
  const monthIdx = MONTH_INDEX[session.month.trim().toLowerCase().slice(0, 3) ?? ""]
  const dayNum = Number(session.day)
  if (monthIdx == null || !Number.isFinite(dayNum)) return null
  const year = formatAmeliaLocalDateTime(now, timeZone).slice(0, 4)
  return `${year}-${pad2(monthIdx + 1)}-${pad2(dayNum)}`
}

/** Full calendar month (Sun–Sat aligned) for a specific year/month. */
function buildMonthCalendarDays(
  year: number,
  month: number,
  availableDateKeys: Set<string>,
  currentDateKey: string | null,
  timeZone: string,
  now = new Date(),
): Array<CalendarDay | null> {
  const { dateKey: todayKey } = localDateParts(timeZone, now)
  const lastDay = new Date(Date.UTC(year, month, 0, 12)).getUTCDate()
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay()
  const days: Array<CalendarDay | null> = Array.from({ length: firstWeekday }, () => null)

  for (let dayNum = 1; dayNum <= lastDay; dayNum += 1) {
    const date = new Date(Date.UTC(year, month - 1, dayNum, 12))
    const dateKey = date.toISOString().slice(0, 10)
    const isPast = dateKey < todayKey
    days.push({
      dateKey,
      weekdayShort: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      dayNumber: String(dayNum),
      available: !isPast && availableDateKeys.has(dateKey),
      isCurrent: currentDateKey === dateKey,
      isPast,
    })
  }

  return days
}

const MAX_MONTHS_AHEAD = 6

function RescheduleSessionDialog({
  open,
  onOpenChange,
  session,
  api,
  timeZone = AMELIA_DEFAULT_TIME_ZONE,
  onRescheduled,
}: RescheduleSessionDialogProps) {
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slots, setSlots] = useState<AmeliaSlotOption[]>([])
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [selectedBookingStart, setSelectedBookingStart] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [otherReason, setOtherReason] = useState("")
  const [viewYear, setViewYear] = useState(() => localDateParts(timeZone).year)
  const [viewMonth, setViewMonth] = useState(() => localDateParts(timeZone).month)

  const todayMonth = localDateParts(timeZone)
  const availableDateKeys = useMemo(
    () => new Set(slots.map((slot) => slot.dateKey)),
    [slots],
  )
  const currentDateKey = useMemo(
    () => (session ? sessionCurrentDateKey(session, timeZone) : null),
    [session, timeZone],
  )
  const calendarDays = useMemo(
    () =>
      buildMonthCalendarDays(
        viewYear,
        viewMonth,
        availableDateKeys,
        currentDateKey,
        timeZone,
      ),
    [viewYear, viewMonth, availableDateKeys, currentDateKey, timeZone],
  )
  const timesForDate = useMemo(
    () => (selectedDateKey ? slots.filter((slot) => slot.dateKey === selectedDateKey) : []),
    [slots, selectedDateKey],
  )
  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.bookingStart === selectedBookingStart) ?? null,
    [slots, selectedBookingStart],
  )
  const canConfirm = Boolean(selectedBookingStart && !submitting && !loadingSlots)
  const footerStatus = selectedSlot
    ? `${selectedSlot.dateLabel} · ${selectedSlot.timeLabel}`
    : selectedDateKey
      ? "Pick a time"
      : "Pick a day and time"
  const showOtherReason = reason === "other"
  const canGoPrev =
    monthCompare({ year: viewYear, month: viewMonth }, todayMonth) > 0
  const maxMonth = shiftMonth(todayMonth.year, todayMonth.month, MAX_MONTHS_AHEAD)
  const canGoNext =
    monthCompare({ year: viewYear, month: viewMonth }, maxMonth) < 0

  useEffect(() => {
    if (!open) return
    const current = localDateParts(timeZone)
    setViewYear(current.year)
    setViewMonth(current.month)
    setSelectedDateKey(null)
    setSelectedBookingStart(null)
    setReason("")
    setOtherReason("")
    setError(null)
  }, [open, session, timeZone])

  useEffect(() => {
    if (!open || !session) return

    let cancelled = false
    setLoadingSlots(true)
    setError(null)
    setSlots([])

    const range = monthSlotsQueryRange(viewYear, viewMonth, timeZone)
    void api
      .listSlots(range)
      .then((response) => {
        if (cancelled) return
        setSlots(parseAmeliaSlots(response))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Could not load available times")
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, session, api, timeZone, viewYear, viewMonth])

  function goToMonth(delta: number) {
    const next = shiftMonth(viewYear, viewMonth, delta)
    setViewYear(next.year)
    setViewMonth(next.month)
    setSelectedDateKey(null)
    setSelectedBookingStart(null)
  }

  async function handleConfirm() {
    if (!session || !selectedBookingStart) return
    setSubmitting(true)
    setError(null)
    try {
      await api.rescheduleBooking({
        sessionId: session.id,
        bookingStart: selectedBookingStart,
        timeZone,
      })
      await onRescheduled()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not reschedule this session")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          className="z-50 flex w-full max-w-[580px] flex-col gap-0 overflow-hidden rounded-[16px] border border-[#e4e9f2] bg-[var(--greyscale-0)] p-0 shadow-lg sm:max-w-[580px]"
          aria-describedby="tutoring-reschedule-desc"
        >
          <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-[#e4e9f2] px-[22px] py-[18px] text-left">
            <DialogTitle className="text-[18px] font-bold leading-[1.35] tracking-normal text-[var(--color-student-heading)]">
              Reschedule Session
            </DialogTitle>
            <DialogDescription id="tutoring-reschedule-desc" className="sr-only">
              {session
                ? `Pick a new time for ${session.title}. Your Zoom link will update after you confirm.`
                : "Pick a new time for your session."}
            </DialogDescription>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f3f6fb] text-[var(--greyscale-500)] hover:bg-[#e8eef7]"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            </DialogClose>
          </DialogHeader>

          <div className="flex max-h-[min(70vh,560px)] flex-col gap-[18px] overflow-y-auto px-[22px] py-5">
            {session ? (
              <div className="flex items-center gap-3 rounded-[14px] bg-[#f7f9fc] px-3.5 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dce7fa] text-xs font-bold text-[var(--primary)]">
                  {session.tutorInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-[0.02em] text-[var(--color-student-heading)]">
                    {session.title}
                  </p>
                  <p className="text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
                    Currently{" "}
                    <span className="font-bold text-[var(--color-student-heading)]">
                      {formatCurrentWhen(session.whenLabel)}
                    </span>
                    {session.tutorName ? ` · with ${session.tutorName}` : null}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-bold tracking-[0.02em] text-[var(--color-student-heading)]">
                  Pick a new day
                </p>
                <p className="text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
                  Times in {timeZoneDisplayLabel(timeZone)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label="Previous month"
                  disabled={!canGoPrev || loadingSlots}
                  onClick={() => goToMonth(-1)}
                  className="inline-flex size-9 items-center justify-center rounded-[10px] border border-[#d5deec] text-[var(--color-student-heading)] transition-colors hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <p className="text-sm font-semibold tracking-[0.02em] text-[var(--color-student-heading)]">
                  {monthLabel(viewYear, viewMonth)}
                </p>
                <button
                  type="button"
                  aria-label="Next month"
                  disabled={!canGoNext || loadingSlots}
                  onClick={() => goToMonth(1)}
                  className="inline-flex size-9 items-center justify-center rounded-[10px] border border-[#d5deec] text-[var(--color-student-heading)] transition-colors hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>

              {loadingSlots ? (
                <p className="text-sm text-[var(--greyscale-500)]">Loading available times…</p>
              ) : null}

              {!loadingSlots ? (
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAY_HEADERS.map((weekday) => (
                    <div
                      key={weekday}
                      className="py-1 text-center text-[10px] font-semibold tracking-[0.02em] text-[var(--greyscale-500)]"
                    >
                      {weekday}
                    </div>
                  ))}
                  {calendarDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="min-h-[52px]" aria-hidden />
                    }
                    const selected = day.dateKey === selectedDateKey
                    const disabled = !day.available
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        disabled={disabled}
                        aria-label={`${day.weekdayShort} ${day.dayNumber}`}
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedDateKey(day.dateKey)
                          setSelectedBookingStart(null)
                        }}
                        className={cn(
                          "flex min-h-[52px] flex-col items-center justify-center gap-px rounded-[10px] px-1.5 py-1 text-center transition-colors",
                          disabled &&
                            "cursor-not-allowed bg-[#f1f3f7] text-[var(--greyscale-500)]",
                          !disabled &&
                            !selected &&
                            !day.isCurrent &&
                            "border border-[#d5deec] bg-[var(--greyscale-0)] text-[var(--color-student-heading)] hover:border-[#9db3dc]",
                          !disabled &&
                            !selected &&
                            day.isCurrent &&
                            "border-2 border-dashed border-[#9db3dc] bg-[var(--greyscale-0)] text-[var(--color-student-heading)]",
                          selected &&
                            "border-2 border-[var(--primary)] bg-[var(--primary-25)] text-[var(--color-student-heading)]",
                        )}
                      >
                        <span className="text-base font-extrabold leading-none">{day.dayNumber}</span>
                      </button>
                    )
                  })}
                </div>
              ) : null}

              {!loadingSlots && availableDateKeys.size === 0 && !error ? (
                <p className="text-sm text-[var(--greyscale-500)]">
                  No open times this month. Try again later or contact support.
                </p>
              ) : null}
            </div>

            {timesForDate.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold tracking-[0.02em] text-[var(--color-student-heading)]">
                  Pick a time
                </p>
                <div className="flex flex-wrap gap-2">
                  {timesForDate.map((slot) => {
                    const selected = slot.bookingStart === selectedBookingStart
                    return (
                      <button
                        key={slot.bookingStart}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedBookingStart(slot.bookingStart)}
                        className={cn(
                          "inline-flex h-9 items-center justify-center rounded-[10px] border px-3 text-xs font-bold tracking-[0.02em] transition-colors",
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-[#d5deec] bg-[var(--greyscale-0)] text-[var(--primary)] hover:border-[#9db3dc]",
                        )}
                      >
                        {slot.timeLabel}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reschedule-reason"
                className="text-xs font-bold tracking-[0.02em] text-[var(--color-student-heading)]"
              >
                Reason{" "}
                <span className="font-normal text-[var(--greyscale-500)]">
                  (optional, shared with your tutor)
                </span>
              </label>
              <Select
                id="reschedule-reason"
                value={reason}
                onChange={(event) => {
                  const next = event.target.value
                  setReason(next)
                  if (next !== "other") setOtherReason("")
                }}
                options={RESCHEDULE_REASON_OPTIONS}
                placeholder=""
                disabled={submitting}
                className="h-11 rounded-[10px] border-[#d5deec] bg-[var(--greyscale-0)] shadow-none"
              />
              {showOtherReason ? (
                <input
                  id="reschedule-reason-other"
                  type="text"
                  value={otherReason}
                  onChange={(event) => setOtherReason(event.target.value)}
                  placeholder="Tell us more…"
                  disabled={submitting}
                  className="h-11 w-full rounded-[10px] border border-[#d5deec] bg-[var(--greyscale-0)] px-3 text-sm tracking-[0.02em] text-[var(--color-student-heading)] outline-none placeholder:text-[rgba(14,42,92,0.5)] focus:border-[var(--primary)]"
                />
              ) : null}
            </div>

            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--greyscale-500)]" aria-hidden />
              <p className="text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
                Free rescheduling up to 24 hours before your session. Your tutor gets an updated
                calendar invite.
              </p>
            </div>

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#e4e9f2] px-[22px] py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs tracking-[0.02em] text-[var(--greyscale-500)]">{footerStatus}</p>
            <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 min-h-11 rounded-[10px] border-[#d5deec] px-[18px] text-xs font-bold tracking-[0.02em] text-[var(--primary)]"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
              >
                Keep Current Time
              </Button>
              <Button
                type="button"
                className={cn(
                  "h-11 min-h-11 rounded-[10px] px-5 text-xs font-bold tracking-[0.02em]",
                  canConfirm
                    ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                    : "bg-[#d5deec] text-[var(--greyscale-500)] hover:bg-[#d5deec]",
                )}
                disabled={!canConfirm}
                onClick={() => void handleConfirm()}
              >
                {submitting ? "Saving…" : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </DialogRoot>
  )
}

export { RescheduleSessionDialog }
