import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { Timer, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BlindReviewDetailResponse, BlindReviewDetailSection } from "@/features/student/blind-review/blind-review-types"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function sectionShortTitle(row: BlindReviewDetailSection): string {
  if (row.title) return row.title
  if (row.sectionNumber != null) return `Section ${row.sectionNumber}`
  return row.sectionType
}

function BlindReviewSectionRow({
  row,
  blindReviewActive,
  onOpen,
}: {
  row: BlindReviewDetailSection
  blindReviewActive: boolean
  onOpen: () => void
}) {
  const canOpen = blindReviewActive && row.practiceable && row.sectionSessionId
  const progress =
    row.questionCount > 0 ? `${row.answeredCount}/${row.questionCount} questions` : "—"

  return (
    <div
      className="flex min-h-[100px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dfe1e7] bg-white px-5 py-4 shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)] md:px-6"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className={cn("text-2xl font-bold leading-[1.3]", canOpen ? "text-[#0d47a1]" : "text-[#a4acb9]")}>
          {sectionShortTitle(row)}
        </p>
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 text-sm font-semibold leading-[1.5] tracking-[0.02em]",
            canOpen ? "text-[#666d80]" : "text-[#a4acb9]",
          )}
        >
          <Timer className="size-4 shrink-0" aria-hidden />
          <span>{row.timeMinutes}:00</span>
          <span className="hidden h-3.5 w-px bg-[#dfe1e7] sm:block" aria-hidden />
          <span>{progress}</span>
          {row.completed ? <span className="text-[#287f6e]">Section completed</span> : null}
          {!row.sectionSessionId ? <span>Complete this section in the PrepTest first</span> : null}
        </div>
      </div>
      {canOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-12 min-w-[148px] shrink-0 items-center justify-center rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] px-6 text-base font-semibold text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#0b3d82]"
        >
          Review section
        </button>
      ) : null}
    </div>
  )
}

function PracticeBlindReviewPrepTestPage() {
  const navigate = useNavigate()
  const { testId: testIdParam } = useParams<{ testId: string }>()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])

  const [detail, setDetail] = useState<BlindReviewDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const load = useCallback(async () => {
    if (!testIdParam) return
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getBlindReviewDetail(testIdParam)
      setDetail(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load blind review")
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [practiceApi, testIdParam])

  useEffect(() => {
    void load()
  }, [load])

  async function handleStartBlindReview() {
    if (!testIdParam) return
    setStarting(true)
    setError(null)
    try {
      await practiceApi.startBlindReview(testIdParam)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start blind review")
    } finally {
      setStarting(false)
    }
  }

  async function handleCompleteBlindReview() {
    if (!testIdParam) return
    setFinishing(true)
    setError(null)
    try {
      await practiceApi.completeBlindReview({ prepTestId: testIdParam })
      navigate("/app/practice/blind-review", { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete blind review")
    } finally {
      setFinishing(false)
    }
  }

  function openSection(sessionId: string) {
    if (!testIdParam) return
    const q = new URLSearchParams({ blindReview: "1", prepTestId: testIdParam })
    navigate(`/app/practice/sections/session/${encodeURIComponent(sessionId)}?${q.toString()}`)
  }

  if (!testIdParam) {
    return <Navigate to="/app/practice/blind-review" replace />
  }

  if (loading) {
    return (
      <StudentMain>
        <p className="text-sm text-[#666d80]">Loading blind review…</p>
      </StudentMain>
    )
  }

  if (!detail) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">{error ?? "PrepTest not found."}</p>
        <Link to="/app/practice/blind-review" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to Blind Review
        </Link>
      </StudentMain>
    )
  }

  const { prepTest, blindReview } = detail
  const blindReviewActive = blindReview.status === "in_progress"
  const blindReviewDone = blindReview.status === "completed"
  const practiceableSections = detail.sections.filter((s) => s.practiceable && s.sectionSessionId)

  return (
    <>
      <StudentSubnavStrip
        crumbs={[
          { label: "Practice", href: "/app/practice/drills" },
          { label: "Blind Review", href: "/app/practice/blind-review" },
          { label: prepTest.label },
        ]}
      />
      <StudentMain>
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            to="/app/practice/blind-review"
            className="text-[20px] font-bold leading-[1.3] text-[#0d47a1] transition-colors hover:underline"
          >
            Blind Review
          </Link>
          <button
            type="button"
            onClick={() => navigate("/app/practice/blind-review")}
            className="inline-flex size-10 items-center justify-center rounded-xl text-[#666d80] transition-colors hover:bg-[#e8eef9] hover:text-[#062357]"
            aria-label={`Close ${prepTest.label}`}
          >
            <X className="size-6" />
          </button>
        </div>

        {error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-[#f5f9ff] shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)]">
          <div className="border-b border-[#dfe1e7] bg-white/80 px-5 py-6 md:px-8 md:py-8">
            <h1 className="text-2xl font-bold leading-[1.25] text-[#062357] md:text-[28px]">Blind review</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-[1.5] tracking-[0.02em] text-[#666d80]">
              Revisit each section without seeing whether your answers were correct. Change responses as needed, then
              finish blind review to record your updated score.
            </p>
            <p className="mt-6 text-3xl font-bold text-[#0d47a1] md:text-[32px]">{prepTest.label}</p>
            <dl className="mt-8 flex flex-wrap items-stretch gap-0 divide-x divide-[#dfe1e7]">
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 px-4 py-1 first:pl-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Test score</dt>
                <dd className="text-2xl font-bold text-[#062357]">
                  {blindReview.scaledScore != null ? blindReview.scaledScore : "—"}
                </dd>
              </div>
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 px-4 py-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Blind review</dt>
                <dd className="text-2xl font-bold text-[#062357]">
                  {blindReviewDone && blindReview.blindReviewScaledScore != null
                    ? blindReview.blindReviewScaledScore
                    : blindReviewActive
                      ? "In progress"
                      : "—"}
                </dd>
              </div>
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 px-4 py-1 last:pr-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Sections</dt>
                <dd className="text-2xl font-bold text-[#062357]">{practiceableSections.length}</dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-[#dfe1e7] px-5 py-6 md:px-8">
            {blindReview.status === "eligible" ? (
              <Button
                type="button"
                disabled={starting}
                className="rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0b3d82]"
                onClick={() => void handleStartBlindReview()}
              >
                {starting ? "Starting…" : "Start blind review"}
              </Button>
            ) : blindReviewDone ? (
              <p className="text-sm font-semibold text-[#287f6e]">Blind review completed for this PrepTest.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-[#0d47a1]">Blind review in progress</p>
                <Button
                  type="button"
                  disabled={finishing}
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => void handleCompleteBlindReview()}
                >
                  {finishing ? "Finishing…" : "Finish blind review"}
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#062357]">Sections to review</h2>
          {!blindReviewActive && !blindReviewDone ? (
            <p className="mt-4 text-sm text-[#666d80]">Start blind review to open each section.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {practiceableSections.map((row) => (
                <li key={row.id}>
                  <BlindReviewSectionRow
                    row={row}
                    blindReviewActive={blindReviewActive}
                    onOpen={() => {
                      if (row.sectionSessionId) openSection(row.sectionSessionId)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </StudentMain>
    </>
  )
}

export { PracticeBlindReviewPrepTestPage }
