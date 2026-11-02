import { useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Globe2, GraduationCap, AlignLeft } from "lucide-react"

import { cn } from "@/lib/utils"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const TIME_SLOTS = ["08:00 PM", "08:15 PM", "08:30 PM", "08:45 PM"] as const
const AVAILABLE_DAYS = new Set([2, 3, 4, 5, 6, 7])

function StrategyCallScheduler() {
  const [selectedDay, setSelectedDay] = useState(2)
  const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS[0])
  const [showMore, setShowMore] = useState(false)

  const calendarCells = useMemo(() => {
    // November 2026 starts on Sunday
    return Array.from({ length: 35 }, (_, index) => {
      const day = index + 1
      return day <= 30 ? day : null
    })
  }, [])

  return (
    <section className="rounded-[20px] border border-[#dbe5f3] bg-[var(--greyscale-0)] p-[30px]">
      <div className="flex items-center gap-3">
        <div className="flex size-[46px] items-center justify-center rounded-[12px] bg-[var(--primary-25)] text-[var(--primary)]">
          <GraduationCap className="size-6" aria-hidden />
        </div>
        <h2 className="text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
          FREE LSAT Strategy Call
        </h2>
      </div>

      <div className="mt-[18px] flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 rounded-[14px] border border-[#dbe5f3] bg-[#f6f9fe] px-[18px] py-4">
          <ul className="space-y-3 text-sm text-[#5a718f]">
            <li className="flex items-start gap-2.5">
              <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="font-medium">15 min</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="font-medium">Mon, Nov 2, 2026</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Globe2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="font-medium">Asia/Karachi (GMT+5)</span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlignLeft className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="text-[13.5px] leading-5">
                  {showMore
                    ? "This 15-minute 1-on-1 Zoom session is your first step toward crushing the LSAT and getting into your dream law school. We'll map your score goals, timeline, and the tutoring package that fits."
                    : "This 15-minute 1-on-1 Zoom session is your first step toward crushing the LSAT and getting into your dream law school with …"}
                </p>
                <button
                  type="button"
                  className="mt-1 text-[13.5px] font-medium text-[var(--primary)] hover:underline"
                  onClick={() => setShowMore((value) => !value)}
                >
                  {showMore ? "Show less" : "Show more"}
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div className="w-full lg:max-w-[503px]">
          <p className="text-base font-bold text-[var(--color-student-heading)]">Select Date &amp; Time</p>
          <div className="mt-3.5 flex flex-col gap-4 sm:flex-row">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-center gap-3.5">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-2xl bg-[var(--primary-25)] opacity-55"
                  aria-label="Previous month"
                  disabled
                >
                  <ChevronLeft className="size-4 text-[var(--primary)]" />
                </button>
                <p className="min-w-[132px] text-center text-[15px] font-bold text-[#0e3a6e]">November 2026</p>
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-2xl bg-[var(--primary-25)]"
                  aria-label="Next month"
                  disabled
                >
                  <ChevronRight className="size-4 text-[var(--primary)]" />
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="pb-2 text-center text-[12.5px] text-[var(--greyscale-500)]">
                    {day}
                  </div>
                ))}
                {calendarCells.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} />
                  }
                  const available = AVAILABLE_DAYS.has(day)
                  const selected = selectedDay === day
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={!available}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "flex h-9 items-center justify-center rounded-[18px] text-sm",
                        selected && "bg-[var(--primary)] font-semibold text-white",
                        !selected && available && "bg-[var(--primary-25)] font-semibold text-[var(--primary)]",
                        !available && "font-medium text-[var(--greyscale-500)]",
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-[190px]">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={cn(
                    "h-11 rounded-[10px] border text-sm font-semibold tracking-[0.02em]",
                    selectedTime === slot
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[#d5deec] bg-[var(--greyscale-0)] text-[var(--primary)] hover:border-[var(--primary)]",
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 rounded-[10px] border border-[#d5deec] px-3 py-2.5">
            <Globe2 className="size-4 shrink-0 text-[var(--greyscale-500)]" aria-hidden />
            <select
              className="w-full bg-transparent text-sm font-medium text-[var(--color-student-heading)] outline-none"
              defaultValue="Asia/Karachi"
              aria-label="Time zone"
            >
              <option value="Asia/Karachi">GMT+05:00 Asia/Karachi (GMT+5)</option>
              <option value="America/New_York">GMT-05:00 America/New_York (ET)</option>
              <option value="America/Los_Angeles">GMT-08:00 America/Los_Angeles (PT)</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}

export { StrategyCallScheduler }

