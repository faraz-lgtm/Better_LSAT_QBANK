import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { useStudentPageBreadcrumbTail } from "@/features/app-shell/student-page-header-slot"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { DrillConfigSelectField } from "@/features/student/drills/drill-config-field"
import {
  mapPrepTestTimingToSectionTiming,
  type PrepTestDetailResponse,
  type PrepTestDetailSection,
  type PrepTestSectionBreak,
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
  clearStoredPrepTestConfigLock,
  findNextSectionAfterBreak,
  isPrepTestConfigLocked,
  normalizePrepTestDetail,
  readStoredSectionBreak,
  resolvePrepTestConfigLocked,
  resolvePrepTestSectionBreakSeconds,
  writeStoredPrepTestConfigLock,
  writeStoredSectionBreak,
} from "@/features/student/preptests/preptest-section-break"
import {
  isRetakePrepTestAttempt,
  prepTestHubHref,
  PREPTEST_LIST_HREF,
  sectionSessionHref,
} from "@/features/student/preptests/preptest-hub-navigation"
import { useAccommodations, remapPrepTestTimingOptionLabel } from "@/features/student/accommodations/accommodations-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ChevronRight, Timer, X } from "lucide-react"

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

  const totalSeconds = Math.max(1, sectionBreak.durationSeconds)
  const progress = remainingSeconds / totalSeconds

  return (
    <div className="flex h-[100px] items-center gap-6 rounded-[16px] border border-[#ffe5b7] bg-[#fff6e0] px-6 py-3 shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)]">
      <div className="flex min-w-0 flex-1 items-center">
        <p className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">Section Break</p>
      </div>
      <div className="flex w-full max-w-[398px] shrink-0 flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <p className="min-w-0 flex-1 text-sm font-medium leading-normal tracking-[0.28px] text-[var(--color-student-heading)]">
            Starting next section in {formatBreakCountdown(remainingSeconds)}
          </p>
          <button
            type="button"
            disabled={skipping}
            onClick={onSkip}
            className="inline-flex shrink-0 items-center gap-0 text-sm font-semibold tracking-[0.28px] text-[var(--primary)] hover:underline disabled:opacity-60"
          >
            {skipping ? "Skipping…" : "Skip Break"}
            <ChevronRight className="size-6" aria-hidden />
          </button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-lg bg-[var(--greyscale-100)]">
          <div
            className="h-full rounded-l-lg bg-[var(--primary)] transition-[width] duration-300 ease-linear"
            style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function prepTestContinueHeadline(prepTest: { label: string; prepTestNumber: string | null }): string {
  const fromLabel = prepTest.label.trim()
  if (/^PT\s*\d+/i.test(fromLabel)) return `Continue your ${fromLabel} test`
  const fromNumber = prepTest.prepTestNumber?.trim()
  if (fromNumber) return `Continue your PT ${fromNumber} test`
  return `Continue your ${fromLabel} test`
}

function prepTestHubPageTitle(prepTest: { label: string; prepTestNumber: string | null }): string {
  const fromNumber = prepTest.prepTestNumber?.trim()
  if (fromNumber) return `PrepTests ${fromNumber}`
  const fromLabel = /^PT\s*(\d+)/i.exec(prepTest.label)?.[1]
  if (fromLabel) return `PrepTests ${fromLabel}`
  return prepTest.label
}

function sectionShortTitle(row: PrepTestDetailSection): string {
  if (row.sectionNumber != null) return `Section ${row.sectionNumber}`
  return row.title ? row.title : row.sectionType
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
  timingId,
  onStart,
}: {
  row: PrepTestDetailSection
  starting: boolean
  timingId: string
  onStart: () => void
}) {
  const { scaleFactor } = useAccommodations()
  const unlimited = timingId === "unlimited"
  const displayMinutes = Math.max(1, Math.round((row.timeMinutes > 0 ? row.timeMinutes : 35) * scaleFactor))
  const breakLocked = row.onBreak
  const canContinueSection = Boolean(row.activeSectionSessionId)
  const showStartButton = row.practiceable && !row.completed && (row.unlocked || breakLocked)
  const activeSection = row.practiceable && row.unlocked && !row.completed

  return (
    <div className="flex h-[100px] items-center gap-6 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-3 shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)]">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <p
          className={cn(
            "text-2xl font-bold leading-[1.3]",
            activeSection ? "text-[var(--primary)]" : "text-[var(--greyscale-300)]",
          )}
        >
          {sectionShortTitle(row)}
        </p>
        <div
          className={cn(
            "flex items-center gap-3 text-sm font-semibold leading-normal tracking-[0.28px]",
            activeSection ? "text-[var(--greyscale-500)]" : "text-[var(--greyscale-300)]",
          )}
        >
          <div className="flex items-center gap-2">
            <Timer className="size-4 shrink-0" aria-hidden />
            <span>{unlimited ? "Unlimited" : sectionTimeDisplay(displayMinutes)}</span>
          </div>
          <span className="h-3.5 w-px shrink-0 bg-[var(--greyscale-100)]" aria-hidden />
          <span>{sectionQuestionsLine(row.questionCount)}</span>
        </div>
      </div>
      {showStartButton ? (
        <button
          type="button"
          disabled={breakLocked || starting}
          onClick={onStart}
          className={cn(
            "ds-btn h-[52px] min-w-[148px] shrink-0 gap-2 rounded-[16px] px-4 text-base tracking-[0.32px]",
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
  const { scaleFactor } = useAccommodations()

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

  const timingSelectOptions = useMemo(
    () =>
      (detail?.timingOptions ?? []).map((o) => ({
        value: o.id,
        label: remapPrepTestTimingOptionLabel(o.id, o.label, scaleFactor),
      })),
    [detail?.timingOptions, scaleFactor],
  )

  const breadcrumbTitle = detail ? prepTestHubPageTitle(detail.prepTest) : null
  useStudentPageBreadcrumbTail(breadcrumbTitle)

  const load = useCallback(async () => {
    if (!testIdParam) return
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getPrepTestDetail(testIdParam)
      if (data.prepTest.id && data.prepTest.id !== testIdParam) {
        navigate(prepTestHubHref(data.prepTest.id, { retake: isRetakeAttempt }), { replace: true })
        return
      }
      const normalized = normalizePrepTestDetail(data, { prepTestId: testIdParam })
      setDetail(normalized)
      setTimingId(normalized.defaultTimingId)
      setFormatId(normalized.defaultFormatId)
      if (isRetakeAttempt && !isPrepTestConfigLocked(normalized)) {
        clearStoredPrepTestConfigLock(testIdParam)
      } else {
        resolvePrepTestConfigLocked(normalized, testIdParam)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PrepTest")
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [isRetakeAttempt, navigate, practiceApi, testIdParam])

  useEffect(() => {
    const stateRetake = (location.state as { retake?: boolean } | null)?.retake === true
    if (stateRetake && testIdParam && !isRetakeAttempt) {
      clearStoredSectionBreak(testIdParam)
      clearStoredPrepTestConfigLock(testIdParam)
      navigate(prepTestHubHref(testIdParam, { retake: true }), { replace: true, state: null })
    }
  }, [isRetakeAttempt, location.state, navigate, testIdParam])

  useEffect(() => {
    const justCompleted = (location.state as { sectionJustCompleted?: string } | null)?.sectionJustCompleted
    if (typeof justCompleted !== "string" || !testIdParam) return
    // Section session usually writes the break first with the correct duration — don't reset it.
    const existing = readStoredSectionBreak(testIdParam)
    if (!existing || existing.afterSectionId !== justCompleted) {
      const durationSeconds = detail
        ? resolvePrepTestSectionBreakSeconds(detail, justCompleted)
        : undefined
      writeStoredSectionBreak(testIdParam, justCompleted, durationSeconds)
    }
    writeStoredPrepTestConfigLock(testIdParam)
    void load()
    navigate(prepTestHubHref(testIdParam, { retake: isRetakeAttempt }), { replace: true, state: null })
  }, [detail, isRetakeAttempt, load, location.pathname, location.state, navigate, testIdParam])

  useEffect(() => {
    void load()
  }, [load, location.key])

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
      const out = await practiceApi.startSection({
        sectionId,
        timing: mapPrepTestTimingToSectionTiming(timingId),
        showAnswers: "end",
      })
      if (testIdParam) {
        writeStoredPrepTestConfigLock(testIdParam)
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
    navigate(PREPTEST_LIST_HREF, { replace: true })
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
    return <Navigate to={PREPTEST_LIST_HREF} replace />
  }

  if (loading) {
    return (
      <StudentMain>
        <StudentPageLoader centered className="min-h-[min(480px,70vh)]" label="Loading PrepTest…" />
      </StudentMain>
    )
  }

  if (!detail) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">{error ?? "PrepTest not found."}</p>
        <Link to={PREPTEST_LIST_HREF} className="mt-2 text-sm font-semibold text-[var(--primary)] hover:underline">
          Back to PrepTests
        </Link>
      </StudentMain>
    )
  }

  const { prepTest } = detail
  const configLocked = resolvePrepTestConfigLocked(detail, testIdParam)

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

        <section className="rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
          <div className="flex flex-col gap-6">
            <p className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">
              {configLocked ? prepTestContinueHeadline(prepTest) : "Ready to begin your test?"}
            </p>

            {!configLocked ? (
              <>
                <p className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">{prepTest.label}</p>

                <div className="flex flex-wrap gap-6">
                  <DrillConfigSelectField
                    className="w-full max-w-[347px]"
                    label="Timing"
                    description="Control your Prep pace"
                    value={timingId}
                    onChange={(v) => {
                      setTimingId(v)
                      void persistConfig(v, formatId)
                    }}
                    options={timingSelectOptions}
                  />
                  <DrillConfigSelectField
                    className="w-full max-w-[347px]"
                    label="Format"
                    description="Select Format"
                    value={formatId}
                    onChange={(v) => {
                      setFormatId(v)
                      void persistConfig(timingId, v)
                    }}
                    options={detail.formatOptions.map((o) => ({ value: o.id, label: o.label }))}
                  />
                </div>
              </>
            ) : null}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">Test Section</h2>
            {detail.allPracticeableSectionsComplete ? (
              <Button
                type="button"
                disabled={finishing}
                className="ds-btn-sm rounded-[16px]"
                onClick={() => void handleFinishTest()}
              >
                {finishing ? "Finishing…" : "Finish test"}
              </Button>
            ) : null}
          </div>
          <ul className="flex flex-col gap-6">
            {detail.sections.flatMap((row) => {
              const items = [
                <li key={row.id}>
                  <PrepTestSectionRow
                    row={row}
                    starting={startingSectionId === row.id}
                    timingId={timingId}
                    onStart={() => openPrepTestSection(row)}
                  />
                </li>,
              ]

              if (detail.sectionBreak?.afterSectionId === row.id) {
                items.push(
                  <li key={`${row.id}-break`}>
                    <SectionBreakRow
                      sectionBreak={detail.sectionBreak}
                      skipping={skippingBreak}
                      onSkip={() => void handleSkipSectionBreak()}
                      onExpired={handleBreakExpired}
                    />
                  </li>,
                )
              }

              return items
            })}
          </ul>
        </section>
      </StudentMain>

      <PracticeCompleteModal
        open={completeModal != null}
        titleId="preptest-complete-title"
        title="PrepTest Done!"
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
      <h1 className="!m-0 !text-[20px] !font-bold !leading-[1.35] text-[var(--color-student-heading)]">{pageTitle}</h1>
      <button
        type="button"
        onClick={() => navigate(PREPTEST_LIST_HREF)}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--greyscale-500)] transition-colors hover:bg-[var(--primary-25)] hover:text-[var(--color-student-heading)]"
        aria-label={`Close ${pageTitle}`}
      >
        <X className="size-6" />
      </button>
    </div>
  )
}

export { PracticePrepTestPage }
