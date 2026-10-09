import { useState } from "react"
import { Calendar, ChevronRight, Lock } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { DashboardWelcomeHeading } from "@/features/dashboard/components/dashboard-welcome-heading"
import {
  formatDiagnosticDateLabel,
  listDiagnosticHistory,
  type GuestDiagnosticResult,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import {
  diagnosticAttemptHref,
  diagnosticResultsSectionFromIntent,
} from "@/features/student/diagnostic/diagnostic-results-routes"
import { cn } from "@/lib/utils"

const FREE_START_FULL_HREF = "/diagnostic/start?intent=quick"
const FREE_START_MINI_HREF = "/diagnostic/start?intent=mini"

const LOCKED_STAT_CARDS = [
  {
    id: "study-time",
    label: "Total Study Time",
    value: "142h",
    caption: "Needs improvement",
    iconSrc: "/dashboard/stat-study.svg",
  },
  {
    id: "avg-time",
    label: "Avg Time / Q",
    value: "0:04",
    caption: "Per question",
    iconSrc: "/dashboard/stat-avg-time.svg",
  },
  {
    id: "questions-done",
    label: "Questions Done",
    value: "271",
    caption: "+14 this week",
    iconSrc: "/dashboard/stat-questions.svg",
  },
  {
    id: "overall-accuracy",
    label: "Overall Accuracy",
    value: "9%",
    caption: "Needs improvement",
    iconSrc: "/dashboard/stat-accuracy.svg",
  },
] as const

const LOCKED_PERFORMANCE_METRICS = [
  { id: "avg-score", label: "Avg Score", value: "169" },
  { id: "percentile", label: "Percentile", value: "98th" },
  {
    id: "avg-lr",
    label: "Average LR",
    value: "-11",
    valueClassName: "text-[var(--explanation-answered)]",
  },
  {
    id: "avg-rc",
    label: "Average RC",
    value: "-12",
    valueClassName: "text-[var(--explanation-teal)]",
  },
  { id: "questions-drilled", label: "Questions Drilled", value: "740" },
  { id: "drilled-accuracy", label: "Drilled Accuracy", value: "64%" },
] as const

type HistoryFilter = "all" | "full" | "mini"

type FreePlanDashboardProps = {
  firstName: string
}

function formatHistoryDateLabel(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return formatDiagnosticDateLabel(isoDate) || "—"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatHistoryTitle(attempt: GuestDiagnosticResult): string {
  const n = attempt.diagnosticNumber
  if (attempt.intentId === "mini") return `Mini diagnostic #${n}`
  return `Full section diagnostic #${n}`
}

function historyKindBadge(attempt: GuestDiagnosticResult): string {
  return attempt.intentId === "mini" ? "Mini" : "Full section"
}

function FreePlanUpgradeBanner() {
  const { openPricingModal } = useGuestPricingModal()

  return (
    <section className="flex w-full flex-col gap-[18px] rounded-[20px] border border-[var(--primary)] bg-[var(--greyscale-0)] px-[22px] py-[18px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] sm:flex-row sm:items-center">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#e8f0fc]">
        <Lock className="size-5 text-[var(--primary)]" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold leading-6 text-[#0a2551]">Unlock full practice and analytics</p>
        <p className="text-base leading-[1.5] tracking-[0.32px] text-[#4f5868]">
          Core and Live plans include practice sets, analytics, and LawHub PrepPlus linking.
        </p>
        <p className="pt-0.5 text-sm leading-[1.5] tracking-[0.28px] text-[#697386]">
          The LawHub fee is paid to LSAC separately. One PrepPlus subscription works across prep platforms.
        </p>
      </div>
      <Button
        type="button"
        className="h-10 shrink-0 rounded-[14px] border border-[var(--primary-border)] px-4 text-sm font-semibold tracking-[0.28px] shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
        onClick={openPricingModal}
      >
        Compare Plans
      </Button>
    </section>
  )
}

function FreePlanDiagnosticStartCards() {
  return (
    <section className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="m-0 text-lg font-bold leading-[1.35] text-[#082c6b]">Start a diagnostic</h2>
        <p className="m-0 text-sm leading-[1.5] tracking-[0.28px] text-[#4f5868]">
          Both are free. Pick the length that fits your schedule.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,618fr)_minmax(0,538fr)]">
        <article className="flex min-h-[237px] flex-col rounded-[20px] border-2 border-[var(--primary)] bg-[var(--greyscale-0)] px-[21px] pb-[19px] pt-[21px]">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--primary)] px-[10px] py-[3px] text-xs font-bold leading-[18px] text-white">
              Recommended
            </span>
            <span className="rounded-full bg-[#f5f7fa] px-[10px] py-[3px] text-xs font-bold leading-[18px] text-[#4f5868]">
              Full section
            </span>
          </div>
          <h3 className="m-0 text-lg font-semibold leading-[1.4] tracking-[0.36px] text-[#0a2551]">
            Deeper performance view
          </h3>
          <p className="mt-1 text-base leading-[1.5] tracking-[0.32px] text-[#4f5868]">
            Get a fuller breakdown of the areas costing you points.
          </p>
          <div className="mt-[18px] flex flex-wrap items-center gap-[18px] text-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-bold leading-[21px] text-[#0a2551]">25</span>
              <span className="tracking-[0.28px] text-[#4f5868]">questions</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-bold leading-[21px] text-[#0a2551]">~35</span>
              <span className="text-[#4f5868]">min</span>
            </span>
            <span className="tracking-[0.28px] text-[#4f5868]">Detailed breakdown</span>
          </div>
          <div className="mt-auto flex justify-end pt-5">
            <Link
              to={FREE_START_FULL_HREF}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[var(--primary)] px-[18px] text-[15px] font-bold leading-[22.5px] text-white hover:bg-[var(--primary-600)]"
            >
              Start full section
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </article>

        <article className="flex min-h-[237px] flex-col rounded-[20px] border border-[#e1e7f0] bg-[var(--greyscale-0)] px-[22px] pb-5 pt-[22px]">
          <div className="mb-2.5 flex items-center">
            <span className="rounded-full bg-[#f5f7fa] px-[10px] py-[3px] text-xs font-bold leading-[18px] text-[#4f5868]">
              Mini
            </span>
          </div>
          <h3 className="m-0 text-lg font-semibold leading-[1.4] tracking-[0.36px] text-[#0a2551]">
            Quick baseline
          </h3>
          <p className="mt-1 text-base leading-[1.5] tracking-[0.32px] text-[#4f5868]">
            See your weakest areas without committing to a full section.
          </p>
          <div className="mt-[18px] flex flex-wrap items-center gap-[18px] text-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-bold leading-[21px] text-[#0a2551]">10</span>
              <span className="tracking-[0.28px] text-[#4f5868]">questions</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-bold leading-[21px] text-[#0a2551]">~13</span>
              <span className="text-[#4f5868]">min</span>
            </span>
            <span className="tracking-[0.28px] text-[#4f5868]">Quick topic flags</span>
          </div>
          <div className="mt-auto flex justify-end pt-5">
            <Link
              to={FREE_START_MINI_HREF}
              className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[var(--greyscale-25)] px-[18px] text-[15px] font-bold leading-[22.5px] text-[var(--primary)] hover:bg-[var(--greyscale-50)]"
            >
              Start mini
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}

function FreePlanLockedQuickStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {LOCKED_STAT_CARDS.map((card) => (
        <article
          key={card.id}
          className="flex min-h-[120px] flex-col justify-center rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[25px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{card.label}</p>
            <span className="size-3.5 shrink-0 overflow-hidden">
              <img src={card.iconSrc} alt="" className="size-full" width={14} height={14} />
            </span>
          </div>
          <p className="mt-[7.5px] blur-[7px] text-2xl font-bold leading-[1.3] text-[var(--primary-800,#041a44)] select-none">
            {card.value}
          </p>
          <p className="mt-[3.75px] text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{card.caption}</p>
        </article>
      ))}
    </div>
  )
}

function FreePlanLockedPerformanceOverview() {
  return (
    <section className="w-full rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[25px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-semibold tracking-[0.36px] text-[var(--primary-800,#041a44)]">
          Performance Overview
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <p className="m-0 text-[11px] font-medium leading-[16.5px] text-[var(--primary)]">
            These score are predictive and differ for every student
          </p>
          <span className="rounded-full bg-[#dbeafe] px-[9.375px] py-[3.75px] text-[11px] font-medium leading-[16.5px] text-[var(--primary)]">
            Across 50 practice tests
          </span>
        </div>
      </div>

      <div className="mt-[18.75px] grid grid-cols-2 gap-px overflow-hidden rounded-none bg-[var(--greyscale-100)] sm:grid-cols-3 xl:grid-cols-6">
        {LOCKED_PERFORMANCE_METRICS.map((metric) => (
          <div key={metric.id} className="flex min-w-0 flex-col gap-1.5 bg-[var(--greyscale-0)] p-4">
            <p className="m-0 text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{metric.label}</p>
            <p
              className={cn(
                "m-0 blur-[7px] text-2xl font-bold leading-[1.3] text-[var(--primary-800,#041a44)] select-none",
                "valueClassName" in metric ? metric.valueClassName : undefined,
              )}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FreePlanDiagnosticHistoryRow({ attempt }: { attempt: GuestDiagnosticResult }) {
  const href = diagnosticAttemptHref(attempt.intentId, attempt.id)

  return (
    <Link
      to={href}
      className="flex min-h-16 flex-col gap-3 rounded-[14px] px-4 py-3.5 transition-colors hover:bg-[var(--greyscale-25)] sm:flex-row sm:items-center sm:justify-between sm:gap-5"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 text-base font-bold leading-6 text-[#0a2551]">{formatHistoryTitle(attempt)}</p>
        <div className="mt-0.5 flex items-center gap-2 text-sm tracking-[0.28px] text-[#4f5868]">
          <Calendar className="size-3.5 shrink-0" aria-hidden />
          <time dateTime={attempt.completedAt}>{formatHistoryDateLabel(attempt.completedAt)}</time>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <span className="inline-flex h-6 items-center rounded-full bg-[#f5f7fa] px-[10px] py-[3px] text-xs font-bold tracking-[0.24px] text-[#4f5868]">
          {historyKindBadge(attempt)}
        </span>
        <div className="min-w-[88px] text-right">
          <p className="m-0 text-base font-semibold tracking-[0.32px] text-[#0a2551]">
            {attempt.scaledScoreLabel}
          </p>
          <p className="m-0 text-sm tracking-[0.28px] text-[#4f5868]">
            {attempt.correctCount} of {attempt.questionCount} correct
          </p>
        </div>
        <ChevronRight className="size-[18px] shrink-0 text-[#4f5868]" aria-hidden />
      </div>
    </Link>
  )
}

function FreePlanDiagnosticHistory() {
  const [filter, setFilter] = useState<HistoryFilter>("all")
  const allAttempts = listDiagnosticHistory()
  const attempts =
    filter === "all"
      ? allAttempts
      : allAttempts.filter((attempt) => diagnosticResultsSectionFromIntent(attempt.intentId) === filter)

  const tabs: { id: HistoryFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "full", label: "Full section" },
    { id: "mini", label: "Mini" },
  ]

  return (
    <section className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="m-0 text-lg font-bold leading-[1.35] text-[#082c6b]">Diagnostic history</h2>
        <div
          className="inline-flex w-fit gap-1 rounded-[14px] bg-[#f5f7fa] p-1"
          role="tablist"
          aria-label="Filter diagnostics"
        >
          {tabs.map((tab) => {
            const active = filter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(
                  "min-h-9 rounded-[9px] px-3.5 text-sm font-semibold tracking-[0.28px]",
                  active ? "bg-[var(--greyscale-0)] text-[#0a2551]" : "bg-transparent text-[#4f5868]",
                )}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-[#e1e7f0] bg-[var(--greyscale-0)] p-2">
        {attempts.length === 0 ? (
          <p className="m-0 rounded-[14px] px-4 py-8 text-center text-sm text-[#4f5868]">
            No diagnostics yet. Start a Mini or Full section diagnostic above — both are free.
          </p>
        ) : (
          <div className="flex flex-col">
            {attempts.map((attempt) => (
              <FreePlanDiagnosticHistoryRow key={attempt.id} attempt={attempt} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function FreePlanDashboard({ firstName }: FreePlanDashboardProps) {
  return (
    <div className="dashboard-page free-plan-dashboard flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <DashboardWelcomeHeading firstName={firstName} />
        <p className="m-0 text-base leading-[1.5] tracking-[0.32px] text-[#4f5868]">
          Take a free diagnostic to see which question types are costing you the most points.
        </p>
      </div>

      <FreePlanUpgradeBanner />
      <FreePlanDiagnosticStartCards />
      <FreePlanLockedQuickStats />
      <FreePlanLockedPerformanceOverview />
      <FreePlanDiagnosticHistory />
    </div>
  )
}

export { FreePlanDashboard, FREE_START_FULL_HREF, FREE_START_MINI_HREF }
