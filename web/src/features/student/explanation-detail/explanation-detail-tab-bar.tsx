import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  { id: "analytics", label: "Analytics" },
]

function ExplanationDetailTabBar({ tab, onTabChange, prevHref, nextHref }: ExplanationDetailTabBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
      <div
        className="inline-flex flex-wrap items-center gap-0.5 rounded-xl p-1"
        style={{ backgroundColor: "var(--student-expanded-row)" }}
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
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                active ? "text-white shadow-sm" : "bg-transparent hover:opacity-90",
              )}
              style={
                active
                  ? { backgroundColor: "var(--color-student-heading)" }
                  : { color: "var(--color-student-cta)" }
              }
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-full border-[color:var(--greyscale-100)] bg-white"
            asChild
          >
            <Link to={prevHref} aria-label="Previous question">
              <ChevronLeft className="size-5 text-[color:var(--color-student-heading)]" />
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-full border-[color:var(--greyscale-100)] opacity-40"
            disabled
            aria-label="Previous question"
          >
            <ChevronLeft className="size-5" />
          </Button>
        )}
        {nextHref ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-full border-[color:var(--greyscale-100)] bg-white"
            asChild
          >
            <Link to={nextHref} aria-label="Next question">
              <ChevronRight className="size-5 text-[color:var(--color-student-heading)]" />
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-full border-[color:var(--greyscale-100)] opacity-40"
            disabled
            aria-label="Next question"
          >
            <ChevronRight className="size-5" />
          </Button>
        )}
      </div>
    </div>
  )
}

export { ExplanationDetailTabBar }
