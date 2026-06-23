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

function tabButtonClass(active: boolean): string {
  return cn(
    "inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-sm font-semibold tracking-[0.02em] transition-colors",
    active
      ? "border border-[#0b4e6e] bg-[#0d47a1] text-white shadow-[0_1px_1px_rgba(13,13,18,0.06)]"
      : "border border-transparent bg-transparent text-[#0d47a1] hover:bg-white/60",
  )
}

function navButtonClass(enabled: boolean, direction: "prev" | "next"): string {
  return cn(
    "flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-[#dfe1e7] bg-white shadow-[0_1px_1px_rgba(13,13,18,0.06)] transition-colors",
    enabled ? (direction === "next" ? "text-[#0d47a1] hover:bg-[#f3f7ff]" : "text-[#666d80] hover:bg-[#f3f7ff]") : "text-[#666d80] opacity-40",
  )
}

function ExplanationDetailTabBar({
  tab,
  onTabChange,
  prevHref,
  nextHref,
}: ExplanationDetailTabBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 lg:gap-6">
      <div
        className="inline-flex h-12 items-center gap-1 rounded-[10px] bg-[var(--primary-25)] p-1"
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
              className={tabButtonClass(active)}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-3">
        {prevHref ? (
          <Link to={prevHref} aria-label="Previous question" className={navButtonClass(true, "prev")}>
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
        ) : (
          <span aria-label="Previous question" className={navButtonClass(false, "prev")}>
            <ChevronLeft className="size-5" aria-hidden />
          </span>
        )}
        {nextHref ? (
          <Link to={nextHref} aria-label="Next question" className={navButtonClass(true, "next")}>
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        ) : (
          <span aria-label="Next question" className={navButtonClass(false, "next")}>
            <ChevronRight className="size-5" aria-hidden />
          </span>
        )}
      </div>
    </div>
  )
}

export { ExplanationDetailTabBar }
