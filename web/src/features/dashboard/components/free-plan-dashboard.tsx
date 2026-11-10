import { useState } from "react"
import { Calendar, Check, ChevronRight, Clock, Lock, MessageCircle } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  STUDENT_FREE_STRATEGY_CALL_HREF,
  STUDENT_TUTORING_BOOK_HREF,
} from "@/features/app-shell/student-nav-config"
import { DashboardWelcomeHeading } from "@/features/dashboard/components/dashboard-welcome-heading"
import {
  formatDiagnosticDateLabel,
  listDiagnosticHistory,
  type GuestDiagnosticResult,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { PREP_COURSE_ESSENTIALS_SLUG } from "@/features/prep-course/lib/prep-course-nav"
import {
  diagnosticAttemptHref,
  diagnosticResultsSectionFromIntent,
} from "@/features/student/diagnostic/diagnostic-results-routes"
import { cn } from "@/lib/utils"

const FREE_START_FULL_HREF = "/diagnostic/start?intent=quick"
const FREE_START_MINI_HREF = "/diagnostic/start?intent=mini"
const PREP_COURSE_HREF = `/app/prep-course/${PREP_COURSE_ESSENTIALS_SLUG}`

const LOCKED_STAT_CARDS = [
  { id: "study-time", label: "Total Study Time", skeletonWidthClass: "w-11" },
  { id: "avg-time", label: "Avg Time / Q", skeletonWidthClass: "w-11" },
  { id: "questions-done", label: "Questions Done", skeletonWidthClass: "w-11" },
  { id: "overall-accuracy", label: "Overall Accuracy", skeletonWidthClass: "w-11" },
] as const

const LOCKED_PERFORMANCE_METRICS = [
  { id: "avg-score", label: "Avg Score", skeletonWidthClass: "w-10" },
  { id: "percentile", label: "Percentile", skeletonWidthClass: "w-10" },
  { id: "avg-lr", label: "Average LR", skeletonWidthClass: "w-10" },
  { id: "avg-rc", label: "Average RC", skeletonWidthClass: "w-10" },
  { id: "questions-drilled", label: "Questions Drilled", skeletonWidthClass: "w-10" },
  { id: "drilled-accuracy", label: "Drilled Accuracy", skeletonWidthClass: "w-10" },
] as const

const CONTINUE_LEARNING_MODULES = [
  { id: "kickoff", title: "The Kickoff", kind: "progress" as const, lessonsDone: 0, lessonsTotal: 8 },
  {
    id: "anatomy",
    title: "The Anatomy of an Argument",
    kind: "progress" as const,
    lessonsDone: 0,
    lessonsTotal: 25,
  },
  { id: "language", title: "The LSAT Language", kind: "locked" as const, lessonsTotal: 24 },
  { id: "diagramming", title: "Diagramming Mastery", kind: "locked" as const, lessonsTotal: 42 },
  {
    id: "informal",
    title: "The Land of Informal Logic",
    kind: "locked" as const,
    lessonsTotal: 23,
  },
] as const

type HistoryFilter = "all" | "full" | "mini"

type FreePlanDashboardProps = {
  firstName: string
}

/** Empty gray bar — no metric text in the DOM (real or fake). Matches Figma free-dashboard placeholders. */
function FreePlanMetricPlaceholder({
  widthClass,
  heightClass = "h-[18px]",
  className,
}: {
  widthClass: string
  heightClass?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "select-none rounded-lg bg-[#edf0f5]",
        heightClass,
        widthClass,
        className,
      )}
      aria-hidden
      data-testid="locked-metric-skeleton"
    />
  )
}

function CourseProgressRing({
  value,
  size,
}: {
  value: number
  size: "lg" | "sm"
}) {
  const pct = Math.max(0, Math.min(100, value))
  const angle = (pct / 100) * 360
  const dim = size === "lg" ? "size-[72px]" : "size-[30px]"
  const inset = size === "lg" ? "inset-[5px]" : "inset-[3px]"
  const text = size === "lg" ? "text-sm" : "text-[8px]"

  return (
    <div className={cn("relative flex shrink-0 items-center justify-center rounded-full", dim)} aria-hidden>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(var(--primary) ${angle}deg, var(--greyscale-100) ${angle}deg)`,
        }}
      />
      <div className={cn("absolute rounded-full bg-[var(--greyscale-0)]", inset)} />
      <span
        className={cn(
          "relative font-bold leading-none tracking-[0.02em] text-[var(--color-student-heading)]",
          text,
        )}
      >
        {pct}%
      </span>
    </div>
  )
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
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--primary-25)]">
        <Lock className="size-5 text-[var(--primary)]" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-[1.35] text-[var(--color-student-heading)]">
          Unlock full practice and analytics
        </p>
        <p className="text-sm leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
          Choose the access period that fits your prep timeline. Your tools stay the same.
        </p>
        <p className="pt-0.5 text-sm leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
          The LawHub fee is paid to LSAC separately. One PrepPlus subscription works across prep
          platforms.
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

function FreePlanTutoringBanner() {
  const { openPricingModal } = useGuestPricingModal()

  return (
    <section
      className="flex w-full flex-col gap-4 rounded-2xl border border-[var(--greyscale-100)] p-[26px] sm:flex-row sm:items-stretch sm:justify-between"
      style={{
        backgroundImage: "linear-gradient(176deg, #ffffff 41.7%, #eef3fb 91.5%)",
      }}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#e3ecfb]">
          <Calendar className="size-6 text-[var(--primary)]" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-xs font-bold tracking-[0.72px] text-[#1e4fa8]">TUTORING</p>
          <h2 className="m-0 mt-1.5 text-[22px] font-extrabold leading-tight text-[#0e2a5c]">
            You haven&apos;t booked a session yet
          </h2>
          <p className="m-0 mt-1.5 max-w-xl text-sm leading-[22.4px] text-[#4a5b78]">
            Work 1-on-1 with an LSAT expert on the question types costing you the most points, or
            join a live group session to see how other students are prepping.
          </p>
          <ul className="m-0 mt-2 list-none space-y-2 p-0">
            <li className="flex items-center gap-2 text-[13px] text-[#0e2a5c]">
              <Check className="size-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} aria-hidden />
              Packages from $149, never expire
            </li>
            <li className="flex items-center gap-2 text-[13px] text-[#0e2a5c]">
              <Check className="size-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} aria-hidden />
              Transcript and takeaways after every session
            </li>
          </ul>
        </div>
      </div>
      <div className="flex shrink-0 flex-col justify-end sm:items-end">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Button
            asChild
            variant="outline"
            className="h-[46px] rounded-[14px] border-[var(--greyscale-100)] px-4 text-sm font-semibold tracking-[0.28px] text-[var(--primary)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] hover:text-white"
          >
            <Link to={STUDENT_FREE_STRATEGY_CALL_HREF}>Book My Free Strategy Call</Link>
          </Button>
          <Button
            type="button"
            className="h-[46px] rounded-[14px] border border-[var(--primary-border)] px-4 text-sm font-semibold tracking-[0.28px] shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
            onClick={openPricingModal}
          >
            Compare Plans
          </Button>
        </div>
      </div>
    </section>
  )
}

function FreePlanDiagnosticStartCards() {
  return (
    <section className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="m-0 text-lg font-bold leading-[1.35] text-[var(--color-student-heading)]">
          Start a diagnostic
        </h2>
        <p className="m-0 text-sm leading-[1.5] tracking-[0.28px] text-[var(--greyscale-700,#272835)]">
          Both are free. Pick the length that fits your schedule.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,538fr)_minmax(0,618fr)]">
        <article className="flex min-h-[237px] flex-col rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-[22px] pb-5 pt-[22px]">
          <div className="mb-2.5 flex items-center">
            <span className="text-lg font-bold leading-[1.35] text-[var(--primary)]">Mini</span>
          </div>
          <h3 className="m-0 text-lg font-semibold leading-[1.4] tracking-[0.36px] text-[var(--greyscale-700,#272835)]">
            Quick baseline
          </h3>
          <p className="mt-1 text-base leading-[1.5] tracking-[0.32px] text-[var(--greyscale-700,#272835)]">
            See your weakest areas without committing to a full section.
          </p>
          <div className="mt-[18px] flex flex-wrap items-center gap-[18px] text-sm text-[var(--greyscale-700,#272835)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-bold leading-[21px]">10</span>
              <span className="tracking-[0.28px]">questions</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-bold leading-[21px]">~13</span>
              <span>min</span>
            </span>
            <span className="tracking-[0.28px]">Quick topic flags</span>
          </div>
          <div className="mt-auto flex justify-end pt-5">
            <Link
              to={FREE_START_MINI_HREF}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 text-sm font-semibold tracking-[0.28px] text-[var(--primary)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] hover:bg-[var(--greyscale-25)]"
            >
              Start mini
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </article>

        <article className="flex min-h-[237px] flex-col rounded-2xl border-2 border-[var(--primary)] bg-[var(--greyscale-0)] px-[21px] pb-[19px] pt-[21px]">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold leading-[1.35] text-[var(--primary)]">Full section</span>
            <span className="rounded-full bg-[var(--primary)] px-[10px] py-[3px] text-xs font-bold leading-[18px] text-white">
              Recommended
            </span>
          </div>
          <h3 className="m-0 text-lg font-semibold leading-[1.4] tracking-[0.36px] text-[var(--greyscale-700,#272835)]">
            Deeper performance view
          </h3>
          <p className="mt-1 text-base leading-[1.5] tracking-[0.32px] text-[var(--greyscale-700,#272835)]">
            Get a fuller breakdown of the areas costing you points.
          </p>
          <div className="mt-[18px] flex flex-wrap items-center gap-[18px] text-sm text-[var(--greyscale-700,#272835)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-bold leading-[21px]">25</span>
              <span className="tracking-[0.28px]">questions</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-bold leading-[21px]">~35</span>
              <span>min</span>
            </span>
            <span className="tracking-[0.28px]">Detailed breakdown</span>
          </div>
          <div className="mt-auto flex justify-end pt-5">
            <Link
              to={FREE_START_FULL_HREF}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-[var(--primary-border)] bg-[var(--primary)] px-4 text-sm font-semibold tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[var(--primary-600)]"
            >
              Start full section
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}

function FreePlanContinueLearning() {
  const { openLockedContentModal } = useGuestPricingModal()

  return (
    <section className="flex w-full flex-col gap-[18px] rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-5 pb-[18px] pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-base font-semibold leading-[23.2px] text-[var(--color-student-heading)]">
            Continue learning
          </h2>
          <span className="rounded-full bg-[var(--primary)] px-[7px] py-[3px] text-[10px] font-bold leading-[14.5px] tracking-[0.4px] text-white">
            NEW
          </span>
        </div>
        <p className="m-0 text-xs leading-[17.4px] text-[var(--greyscale-500)]">
          Not started yet · 36 hours total
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <CourseProgressRing value={0} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="m-0 text-[17px] font-semibold leading-[24.65px] text-[var(--color-student-heading)]">
              LSAT Essentials Course
            </p>
            <p className="m-0 text-xs leading-[17.4px] text-[var(--greyscale-500)]">
              5 modules · 122 lessons
            </p>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold text-[var(--color-student-heading)]">The Kickoff</span>
            <ChevronRight className="size-3 shrink-0 text-[var(--greyscale-500)]" aria-hidden />
            <span className="text-[var(--greyscale-500)]">
              Start with:{" "}
              <span className="font-semibold text-[var(--color-student-heading)]">
                Welcome to the Arena
              </span>
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs leading-[17.4px] text-[var(--greyscale-500)]">
            <Clock className="size-[13px] shrink-0" aria-hidden />
            First section takes about 36 min
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <Button asChild className="h-10 rounded-[14px] border border-[var(--primary-border)] px-4 text-sm font-semibold tracking-[0.28px] shadow-[0px_1px_1px_rgba(13,13,18,0.06)]">
            <Link to={PREP_COURSE_HREF}>
              Start course
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Link
            to={PREP_COURSE_HREF}
            className="px-0.5 py-1 text-center text-xs font-semibold leading-[17.4px] text-[var(--primary)] hover:underline sm:text-right"
          >
            View all modules
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 border-t border-[var(--greyscale-100)] pt-3 sm:grid-cols-2 lg:grid-cols-5">
        {CONTINUE_LEARNING_MODULES.map((module) => {
          if (module.kind === "progress") {
            return (
              <Link
                key={module.id}
                to={PREP_COURSE_HREF}
                className="flex h-[52px] min-w-0 items-center gap-2.5 rounded-[10px] border border-[var(--primary-25)] bg-[var(--greyscale-0)] px-3 py-2.5 transition-colors hover:bg-[var(--greyscale-25)]"
              >
                <CourseProgressRing value={0} size="sm" />
                <div className="min-w-0">
                  <p className="m-0 truncate text-xs font-semibold leading-[15px] text-[var(--color-student-heading)]">
                    {module.title}
                  </p>
                  <p className="m-0 text-[11px] leading-[13.75px] text-[var(--greyscale-500)]">
                    {module.lessonsDone} of {module.lessonsTotal} lessons
                  </p>
                </div>
              </Link>
            )
          }

          return (
            <button
              key={module.id}
              type="button"
              className="flex h-[52px] min-w-0 items-center gap-2.5 rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--primary-0,#f3f7ff)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--primary-25)]"
              onClick={() => openLockedContentModal("courses")}
            >
              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--primary-25)]">
                <Lock className="size-[13px] text-[var(--primary)]" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="m-0 truncate text-xs font-semibold leading-[15px] text-[var(--color-student-heading)]">
                  {module.title}
                </p>
                <p className="m-0 text-[11px] leading-[13.75px] text-[var(--greyscale-500)]">
                  {module.lessonsTotal} lessons
                </p>
              </div>
            </button>
          )
        })}
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
          className="flex min-h-[96px] flex-col justify-center rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[25px]"
        >
          <p className="m-0 text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{card.label}</p>
          <FreePlanMetricPlaceholder widthClass={card.skeletonWidthClass} className="mt-[7.5px]" />
        </article>
      ))}
    </div>
  )
}

function FreePlanLockedPerformanceOverview() {
  return (
    <section className="w-full rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[25px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-semibold tracking-[0.36px] text-[var(--color-student-heading)]">
          Performance Overview
        </h2>
        <p className="m-0 text-[11px] font-medium leading-[16.5px] text-[var(--greyscale-500)]">
          These score are predictive and differ for every student
        </p>
      </div>

      <div className="mt-[18.75px] grid grid-cols-2 gap-px overflow-hidden bg-[var(--greyscale-100)] sm:grid-cols-3 xl:grid-cols-6">
        {LOCKED_PERFORMANCE_METRICS.map((metric) => (
          <div key={metric.id} className="flex min-w-0 flex-col gap-1.5 bg-[var(--greyscale-0)] p-4">
            <p className="m-0 text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{metric.label}</p>
            <FreePlanMetricPlaceholder
              widthClass={metric.skeletonWidthClass}
              heightClass="h-4"
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function FreePlanTranscriptsBanner() {
  return (
    <section className="flex w-full flex-col gap-[18px] rounded-2xl border border-[var(--primary)] bg-[var(--greyscale-0)] px-[22px] py-[18px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] sm:flex-row sm:items-center">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--primary-25)]">
        <MessageCircle className="size-5 text-[var(--primary)]" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-lg font-bold leading-[1.35] text-[#0e2a5c]">No session transcripts yet</p>
        <p className="m-0 pt-0.5 text-sm leading-[1.5] tracking-[0.28px] text-[#4a5b78]">
          After each 1-on-1 session, your transcript and key takeaways show up here. Until then,
          browse real sessions from other students.
        </p>
      </div>
      <Button
        asChild
        className="h-10 shrink-0 rounded-[14px] border border-[var(--primary-border)] px-4 text-sm font-semibold tracking-[0.28px] shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
      >
        <Link to={STUDENT_TUTORING_BOOK_HREF}>Book Your First Session</Link>
      </Button>
    </section>
  )
}

function FreePlanDiagnosticHistoryRow({ attempt }: { attempt: GuestDiagnosticResult }) {
  const href = diagnosticAttemptHref(attempt.intentId, attempt.id)

  return (
    <Link
      to={href}
      className="flex items-start gap-3 rounded-[14px] px-3 py-3 transition-colors hover:bg-[var(--greyscale-25)] sm:min-h-16 sm:items-center sm:justify-between sm:gap-5 sm:px-4 sm:py-3.5"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[15px] font-bold leading-6 text-[var(--greyscale-700,#272835)] sm:text-base">
          {formatHistoryTitle(attempt)}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-sm tracking-[0.28px] text-[var(--greyscale-700,#272835)]">
          <Calendar className="size-3.5 shrink-0" aria-hidden />
          <time dateTime={attempt.completedAt}>{formatHistoryDateLabel(attempt.completedAt)}</time>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <span className="hidden h-6 items-center truncate rounded-full bg-[var(--primary-0,#f3f7ff)] px-[10px] py-[3px] text-xs font-bold tracking-[0.24px] text-[var(--greyscale-700,#272835)] sm:inline-flex">
          {historyKindBadge(attempt)}
        </span>
        <div className="min-w-0 text-right">
          <p className="m-0 text-[15px] font-semibold tracking-[0.32px] text-[var(--greyscale-700,#272835)] sm:text-base">
            {attempt.scaledScoreLabel}
          </p>
          <p className="m-0 text-sm tracking-[0.28px] text-[var(--greyscale-700,#272835)]">
            {attempt.correctCount} of {attempt.questionCount} correct
          </p>
        </div>
        <ChevronRight className="size-[18px] shrink-0 text-[var(--greyscale-500)]" aria-hidden />
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
    <section className="w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="m-0 text-lg font-bold leading-[1.35] text-[var(--color-student-heading)]">
          Diagnostic history
        </h2>
        <div
          className="inline-flex max-w-full flex-wrap gap-1 rounded-[14px] bg-[var(--primary-0,#f3f7ff)] p-1"
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
                  "min-h-8 rounded-[9px] px-2.5 text-xs font-semibold tracking-[0.24px] sm:min-h-9 sm:px-3.5 sm:text-sm sm:tracking-[0.28px]",
                  active
                    ? "bg-[var(--greyscale-0)] text-[var(--greyscale-700,#272835)]"
                    : "bg-transparent text-[var(--greyscale-700,#272835)]",
                )}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-2">
        {attempts.length === 0 ? (
          <p className="m-0 rounded-[14px] px-4 py-8 text-center text-sm text-[var(--greyscale-500)]">
            No diagnostics yet. Start a Mini or Full Section above — both are free.
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
        <p className="m-0 text-base leading-[1.5] tracking-[0.32px] text-[var(--greyscale-700,#272835)]">
          Take a free diagnostic to see which question types are costing you the most points.
        </p>
      </div>

      <FreePlanUpgradeBanner />
      <FreePlanTutoringBanner />
      <FreePlanDiagnosticStartCards />
      <FreePlanContinueLearning />
      <FreePlanLockedQuickStats />
      <FreePlanLockedPerformanceOverview />
      <FreePlanTranscriptsBanner />
      <FreePlanDiagnosticHistory />
    </div>
  )
}

export { FreePlanDashboard, FREE_START_FULL_HREF, FREE_START_MINI_HREF }
