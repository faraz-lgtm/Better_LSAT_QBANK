import { Calendar, ChevronRight } from "lucide-react"
import { Link, Navigate, useSearchParams } from "react-router-dom"

import {
  formatDiagnosticDateLabel,
  getDiagnosticIntentTitle,
  listDiagnosticHistoryBySection,
  type GuestDiagnosticResult,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { StudentMain } from "@/features/student/components/student-main"
import {
  DIAGNOSTIC_RESULTS_MINI_HREF,
  diagnosticAttemptHref,
  type DiagnosticResultsSection,
} from "@/features/student/diagnostic/diagnostic-results-routes"

type DiagnosticResultsHistoryPageProps = {
  section: DiagnosticResultsSection
}

function sectionCopy(section: DiagnosticResultsSection) {
  if (section === "mini") {
    return {
      title: "Mini Diagnostic History",
      empty: "No Mini diagnostics yet. Take the 10-question Mini diagnostic to see your score history here.",
      startHref: "/diagnostic/start?intent=mini",
      startLabel: "Start Mini Diagnostic",
    }
  }
  return {
    title: "Full Diagnostic History",
    empty: "No Full diagnostics yet. Take the 30-question Full diagnostic to see your score history here.",
    startHref: "/diagnostic/start?intent=quick",
    startLabel: "Start Full Diagnostic",
  }
}

function HistoryRow({ attempt }: { attempt: GuestDiagnosticResult }) {
  const dateLabel = formatDiagnosticDateLabel(attempt.completedAt)
  const href = diagnosticAttemptHref(attempt.intentId, attempt.id)
  return (
    <Link
      to={href}
      className="grid grid-cols-1 gap-3 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-4 transition-colors hover:bg-[var(--greyscale-25)] lg:h-[72px] lg:grid-cols-[minmax(0,1fr)_179px_40px] lg:items-center lg:gap-0 lg:p-0"
    >
      <div className="flex min-w-0 flex-col gap-0.5 lg:px-4">
        <p className="truncate text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[var(--primary)]">
          {getDiagnosticIntentTitle(attempt.intentId)} #{attempt.diagnosticNumber}
        </p>
        <div className="inline-flex min-w-0 items-center gap-2 text-xs leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
          <Calendar className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{dateLabel || "—"}</span>
        </div>
      </div>
      <div className="flex h-[52px] flex-col justify-center gap-1.5 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 lg:mx-3">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-sm font-medium leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">Score</span>
          <span className="text-right text-sm font-semibold leading-normal tracking-[0.02em] text-[var(--color-student-heading)]">
            {attempt.scaledScoreLabel}
          </span>
        </div>
        <p className="text-xs font-medium tracking-[0.02em] text-[var(--greyscale-500)]">
          {attempt.correctCount}/{attempt.questionCount} correct
        </p>
      </div>
      <div className="hidden items-center justify-center text-[var(--greyscale-500)] lg:flex">
        <ChevronRight className="size-5" aria-hidden />
      </div>
    </Link>
  )
}

function DiagnosticResultsHistoryPage({ section }: DiagnosticResultsHistoryPageProps) {
  const copy = sectionCopy(section)
  const attempts = listDiagnosticHistoryBySection(section)

  return (
    <StudentMain className="bg-[var(--background)]" contentClassName="flex min-h-0 flex-1 flex-col bg-[var(--background)] pt-6 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="student-page-heading">{copy.title}</h1>
        <Link
          to={copy.startHref}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-[12px] border border-[var(--primary-border)] bg-[var(--primary)] px-5 text-sm font-semibold tracking-[0.28px] text-white hover:bg-[var(--primary-600)]"
        >
          {copy.startLabel}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      <section className="mt-6 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <div className="mb-4 rounded-[16px] bg-[var(--greyscale-25)] px-6 py-4">
          <h2 className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">Attempt history</h2>
        </div>
        {attempts.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-6 py-8 text-center text-sm text-[var(--greyscale-500)]">
            {copy.empty}
          </p>
        ) : (
          <div className="flex max-h-[432px] flex-col gap-3 overflow-y-auto pr-1">
            {attempts.map((attempt) => (
              <HistoryRow key={attempt.id} attempt={attempt} />
            ))}
          </div>
        )}
      </section>
    </StudentMain>
  )
}

function DiagnosticResultsIndexRedirect() {
  const [params] = useSearchParams()
  const qs = params.toString()
  return <Navigate to={`${DIAGNOSTIC_RESULTS_MINI_HREF}${qs ? `?${qs}` : ""}`} replace />
}

export { DiagnosticResultsHistoryPage, DiagnosticResultsIndexRedirect }
