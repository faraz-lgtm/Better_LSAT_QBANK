import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { ChevronRight, ClipboardCheck, EyeOff, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { BlindReviewDetailResponse, BlindReviewDetailSection } from "@/features/student/blind-review/blind-review-types"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { StudentMain } from "@/features/student/components/student-main"
import { PREPTEST_LIST_HREF } from "@/features/student/preptests/preptest-routes"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function sectionDisplayTitle(row: BlindReviewDetailSection, index: number): string {
  if (row.sectionNumber != null) return `Section ${row.sectionNumber}`
  return `Section ${index + 1}`
}

function BlindReviewSectionCard({
  row,
  index,
  blindReviewActive,
  onStart,
}: {
  row: BlindReviewDetailSection
  index: number
  blindReviewActive: boolean
  onStart: () => void
}) {
  const canStart = blindReviewActive && row.practiceable && row.sectionSessionId
  const recommendedCount = row.questionCount

  return (
    <div className="flex min-h-[88px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dfe1e7] bg-white px-5 py-4 shadow-[0px_1px_1px_rgba(13,13,18,0.04)] md:px-6">
      <div className="flex min-w-0 flex-col gap-1">
        <p className={cn("text-xl font-bold leading-[1.3]", canStart ? "text-[#062357]" : "text-[#a4acb9]")}>
          {sectionDisplayTitle(row, index)}
        </p>
        <p className={cn("text-sm font-medium tracking-[0.02em]", canStart ? "text-[#666d80]" : "text-[#a4acb9]")}>
          {recommendedCount} Question{recommendedCount === 1 ? "" : "s"} recommended for BR
        </p>
      </div>
      {canStart ? (
        <button type="button" onClick={onStart} className="ds-btn min-w-[120px] shrink-0 gap-1 px-5 text-base">
          Start
          <ChevronRight className="size-4" aria-hidden />
        </button>
      ) : !row.sectionSessionId ? (
        <span className="text-xs font-semibold text-[#a4acb9]">Complete in PrepTest first</span>
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
      return data
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load blind review")
      setDetail(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [practiceApi, testIdParam])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!testIdParam || loading || !detail || detail.blindReview.status !== "eligible") return
    let cancelled = false
    void (async () => {
      setStarting(true)
      try {
        await practiceApi.startBlindReview(testIdParam)
        if (!cancelled) await load()
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to start blind review")
        }
      } finally {
        if (!cancelled) setStarting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [testIdParam, loading, detail?.blindReview.status, practiceApi, load])

  async function handleCompleteBlindReview() {
    if (!testIdParam || !detail) return
    setFinishing(true)
    setError(null)
    try {
      let prepTestSessionId = detail.blindReview.prepTestSessionId
      if (detail.blindReview.status === "eligible") {
        const started = await practiceApi.startBlindReview(testIdParam)
        prepTestSessionId = started.id
      }
      const completed = await practiceApi.completeBlindReview({
        prepTestId: testIdParam,
        sessionId: prepTestSessionId,
      })
      navigate(`/app/analytics/preptests/results/${encodeURIComponent(completed.id)}`, { replace: true })
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
        <StudentPageLoader centered label="Loading blind review…" />
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
  const blindReviewActive = blindReview.status === "in_progress" || starting
  const blindReviewDone = blindReview.status === "completed"
  const canSubmitBlindReview = blindReview.status === "in_progress" && !starting
  const practiceableSections = detail.sections.filter((s) => s.practiceable && s.sectionSessionId)
  const recommendedTotal = practiceableSections.reduce((sum, s) => sum + s.questionCount, 0)
  const actualScoreLabel =
    blindReview.scaledScore != null ? `Actual: ${blindReview.scaledScore}` : "Actual: BR"

  return (
    <StudentMain className="py-4 md:py-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#818898]">Blind Review Notes</p>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold leading-[1.2] text-[#062357] md:text-[28px]">{prepTest.label}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff9d51] bg-[#fff3ea] px-3 py-1 text-xs font-semibold text-[#c45a00]">
            <EyeOff className="size-3.5 shrink-0" aria-hidden />
            Blind Review
          </span>
          <span className="inline-flex items-center rounded-full border border-[#f0d4b8] bg-[#fff8f0] px-3 py-1 text-xs font-semibold text-[#8a5a2b]">
            {actualScoreLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/practice/blind-review")}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#dfe1e7] bg-white text-[#666d80] transition-colors hover:bg-[#f6f8fa] hover:text-[#062357]"
          aria-label={`Close ${prepTest.label}`}
        >
          <X className="size-5" />
        </button>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <div className="grid gap-8 border-b border-[#dfe1e7] p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:p-8 lg:gap-10">
          <div className="flex min-w-0 flex-col gap-4">
            <h2 className="text-[28px] font-bold leading-[1.25] text-[#062357] md:text-[32px]">Blind Review</h2>
            <div className="space-y-4 text-sm leading-[1.65] tracking-[0.02em] text-[#36394a]">
              <p>
                Blind review is your chance to revisit every question from this PrepTest without seeing whether your
                original answers were correct. Work through each section at your own pace and change responses where your
                reasoning improved.
              </p>
              <p>
                When you are finished reviewing all sections, submit blind review to record your updated score. Your
                original test score stays on file — blind review adds a separate BR score for comparison.
              </p>
            </div>
            <p className="text-sm font-semibold tracking-[0.02em] text-[#666d80]">
              {recommendedTotal} question{recommendedTotal === 1 ? "" : "s"} are recommended for BR
            </p>
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#ff6f00]">
              The questions with orange color are the ones we think you should review.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <p className="text-right text-xs font-medium leading-[1.5] tracking-[0.02em] text-[#666d80]">
              Go to your{" "}
              <Link to="/app/practice/drills" className="font-semibold text-[#0d47a1] hover:underline">
                practice pool settings
              </Link>{" "}
              to change what sections are available.
            </p>

            {blindReviewDone ? (
              <p className="rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-5 py-6 text-sm font-semibold text-[#287f6e]">
                Blind review completed
                {blindReview.blindReviewScaledScore != null
                  ? ` · BR score ${blindReview.blindReviewScaledScore}`
                  : ""}
                .
              </p>
            ) : !blindReviewActive ? (
              <p className="rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-5 py-6 text-sm text-[#666d80]">
                {starting ? "Starting blind review…" : "Preparing sections…"}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {practiceableSections.map((row, index) => (
                  <li key={row.id}>
                    <BlindReviewSectionCard
                      row={row}
                      index={index}
                      blindReviewActive={blindReviewActive}
                      onStart={() => {
                        if (row.sectionSessionId) openSection(row.sectionSessionId)
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f5f9ff] px-6 py-5 md:px-8">
          <button
            type="button"
            onClick={() => navigate("/app/practice/blind-review")}
            className="text-sm font-semibold tracking-[0.02em] text-[#0d47a1] hover:underline"
          >
            Back
          </button>
          {blindReviewDone ? (
            <button
              type="button"
              onClick={() => navigate(PREPTEST_LIST_HREF)}
              className="ds-btn min-w-[200px] gap-2 px-6 text-base"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              disabled={finishing || !canSubmitBlindReview}
              onClick={() => void handleCompleteBlindReview()}
              className="ds-btn min-w-[220px] gap-2 px-6 text-base disabled:opacity-50"
            >
              <ClipboardCheck className="size-5 shrink-0" aria-hidden />
              {finishing ? "Submitting…" : "Submit Blind Review"}
            </button>
          )}
        </div>
      </section>
    </StudentMain>
  )
}

export { PracticeBlindReviewPrepTestPage }
