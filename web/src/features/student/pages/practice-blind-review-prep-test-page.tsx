import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { ChevronRight, EyeOff } from "lucide-react"

import { FigmaIcon } from "@/components/icons/figma-icons"
import { cn } from "@/lib/utils"
import type { BlindReviewDetailResponse, BlindReviewDetailSection } from "@/features/student/blind-review/blind-review-types"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { StudentMain } from "@/features/student/components/student-main"
import { PREPTEST_LIST_HREF } from "@/features/student/preptests/preptest-routes"
import {
  BLIND_REVIEW_NOTES_BACK_BUTTON_CLASS,
  BLIND_REVIEW_NOTES_BADGE_ACTUAL_CLASS,
  BLIND_REVIEW_NOTES_BADGE_BLIND_CLASS,
  BLIND_REVIEW_NOTES_CARD_CLASS,
  BLIND_REVIEW_NOTES_HEADER_CLASS,
  BLIND_REVIEW_NOTES_PAGE_CLASS,
  BLIND_REVIEW_NOTES_PT_LABEL_CLASS,
  BLIND_REVIEW_NOTES_SECTION_CARD_CLASS,
  BLIND_REVIEW_NOTES_SECTION_SUBTITLE_ACTIVE_CLASS,
  BLIND_REVIEW_NOTES_SECTION_SUBTITLE_MUTED_CLASS,
  BLIND_REVIEW_NOTES_SECTION_TITLE_ACTIVE_CLASS,
  BLIND_REVIEW_NOTES_SECTION_TITLE_MUTED_CLASS,
  BLIND_REVIEW_NOTES_START_BUTTON_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PREP_POOL_SETTINGS_HREF = "/app/practice/drills"

function sectionDisplayTitle(row: BlindReviewDetailSection, index: number): string {
  if (row.sectionNumber != null) return `Section ${row.sectionNumber}`
  return `Section ${index + 1}`
}

function BlindReviewNotesHeader({
  prepTestLabel,
  actualScoreLabel,
  onClose,
}: {
  prepTestLabel: string
  actualScoreLabel: string
  onClose: () => void
}) {
  return (
    <header className={BLIND_REVIEW_NOTES_HEADER_CLASS}>
      <div className="flex min-w-0 flex-col gap-2.5">
        <p className={BLIND_REVIEW_NOTES_PT_LABEL_CLASS}>{prepTestLabel}</p>
        <div className="flex h-6 flex-wrap items-center gap-2">
          <span className={BLIND_REVIEW_NOTES_BADGE_BLIND_CLASS}>
            <EyeOff className="size-3 shrink-0" aria-hidden />
            Blind Review
          </span>
          <span className={BLIND_REVIEW_NOTES_BADGE_ACTUAL_CLASS}>{actualScoreLabel}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#666d80] transition-colors hover:bg-[#edf3ff] hover:text-[#062357]"
        aria-label={`Close ${prepTestLabel}`}
      >
        <FigmaIcon name="block-circle" className="size-6" aria-hidden />
      </button>
    </header>
  )
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
  const recommendedLabel = `${recommendedCount} Question${recommendedCount === 1 ? "" : "s"} recommended for BR`

  return (
    <div className={BLIND_REVIEW_NOTES_SECTION_CARD_CLASS}>
      <div className="flex min-w-0 flex-1 items-center">
        <div className="flex flex-col gap-1.5">
          <p className={canStart ? BLIND_REVIEW_NOTES_SECTION_TITLE_ACTIVE_CLASS : BLIND_REVIEW_NOTES_SECTION_TITLE_MUTED_CLASS}>
            {sectionDisplayTitle(row, index)}
          </p>
          <p
            className={
              canStart ? BLIND_REVIEW_NOTES_SECTION_SUBTITLE_ACTIVE_CLASS : BLIND_REVIEW_NOTES_SECTION_SUBTITLE_MUTED_CLASS
            }
          >
            {recommendedLabel}
          </p>
        </div>
      </div>
      {canStart ? (
        <button type="button" onClick={onStart} className={BLIND_REVIEW_NOTES_START_BUTTON_CLASS}>
          Start
          <ChevronRight className="size-5 shrink-0" aria-hidden />
        </button>
      ) : !row.sectionSessionId ? (
        <span className="shrink-0 text-xs font-semibold text-[#a4acb9]">Complete in PrepTest first</span>
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

  function closeNotes() {
    navigate("/app/practice/blind-review")
  }

  const pageShell = (children: ReactNode) => (
    <StudentMain className={BLIND_REVIEW_NOTES_PAGE_CLASS} contentClassName="!px-6 !pt-0 !pb-6">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">{children}</div>
    </StudentMain>
  )

  if (!testIdParam) {
    return <Navigate to="/app/practice/blind-review" replace />
  }

  if (loading) {
    return pageShell(<StudentPageLoader centered className="py-16" label="Loading blind review…" />)
  }

  if (!detail) {
    return pageShell(
      <>
        <p className="pt-6 text-sm text-red-600">{error ?? "PrepTest not found."}</p>
        <Link to="/app/practice/blind-review" className="text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to Blind Review
        </Link>
      </>,
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

  return pageShell(
    <>
      <BlindReviewNotesHeader
        prepTestLabel={prepTest.label}
        actualScoreLabel={actualScoreLabel}
        onClose={closeNotes}
      />

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <section className={BLIND_REVIEW_NOTES_CARD_CLASS}>
        <div className="flex h-12 w-full items-center justify-between gap-2.5">
          <h2 className="shrink-0 text-2xl font-bold leading-[1.3] text-[#062357]">Blind Review</h2>
          <p className="min-w-0 text-right text-sm font-normal leading-normal tracking-[0.28px] text-[#666d80]">
            Go to your{" "}
            <Link to={PREP_POOL_SETTINGS_HREF} className="font-semibold text-[#0d47a1] hover:underline">
              Prep pool settings
            </Link>{" "}
            to change what sections are available.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full max-w-[513px] text-base font-normal leading-normal tracking-[0.32px] text-[#0d0d12]">
            <p className="mb-0">
              Review and redo your answers without time pressure. We&apos;ll tell you which questions to look at, but not
              what the answers are or whether you got them wrong. This is the best way to build your LSAT intuition and
              prevent similar mistakes in the future.
            </p>
            <br/>
            <p className="mb-0 mt-6">Trust us, you&apos;ll thank us later.</p>
            <br/>
            <p className="mb-0 mt-6">
              {recommendedTotal} question{recommendedTotal === 1 ? "" : "s"} are recommended for BR
            </p>
            <p className="mb-0 mt-6 font-normal text-[#ff6f00]">
              The questions with orange color the ones we think you should review.
            </p>
          </div>

          <div className="flex w-full max-w-[513px] flex-col gap-6">
            {blindReviewDone ? (
              <p className="rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] px-6 py-8 text-sm font-semibold text-[#287f6e]">
                Blind review completed
                {blindReview.blindReviewScaledScore != null ? ` · BR score ${blindReview.blindReviewScaledScore}` : ""}
                .
              </p>
            ) : !blindReviewActive ? (
              <p className="rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] px-6 py-8 text-sm text-[#666d80]">
                {starting ? "Starting blind review…" : "Preparing sections…"}
              </p>
            ) : (
              <ul className="flex flex-col gap-6">
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

        <div className="flex flex-wrap items-center justify-end gap-6">
          <button type="button" onClick={closeNotes} className={BLIND_REVIEW_NOTES_BACK_BUTTON_CLASS}>
            Back
          </button>
          {blindReviewDone ? (
            <button
              type="button"
              onClick={() => navigate(PREPTEST_LIST_HREF)}
              className={cn(BLIND_REVIEW_NOTES_START_BUTTON_CLASS, "min-w-[200px]")}
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              disabled={finishing || !canSubmitBlindReview}
              onClick={() => void handleCompleteBlindReview()}
              className={cn(BLIND_REVIEW_NOTES_START_BUTTON_CLASS, "min-w-[220px] disabled:opacity-50")}
            >
              <FigmaIcon name="notification-text-square" className="size-5 shrink-0" aria-hidden />
              {finishing ? "Submitting…" : "Submit Blind Review"}
            </button>
          )}
        </div>
      </section>
    </>,
  )
}

export { PracticeBlindReviewPrepTestPage }
