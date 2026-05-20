import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"
import type { BlindReviewPoolItem, BlindReviewStatus } from "@/features/student/blind-review/blind-review-types"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const FILTER_TABS: { id: "all" | BlindReviewStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "eligible", label: "Ready" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
]

function displayPrepTestNumber(item: BlindReviewPoolItem): number {
  const n = item.prepTestNumber ? Number.parseInt(item.prepTestNumber, 10) : NaN
  if (Number.isFinite(n)) return n
  const fromModule = /^LSAC(\d+)$/i.exec(item.moduleId)?.[1]
  return fromModule ? Number.parseInt(fromModule, 10) : 0
}

function statusTitle(status: BlindReviewStatus): string {
  if (status === "eligible") return "Ready for Blind Review"
  if (status === "in_progress") return "Blind Review In Progress"
  return "Blind Review Complete"
}

function statusSubtitle(item: BlindReviewPoolItem): string {
  if (item.status === "completed" && item.blindReviewScaledScore != null) {
    return `Test ${item.scaledScore ?? "—"} → BR ${item.blindReviewScaledScore}`
  }
  if (item.status === "in_progress") {
    return `${item.questionCount} questions · Continue reviewing`
  }
  if (item.scaledScore != null) {
    return `Test score ${item.scaledScore} · ${item.questionCount} questions`
  }
  return `${item.questionCount} questions`
}

function PtBadge({ number, tone }: { number: number; tone: "default" | "muted" | "success" }) {
  const palette =
    tone === "success"
      ? "border-[#287f6e] bg-[#fff3ea] text-[#287f6e]"
      : tone === "muted"
        ? "border-[#666d80] bg-[#f6f8fa] text-[#666d80]"
        : "border-[#0d47a1] bg-[#f3f7ff] text-[#0d47a1]"
  return (
    <div
      className={cn("flex size-16 shrink-0 flex-col items-center justify-center rounded-[14px] border p-px", palette)}
    >
      <span
        className="w-[35px] text-center text-xs font-semibold leading-[1.35]"
        style={{ fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif" }}
      >
        PT
      </span>
      <span className="text-2xl font-bold leading-[1.3]">{number || "—"}</span>
    </div>
  )
}

function BlindReviewListCard({
  item,
  onPrimary,
}: {
  item: BlindReviewPoolItem
  onPrimary: () => void
}) {
  const ptNum = displayPrepTestNumber(item)
  const isCompleted = item.status === "completed"
  const isInProgress = item.status === "in_progress"
  const badgeTone: "default" | "muted" | "success" = isCompleted ? "success" : isInProgress ? "default" : "default"
  const titleClass = isCompleted ? "text-[#287f6e]" : "text-[#0d47a1]"

  const primaryLabel = isCompleted ? "View" : isInProgress ? "Continue" : "Start"
  const primaryClass = isCompleted
    ? "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center rounded-2xl border border-[#dfe1e7] bg-white text-base font-semibold text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"
    : "inline-flex h-[52px] w-[148px] shrink-0 items-center justify-center rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] text-base font-semibold text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#0b3d82]"

  return (
    <article className="flex min-h-[110px] w-full flex-wrap items-center gap-4 rounded-2xl border border-[#dfe1e7] bg-white px-6 py-3 shadow-[0px_1px_1px_rgba(13,13,18,0.06)] sm:flex-nowrap sm:py-0">
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <PtBadge number={ptNum} tone={badgeTone} />
        <div className="flex min-w-0 flex-col gap-2">
          <p className={cn("truncate text-2xl font-bold leading-[1.3]", titleClass)}>{statusTitle(item.status)}</p>
          <p className="truncate text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
            {item.title ?? item.moduleId} · {statusSubtitle(item)}
          </p>
        </div>
      </div>
      <button type="button" onClick={onPrimary} className={primaryClass}>
        {primaryLabel}
      </button>
    </article>
  )
}

function PracticeBlindReviewPage() {
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])

  const [filter, setFilter] = useState<"all" | BlindReviewStatus>("all")
  const [prepTests, setPrepTests] = useState<BlindReviewPoolItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const out = await practiceApi.listBlindReviewPool()
        if (!cancelled) setPrepTests(out.prepTests)
      } catch (e) {
        if (!cancelled) {
          setPrepTests([])
          setError(e instanceof Error ? e.message : "Failed to load blind review")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [practiceApi])

  const rows = useMemo(() => {
    if (filter === "all") return prepTests
    return prepTests.filter((p) => p.status === filter)
  }, [prepTests, filter])

  function filterCountLabel(tabId: "all" | BlindReviewStatus): string {
    if (tabId === "all") return `All (${prepTests.length})`
    const n = prepTests.filter((p) => p.status === tabId).length
    const base = FILTER_TABS.find((t) => t.id === tabId)?.label ?? tabId
    return `${base} (${n})`
  }

  return (
    <>
      <StudentSubnavStrip
        title="Blind Review"
        crumbs={[{ label: "Practice", href: "/app/practice/drills" }, { label: "Blind Review" }]}
      />
      <StudentMain>
        <p className="mb-6 max-w-[908px] text-sm font-medium leading-[1.5] tracking-[0.02em] text-[#666d80] md:text-base">
          After you finish a PrepTest, blind review lets you revisit every question without seeing correct answers.
          Update your responses, then finish to record your blind review score.
        </p>

        <section className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">Your PrepTests</h2>
            <div className="flex flex-wrap gap-3">
              {FILTER_TABS.map((tab) => {
                const active = filter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={cn(
                      "inline-flex h-[52px] items-center justify-center rounded-2xl border px-4 text-base shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors",
                      active
                        ? "border-[#0b4e6e] bg-[#0d47a1] font-semibold text-white"
                        : "border-[#dfe1e7] bg-white font-medium text-[#666d80] hover:bg-[#f6f8fa]",
                    )}
                  >
                    {filterCountLabel(tab.id)}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-[#666d80]">Loading blind review…</p>
        ) : rows.length === 0 ? (
          <section className="rounded-2xl border border-[#dfe1e7] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#666d80]">
              {prepTests.length === 0
                ? "Complete a PrepTest first (use Finish test on the PrepTest hub), then return here for blind review."
                : "No PrepTests match this filter."}
            </p>
            {prepTests.length === 0 ? (
              <button
                type="button"
                className="mt-4 text-sm font-semibold text-[#0d47a1] hover:underline"
                onClick={() => navigate("/app/practice/preptest")}
              >
                Go to PrepTests
              </button>
            ) : null}
          </section>
        ) : (
          <div className="flex flex-col gap-6">
            {rows.map((item) => (
              <BlindReviewListCard
                key={item.id}
                item={item}
                onPrimary={() => navigate(`/app/practice/blind-review/${encodeURIComponent(item.id)}`)}
              />
            ))}
          </div>
        )}
      </StudentMain>
    </>
  )
}

export { PracticeBlindReviewPage }
