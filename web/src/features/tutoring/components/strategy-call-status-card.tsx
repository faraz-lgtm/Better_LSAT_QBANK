import { Button } from "@/components/ui/button"
import type { FreeStrategyCallDto } from "@/lib/api/tutoring"

type IconName = "status" | "calendar" | "clock" | "globe" | "video" | "user"

type DetailItem = {
  label: string
  value: string
  icon: IconName
}

type StrategyCallStatusCardProps = {
  session: FreeStrategyCallDto
  onReschedule?: () => void
  onJoin?: () => void
}

const stroke = {
  stroke: "#0E47A1",
  strokeWidth: 1.275,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
}

function DetailIcon({ name }: { name: IconName }) {
  return (
    <svg
      className="size-[18px]"
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {name === "status" ? (
        <path d="M3.75 9.375L7.125 12.75L14.25 5.625" {...stroke} />
      ) : null}
      {name === "calendar" ? (
        <>
          <path
            d="M4.875 3.75H13.125C14.1605 3.75 15 4.58947 15 5.625V13.125C15 14.1605 14.1605 15 13.125 15H4.875C3.83947 15 3 14.1605 3 13.125V5.625C3 4.58947 3.83947 3.75 4.875 3.75Z"
            {...stroke}
          />
          <path d="M3 7.5H15M6.375 2.25V5.25M11.625 2.25V5.25" {...stroke} />
        </>
      ) : null}
      {name === "clock" ? (
        <>
          <path
            d="M15.375 9C15.375 12.5208 12.5208 15.375 9 15.375C5.47918 15.375 2.625 12.5208 2.625 9C2.625 5.47918 5.47918 2.625 9 2.625C12.5208 2.625 15.375 5.47918 15.375 9Z"
            {...stroke}
          />
          <path d="M9 5.625V9L11.25 10.5" {...stroke} />
        </>
      ) : null}
      {name === "globe" ? (
        <>
          <path
            d="M15.375 9C15.375 12.5208 12.5208 15.375 9 15.375C5.47918 15.375 2.625 12.5208 2.625 9C2.625 5.47918 5.47918 2.625 9 2.625C12.5208 2.625 15.375 5.47918 15.375 9Z"
            {...stroke}
          />
          <path
            d="M2.625 9H15.375M9 2.625C11.25 4.875 11.25 13.125 9 15.375C6.75 13.125 6.75 4.875 9 2.625Z"
            {...stroke}
          />
        </>
      ) : null}
      {name === "video" ? (
        <>
          <path
            d="M4.5 4.875H9.75C10.7855 4.875 11.625 5.71447 11.625 6.75V11.25C11.625 12.2855 10.7855 13.125 9.75 13.125H4.5C3.46447 13.125 2.625 12.2855 2.625 11.25V6.75C2.625 5.71447 3.46447 4.875 4.5 4.875Z"
            {...stroke}
          />
          <path d="M11.625 7.875L15.375 5.625V12.375L11.625 10.125V7.875Z" {...stroke} />
        </>
      ) : null}
      {name === "user" ? (
        <>
          <path
            d="M11.625 6.375C11.625 7.82475 10.4497 9 9 9C7.55025 9 6.375 7.82475 6.375 6.375C6.375 4.92525 7.55025 3.75 9 3.75C10.4497 3.75 11.625 4.92525 11.625 6.375Z"
            {...stroke}
          />
          <path
            d="M3.75 15C3.75 13.6076 4.30312 12.2723 5.28769 11.2877C6.27226 10.3031 7.60761 9.75 9 9.75C10.3924 9.75 11.7277 10.3031 12.7123 11.2877C13.6969 12.2723 14.25 13.6076 14.25 15"
            {...stroke}
          />
        </>
      ) : null}
    </svg>
  )
}

function Detail({ label, value, icon }: DetailItem) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-[#e1e8f3] bg-[var(--greyscale-0)]">
        <DetailIcon name={icon} />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs leading-[15.6px] text-[#55657f]">{label}</p>
        <p className="text-[15px] font-semibold leading-[19.5px] text-[var(--color-student-heading)]">
          {value}
        </p>
      </div>
    </div>
  )
}

function StrategyCallStatusCard({ session, onReschedule, onJoin }: StrategyCallStatusCardProps) {
  const completed = session.isCompleted
  const tutorLabel = `${session.tutorName}, 175+ scorer`

  const bookedDetails: DetailItem[] = [
    { label: "Date", value: session.dateLabel, icon: "calendar" },
    { label: "Time", value: session.timeLabel, icon: "clock" },
    { label: "Time zone", value: session.timezoneLabel, icon: "globe" },
    { label: "Where", value: "Zoom", icon: "video" },
    { label: "With", value: tutorLabel, icon: "user" },
  ]

  const completedDetails: DetailItem[] = [
    { label: "Status", value: "Completed", icon: "status" },
    { label: "Date", value: session.dateLabel, icon: "calendar" },
    { label: "Time", value: session.timeLabel, icon: "clock" },
    { label: "With", value: tutorLabel, icon: "user" },
  ]

  const details = completed ? completedDetails : bookedDetails
  const email = session.customerEmail?.trim()

  return (
    <section
      className="w-full rounded-[20px] border border-[#dbe5f3] bg-[var(--greyscale-0)] p-[30px]"
      data-testid="strategy-call-status-card"
      data-completed={completed ? "true" : "false"}
    >
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex h-[34px] items-center rounded-[14px] bg-[#ddf3e7] px-4 text-xs font-bold tracking-[0.02em] text-[#0b6b3a]">
          {completed ? "✓ Call completed" : "✓ Call confirmed"}
        </span>
        <span className="inline-flex h-[34px] items-center rounded-[14px] bg-[var(--primary-0)] px-4 text-xs font-semibold tracking-[0.02em] text-[#0e47a1]">
          {completed ? "Free call used" : "Your 1 free call"}
        </span>
      </div>

      <h2 className="py-3 text-[20px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
        {completed
          ? "You've already had your free strategy call."
          : "Your free strategy call is booked."}
      </h2>
      <p className="max-w-[1014px] text-sm leading-normal tracking-[0.02em] text-[#55657f]">
        {completed
          ? "The free strategy call is one per student, so there isn't another one to book here."
          : email
            ? `We sent the Zoom link and a calendar invite to ${email}.`
            : "We sent the Zoom link and a calendar invite to your email."}
      </p>

      <div className="pt-6">
        <div className="rounded-2xl border border-[var(--primary-25)] p-6">
          <div className="grid grid-cols-1 gap-5 rounded-xl border border-[#e1e8f3] bg-[#f6f9fe] p-5 sm:grid-cols-2 lg:grid-cols-3">
            {details.map((item) => (
              <Detail key={item.label} {...item} />
            ))}
          </div>

          {!completed ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-5">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 rounded-[10px] px-4"
                onClick={onReschedule}
              >
                Reschedule
              </Button>
              <Button
                type="button"
                size="lg"
                className="h-12 rounded-[10px] px-4"
                disabled={!session.joinUrl}
                onClick={onJoin}
              >
                Join Session
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export { StrategyCallStatusCard }
