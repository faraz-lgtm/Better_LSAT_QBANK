import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { ExplanationDetailTabId } from "@/features/student/explanation-detail/types"
import { cn } from "@/lib/utils"

type ExplanationDetailTabBarProps = {
  tab: ExplanationDetailTabId
  onTabChange: (t: ExplanationDetailTabId) => void
  prevHref: string | null
  nextHref: string | null
}

const TABS: { id: ExplanationDetailTabId; label: string }[] = [
  { id: "question", label: "Question" },
  { id: "explanation", label: "Explanation" },
  { id: "analytics", label: "Insights" },
]

function tabButtonClass(active: boolean, id: ExplanationDetailTabId): string {
  const isExplanation = id === "explanation"
  const size = active
    ? isExplanation
      ? "h-10 text-sm tracking-[0.02em]"
      : "h-12 text-base tracking-[0.02em]"
    : isExplanation
      ? "h-12 text-sm tracking-[0.02em]"
      : "h-12 text-base tracking-[0.02em]"

  return cn(
    "rounded-2xl px-4 font-semibold transition-colors",
    size,
    active
      ? "border border-[#0b4e6e] bg-[#0d47a1] text-white shadow-[0_1px_1px_rgba(13,13,18,0.06)]"
      : "bg-transparent text-[#0d47a1] hover:bg-white/50",
  )
}

function navButtonClass(enabled: boolean): string {
  return cn(
    "flex size-[52px] shrink-0 items-center justify-center rounded-2xl border-2 border-[color:var(--greyscale-100)] bg-[var(--greyscale-25)] shadow-[0_1px_1px_rgba(13,13,18,0.06)] transition-colors",
    enabled ? "text-[#062357] hover:opacity-80" : "opacity-40",
  )
}

function ExplanationDetailTabBar({
  tab,
  onTabChange,
  prevHref,
  nextHref,
}: ExplanationDetailTabBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-start gap-6 lg:justify-end">
      <div
        className="inline-flex h-[52px] items-center gap-2 rounded-2xl bg-[var(--primary-25)] p-1"
        role="tablist"
        aria-label="Question detail"
      >
        {TABS.map(({ id, label }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={tabButtonClass(active, id)}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="flex h-[52px] items-center gap-4">
        {prevHref ? (
          <Link to={prevHref} aria-label="Previous question" className={navButtonClass(true)}>
            <ChevronLeft className="size-6" aria-hidden />
          </Link>
        ) : (
          <span aria-label="Previous question" className={navButtonClass(false)}>
            <ChevronLeft className="size-6" aria-hidden />
          </span>
        )}
        {nextHref ? (
          <Link to={nextHref} aria-label="Next question" className={navButtonClass(true)}>
            <ChevronRight className="size-6" aria-hidden />
          </Link>
        ) : (
          <span aria-label="Next question" className={navButtonClass(false)}>
            <ChevronRight className="size-6" aria-hidden />
          </span>
        )}
      </div>
    </div>
  )
}

export { ExplanationDetailTabBar }
