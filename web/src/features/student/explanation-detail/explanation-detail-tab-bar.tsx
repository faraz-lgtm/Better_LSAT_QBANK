import { Link, useNavigate } from "react-router-dom"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

import type { ExplanationDetailTabId } from "@/features/student/explanation-detail/types"
import { cn } from "@/lib/utils"

export type ExplanationPassageQuestionOption = {
  id: string
  number: number
}

type ExplanationDetailTabBarProps = {
  headingCode: string
  subtitleTrail: string
  questionNumber: number
  passageQuestions: ExplanationPassageQuestionOption[]
  tab: ExplanationDetailTabId
  onTabChange: (t: ExplanationDetailTabId) => void
  prevHref: string | null
  nextHref: string | null
  showExplanationTab?: boolean
}

const TABS: { id: ExplanationDetailTabId; label: string }[] = [
  { id: "question", label: "Question" },
  { id: "explanation", label: "Video Explanation" },
  { id: "analytics", label: "Insights" },
]

function tabButtonClass(active: boolean): string {
  return cn(
    "inline-flex h-10 items-center justify-center rounded-[14px] px-4 text-sm font-semibold tracking-[0.02em] transition-colors",
    active
      ? "border border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_1px_1px_rgba(13,13,18,0.06)]"
      : "bg-[var(--primary-25)] text-[var(--primary)] hover:bg-[var(--primary-25)]",
  )
}

function navArrowClass(enabled: boolean): string {
  return cn(
    "flex size-6 shrink-0 items-center justify-center rounded-lg shadow-[0_1px_1px_rgba(13,13,18,0.06)] transition-colors",
    enabled ? "text-[var(--color-student-heading)] hover:bg-[var(--primary-25)]" : "cursor-default text-[var(--greyscale-500)] opacity-40",
  )
}

function ExplanationDetailTabBar({
  headingCode,
  subtitleTrail,
  questionNumber,
  passageQuestions,
  tab,
  onTabChange,
  prevHref,
  nextHref,
  showExplanationTab = true,
}: ExplanationDetailTabBarProps) {
  const navigate = useNavigate()
  const visibleTabs = TABS.filter((t) => t.id !== "explanation" || showExplanationTab)

  const questionSelectValue = passageQuestions.find((q) => q.number === questionNumber)?.id ?? ""

  return (
    <header className="flex shrink-0 flex-col gap-6 rounded-2xl bg-[var(--primary-25)] p-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <div className="min-w-0">
          <h1 className="student-page-heading">{headingCode}</h1>
          <p className="m-0 mt-0 text-xs font-normal leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
            {subtitleTrail}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl bg-[var(--greyscale-0)] p-2">
          {prevHref ? (
            <Link to={prevHref} aria-label="Previous question" className={navArrowClass(true)}>
              <ChevronLeft className="size-3.5" aria-hidden />
            </Link>
          ) : (
            <span aria-label="Previous question" className={navArrowClass(false)}>
              <ChevronLeft className="size-3.5" aria-hidden />
            </span>
          )}

          <label className="relative inline-flex h-[30px] w-[120px] items-center">
            <span className="sr-only">Jump to question</span>
            <select
              value={questionSelectValue}
              onChange={(event) => {
                const id = event.target.value
                if (!id) return
                const q = tab === "question" ? "" : `?tab=${tab}`
                void navigate(`/app/learn/explanations/q/${encodeURIComponent(id)}${q}`)
              }}
              className="h-full w-full appearance-none rounded-lg bg-[var(--primary-25)] px-2 pr-7 text-[10px] font-semibold tracking-[0.02em] text-[var(--color-student-heading)] outline-none"
            >
              {passageQuestions.map((q) => (
                <option key={q.id} value={q.id}>
                  Question {q.number}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 size-3 text-[var(--color-student-heading)]" aria-hidden />
          </label>

          {nextHref ? (
            <Link to={nextHref} aria-label="Next question" className={navArrowClass(true)}>
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          ) : (
            <span aria-label="Next question" className={navArrowClass(false)}>
              <ChevronRight className="size-3.5" aria-hidden />
            </span>
          )}
        </div>
      </div>

      <div
        className="inline-flex items-center gap-2 self-start rounded-2xl bg-[var(--greyscale-0)] p-2"
        role="tablist"
        aria-label="Question detail"
      >
        {visibleTabs.map(({ id, label }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={tabButtonClass(active)}
            >
              {label}
            </button>
          )
        })}
      </div>
    </header>
  )
}

export { ExplanationDetailTabBar }
