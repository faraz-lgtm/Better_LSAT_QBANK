import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import type {
  PrepTestDetailResponse,
  PrepTestDetailSection,
  PrepTestSectionBreak,
} from "@/features/student/preptests/preptest-types"
import {
  blindReviewSectionSessionPath,
  firstBlindReviewSectionSessionId,
  prepTestResultsPath,
  skipBlindReviewBestEffort,
} from "@/features/student/blind-review/blind-review-navigation"
import { PracticeCompleteModal } from "@/features/student/practice-session/practice-complete-modal"
import { createPracticeApi } from "@/lib/api/practice"
import {
  clearStoredSectionBreak,
  findNextSectionAfterBreak,
  normalizePrepTestDetail,
  PREPTEST_SECTION_BREAK_SECONDS,
  writeStoredSectionBreak,
} from "@/features/student/preptests/preptest-section-break"
import {
  isRetakePrepTestAttempt,
  prepTestHubHref,
  sectionSessionHref,
} from "@/features/student/preptests/preptest-hub-navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ChevronDown, ChevronRight, Timer, X } from "lucide-react"

const SECTION_BREAK_TOTAL_SECONDS = PREPTEST_SECTION_BREAK_SECONDS

function formatBreakCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds)
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function SectionBreakRow({
  sectionBreak,
  skipping,
  onSkip,
  onExpired,
}: {
  sectionBreak: PrepTestSectionBreak
  skipping: boolean
  onSkip: () => void
  onExpired: () => void
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const endsAtMs = Date.parse(sectionBreak.endsAt)
    if (!Number.isFinite(endsAtMs)) return sectionBreak.remainingSeconds
    return Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000))
  })

  useEffect(() => {
    const endsAtMs = Date.parse(sectionBreak.endsAt)
    if (!Number.isFinite(endsAtMs)) {
      setRemainingSeconds(sectionBreak.remainingSeconds)
      return
    }

    const tick = () => {
      const next = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000))
      setRemainingSeconds(next)
      if (next <= 0) onExpired()
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [sectionBreak.endsAt, sectionBreak.remainingSeconds, onExpired])

  const progress = remainingSeconds / SECTION_BREAK_TOTAL_SECONDS

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#f0e4b8] bg-[#fff8e6] px-5 py-4 md:px-6">
      <p className="text-xl font-bold text-[#062357]">Section Break</p>
      <div className="flex min-w-[220px] flex-1 flex-col items-end gap-2 sm:max-w-md">
        <p className="text-sm font-semibold text-[#062357]">
          Starting next section in {formatBreakCountdown(remainingSeconds)}
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#dfe1e7]">
          <div
            className="h-full rounded-full bg-[#0d47a1] transition-[width] duration-300 ease-linear"
            style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        disabled={skipping}
        onClick={onSkip}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#0d47a1] hover:underline disabled:opacity-60"
      >
        {skipping ? "Skipping…" : "Skip Break"}
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </div>
  )
}

function prepTestHubPageTitle(prepTest: { label: string; prepTestNumber: string | null }): string {
  const fromNumber = prepTest.prepTestNumber?.trim()
  if (fromNumber) return `PrepTests ${fromNumber}`
  const fromLabel = /^PT\s*(\d+)/i.exec(prepTest.label)?.[1]
  if (fromLabel) return `PrepTests ${fromLabel}`
  return prepTest.label
}

function PrepTestHubStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex w-[78px] flex-col items-center">
      <dt className="text-xs font-medium leading-normal tracking-[0.24px] text-[#062357]">{label}</dt>
      <dd className="text-sm font-semibold leading-normal tracking-[0.28px] text-[#062357]">{value}</dd>
    </div>
  )
}

function PrepTestConfigCard({
  id,
  label,
  description,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  description: string
  value: string
  onChange: (next: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <div className="flex w-full max-w-[347px] flex-col gap-3 rounded-3xl border border-[#dfe1e7] bg-[#f6f8fa] p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
      <p className="text-xl font-bold leading-[1.35] text-[#062357]">{label}</p>
      <p className="text-sm font-normal leading-normal tracking-[0.28px] text-[#666d80]">{description}</p>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[52px] w-full appearance-none rounded-2xl border border-[#dfe1e7] bg-[#f5f9ff] px-3 pr-10 text-base font-normal tracking-[0.32px] text-[#062357] focus:outline-none focus:ring-2 focus:ring-[#0d47a1]/25"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[#666d80]"
          aria-hidden
        />
      </div>
    </div>
  )
}

function sectionShortTitle(row: PrepTestDetailSection): string {
  if (row.sectionNumber != null) return `Section ${row.sectionNumber}`
  if (row.title) return row.title
  return row.sectionType
}

function sectionTimeDisplay(minutes: number): string {
  return `${String(minutes).padStart(2, "0")}:00`
}

function sectionQuestionsLine(count: number): string {
  return count === 1 ? "1 Question" : `${count} Questions`
}

function PrepTestSectionRow({
  row,
  starting,
  onStart,
}: {
  row: PrepTestDetailSection
  starting: boolean
  onStart: () => void
}) {
  const breakLocked = row.onBreak
  const canContinueSection = Boolean(row.activeSectionSessionId)
  const showStartButton = row.practiceable && !row.completed && (row.unlocked || breakLocked)
  const activeSection = row.practiceable && row.unlocked && !row.completed

  return (
    <div className="flex h-[100px] items-center gap-6 rounded-2xl border border-[#dfe1e7] bg-white px-6 py-3 shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)]">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <p
          className={cn(
            "text-2xl font-bold leading-[1.3]",
            activeSection ? "text-[#0d47a1]" : "text-[#a4acb9]",
          )}
        >
          {sectionShortTitle(row)}
        </p>
        <div
          className={cn(
            "flex items-center gap-3 text-sm font-semibold leading-normal tracking-[0.28px]",
            activeSection ? "text-[#666d80]" : "text-[#a4acb9]",
          )}
        >
          <div className="flex items-center gap-2">
            <Timer className="size-4 shrink-0" aria-hidden />
            <span>{sectionTimeDisplay(row.timeMinutes)}</span>
          </div>
          <span className="h-3.5 w-px shrink-0 bg-[#dfe1e7]" aria-hidden />
          <span>{sectionQuestionsLine(row.questionCount)}</span>
        </div>
      </div>
      {showStartButton ? (
        <button
          type="button"
          disabled={breakLocked || starting}
          onClick={onStart}
          className={cn(
            "ds-btn h-[52px] min-w-[148px] shrink-0 gap-2 px-4 text-base tracking-[0.32px]",
            breakLocked && "cursor-not-allowed opacity-50",
          )}
        >
          {starting ? "Starting…" : canContinueSection ? "Continue Section" : "Start Section"}
          {!starting ? <ChevronRight className="size-5" aria-hidden /> : null}
        </button>
      ) : null}
    </div>
  )
}

function PracticePrepTestPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { testId: testIdParam } = useParams<{ testId: string }>()
  const isRetakeAttempt = isRetakePrepTestAttempt(searchParams)
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])

  const [detail, setDetail] = useState<PrepTestDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timingId, setTimingId] = useState("standard")
  const [formatId, setFormatId] = useState("four")
  const [startingSectionId, setStartingSectionId] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [completeModal, setCompleteModal] = useState<{
    rawScore: number
    questionCount: number
    scaledScore: number | null
    prepTestSessionId: string
  } | null>(null)
  const [scoreHidden, setScoreHidden] = useState(true)
  const [startingBlindReview, setStartingBlindReview] = useState(false)
  const [skippingBreak, setSkippingBreak] = useState(false)

  const load = useCallback(async () => {
    if (!testIdParam) return
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getPrepTestDetail(testIdParam)
      const normalized = normalizePrepTestDetail(data, { prepTestId: testIdParam })
      setDetail(normalized)
      setTimingId(normalized.defaultTimingId)
      setFormatId(normalized.defaultFormatId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PrepTest")
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [practiceApi, testIdParam])

  useEffect(() => {
    const stateRetake = (location.state as { retake?: boolean } | null)?.retake === true
    if (stateRetake && testIdParam && !isRetakeAttempt) {
      clearStoredSectionBreak(testIdParam)
      navigate(prepTestHubHref(testIdParam, { retake: true }), { replace: true, state: null })
    }
  }, [isRetakeAttempt, location.state, navigate, testIdParam])

  useEffect(() => {
    const justCompleted = (location.state as { sectionJustCompleted?: string } | null)?.sectionJustCompleted
    if (typeof justCompleted !== "string" || !testIdParam) return
    writeStoredSectionBreak(testIdParam, justCompleted)
    setDetail((prev) => (prev ? normalizePrepTestDetail(prev, { prepTestId: testIdParam }) : prev))
    navigate(prepTestHubHref(testIdParam, { retake: isRetakeAttempt }), { replace: true, state: null })
  }, [isRetakeAttempt, location.pathname, location.state, navigate, testIdParam])

  useEffect(() => {
    void load()
  }, [load])

  async function persistConfig(nextTiming = timingId, nextFormat = formatId) {
    if (!testIdParam) return
    try {
      const out = await practiceApi.startPrepTest({
        prepTestId: testIdParam,
        timing: nextTiming,
        format: nextFormat,
      })
      setDetail(normalizePrepTestDetail(out.detail, { prepTestId: testIdParam }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings")
    }
  }

  async function handleStartSection(sectionId: string) {
    setStartingSectionId(sectionId)
    setError(null)
    try {
      if (testIdParam) {
        await practiceApi.startPrepTest({ prepTestId: testIdParam, timing: timingId, format: formatId })
      }
      const out = await practiceApi.startSection({ sectionId, timing: "35", showAnswers: "end" })
      if (testIdParam) {
        navigate(
          sectionSessionHref(out.session.id, { prepTestId: testIdParam, retake: isRetakeAttempt }),
        )
        return
      }
      navigate(sectionSessionHref(out.session.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start section")
    } finally {
      setStartingSectionId(null)
    }
  }

  function openPrepTestSection(row: PrepTestDetailSection) {
    if (row.activeSectionSessionId && testIdParam) {
      if (row.answeredCount > 0) {
        navigate(
          sectionSessionHref(row.activeSectionSessionId, {
            prepTestId: testIdParam,
            retake: isRetakeAttempt,
            started: true,
          }),
        )
        return
      }
      navigate(
        sectionSessionHref(row.activeSectionSessionId, {
          prepTestId: testIdParam,
          retake: isRetakeAttempt,
        }),
      )
      return
    }
    if (row.activeSectionSessionId) {
      navigate(sectionSessionHref(row.activeSectionSessionId, { retake: isRetakeAttempt }))
      return
    }
    void handleStartSection(row.id)
  }

  async function completeSectionBreakAndStartNext(afterSectionRowId: string) {
    if (!testIdParam) return
    clearStoredSectionBreak(testIdParam)
    setError(null)
    try {
      const nextDetail = await practiceApi.getPrepTestDetail(testIdParam)
      const normalized = normalizePrepTestDetail(nextDetail, { prepTestId: testIdParam })
      setDetail(normalized)
      const nextSection = findNextSectionAfterBreak(normalized, afterSectionRowId)
      if (nextSection) {
        openPrepTestSection(nextSection)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to continue after section break")
    }
  }

  function handleBreakExpired() {
    if (!testIdParam) return
    clearStoredSectionBreak(testIdParam)
    void load()
  }

  async function handleFinishTest() {
    if (!testIdParam) return
    setFinishing(true)
    setError(null)
    try {
      const completed = await practiceApi.completePrepTest(testIdParam)
      const questionCount = detail?.prepTest.questionCount ?? 1
      setCompleteModal({
        rawScore: completed.raw_score ?? 0,
        questionCount: questionCount > 0 ? questionCount : 1,
        scaledScore: completed.scaled_score,
        prepTestSessionId: completed.id,
      })
      setScoreHidden(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete PrepTest")
    } finally {
      setFinishing(false)
    }
  }

  async function handleSkipSectionBreak() {
    if (!testIdParam || skippingBreak) return
    const afterSectionRowId = detail?.sectionBreak?.afterSectionId
    if (!afterSectionRowId) return
    setSkippingBreak(true)
    try {
      await completeSectionBreakAndStartNext(afterSectionRowId)
    } finally {
      setSkippingBreak(false)
    }
  }

  async function handleBlindReviewFromModal() {
    if (!testIdParam || startingBlindReview) return
    setStartingBlindReview(true)
    setError(null)
    try {
      await practiceApi.startBlindReview(testIdParam)
      const detail = await practiceApi.getBlindReviewDetail(testIdParam)
      const firstSessionId = firstBlindReviewSectionSessionId(detail)
      if (!firstSessionId) {
        throw new Error("No sections available for blind review")
      }
      setCompleteModal(null)
      navigate(blindReviewSectionSessionPath(testIdParam, firstSessionId), { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start blind review")
    } finally {
      setStartingBlindReview(false)
    }
  }

  function leaveToPrepTestList() {
    navigate("/app/practice/preptest", { replace: true })
  }

  async function viewPrepTestResults() {
    if (!testIdParam) return
    const resultsSessionId = completeModal?.prepTestSessionId
    if (!resultsSessionId) return
    await skipBlindReviewBestEffort(practiceApi, testIdParam)
    setCompleteModal(null)
    navigate(prepTestResultsPath(resultsSessionId), { replace: true })
  }

  if (!testIdParam) {
    return <Navigate to="/app/practice/preptest" replace />
  }

  if (loading) {
    return (
      <StudentMain>
        <StudentPageLoader centered label="Loading PrepTest…" />
      </StudentMain>
    )
  }

  if (!detail) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">{error ?? "PrepTest not found."}</p>
        <Link to="/app/practice/preptest" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to PrepTests
        </Link>
      </StudentMain>
    )
  }

  const { prepTest } = detail

  return (
    <>
      <StudentMain>
        <PrepTestDetailHeader
          navigate={navigate}
          pageTitle={prepTestHubPageTitle(prepTest)}
        />

        {error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <section className="rounded-3xl border border-[#dfe1e7] bg-white p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <p className="text-2xl font-bold leading-[1.3] text-[#062357]">Ready to begin your test?</p>
              <dl className="flex shrink-0 flex-wrap items-start gap-6 lg:justify-end">
                <PrepTestHubStat label="Questions" value={prepTest.questionCount} />
                <PrepTestHubStat label="Total Time" value={`${prepTest.totalMinutes} min`} />
                <PrepTestHubStat label="Sections" value={prepTest.practiceableSectionCount} />
              </dl>
            </div>

            <p className="text-2xl font-bold leading-[1.3] text-[#062357]">{prepTest.label}</p>

            <div className="flex flex-wrap gap-6">
              <PrepTestConfigCard
                id="preptest-timing"
                label="Timing"
                description="Control your Prep pace"
                value={timingId}
                onChange={(v) => {
                  setTimingId(v)
                  void persistConfig(v, formatId)
                }}
                options={detail.timingOptions}
              />
              <PrepTestConfigCard
                id="preptest-format"
                label="Format"
                description="Select Format"
                value={formatId}
                onChange={(v) => {
                  setFormatId(v)
                  void persistConfig(timingId, v)
                }}
                options={detail.formatOptions}
              />
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">Test Section</h2>
            {detail.allPracticeableSectionsComplete ? (
              <Button
                type="button"
                disabled={finishing}
                className="ds-btn-sm"
                onClick={() => void handleFinishTest()}
              >
                {finishing ? "Finishing…" : "Finish test"}
              </Button>
            ) : null}
          </div>
          <ul className="flex flex-col gap-6">
            {detail.sections.map((row) => (
              <li key={row.id} className="flex flex-col gap-3">
                <PrepTestSectionRow
                  row={row}
                  starting={startingSectionId === row.id}
                  onStart={() => openPrepTestSection(row)}
                />
                {detail.sectionBreak?.afterSectionId === row.id ? (
                  <SectionBreakRow
                    sectionBreak={detail.sectionBreak}
                    skipping={skippingBreak}
                    onSkip={() => void handleSkipSectionBreak()}
                    onExpired={handleBreakExpired}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </StudentMain>

      <PracticeCompleteModal
        open={completeModal != null}
        titleId="preptest-complete-title"
        subtitle={`You've completed ${prepTest.label}`}
        rawScore={completeModal?.rawScore ?? 0}
        questionCount={completeModal?.questionCount ?? 1}
        scaledScore={completeModal?.scaledScore}
        scoreHidden={scoreHidden}
        onToggleScoreHidden={() => setScoreHidden((h) => !h)}
        showBlindReview
        onBlindReview={() => void handleBlindReviewFromModal()}
        onSkipDetails={() => void viewPrepTestResults()}
        doneLabel="Done with PrepTest"
        onDone={leaveToPrepTestList}
      />
    </>
  )
}

function PrepTestDetailHeader({
  navigate,
  pageTitle,
}: {
  navigate: ReturnType<typeof useNavigate>
  pageTitle: string
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="!m-0 !text-[20px] !font-bold !leading-[1.35] text-[#062357]">{pageTitle}</h1>
      <button
        type="button"
        onClick={() => navigate("/app/practice/preptest")}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#666d80] transition-colors hover:bg-[#edf3ff] hover:text-[#062357]"
        aria-label={`Close ${pageTitle}`}
      >
        <X className="size-6" />
      </button>
    </div>
  )
}

export { PracticePrepTestPage }
