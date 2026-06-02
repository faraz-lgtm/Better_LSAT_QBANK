import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import type { PrepTestDetailResponse, PrepTestDetailSection } from "@/features/student/preptests/preptest-types"
import { PracticeCompleteModal } from "@/features/student/practice-session/practice-complete-modal"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ChevronDown, Timer, X } from "lucide-react"

function ConfigSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-[#062357]">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[52px] w-full appearance-none rounded-2xl border border-[#dfe1e7] bg-[#f5f9ff] px-4 pr-11 text-base font-medium text-[#062357] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] focus:outline-none focus:ring-2 focus:ring-[#0d47a1]/25"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-[#666d80]"
          aria-hidden
        />
      </div>
    </div>
  )
}

function sectionShortTitle(row: PrepTestDetailSection): string {
  if (row.title) return row.title
  if (row.sectionNumber != null) return `Section ${row.sectionNumber}`
  return row.sectionType
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
  const active = row.practiceable && row.unlocked
  const progress =
    row.questionCount > 0 ? `${row.answeredCount}/${row.questionCount} questions` : "—"

  return (
    <div className="flex min-h-[100px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dfe1e7] bg-white px-5 py-4 shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)] md:px-6">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className={cn("text-2xl font-bold leading-[1.3]", active ? "text-[#0d47a1]" : "text-[#a4acb9]")}>
          {sectionShortTitle(row)}
        </p>
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 text-sm font-semibold leading-[1.5] tracking-[0.02em]",
            active ? "text-[#666d80]" : "text-[#a4acb9]",
          )}
        >
          <Timer className="size-4 shrink-0" aria-hidden />
          <span>{row.timeMinutes}:00</span>
          <span className="hidden h-3.5 w-px bg-[#dfe1e7] sm:block" aria-hidden />
          <span>{progress}</span>
          {row.completed ? <span className="text-[#287f6e]">Completed</span> : null}
          {!row.practiceable ? <span>Not available for practice</span> : null}
        </div>
      </div>
      {active ? (
        <button
          type="button"
          disabled={starting}
          onClick={onStart}
          className="inline-flex h-12 min-w-[148px] shrink-0 items-center justify-center rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] px-6 text-base font-semibold text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#0b3d82] disabled:opacity-60"
        >
          {starting ? "Starting…" : row.activeSectionSessionId ? "Continue section" : "Start section"}
        </button>
      ) : null}
    </div>
  )
}

function PracticePrepTestPage() {
  const navigate = useNavigate()
  const { testId: testIdParam } = useParams<{ testId: string }>()
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
  } | null>(null)
  const [scoreHidden, setScoreHidden] = useState(true)
  const [startingBlindReview, setStartingBlindReview] = useState(false)

  const load = useCallback(async () => {
    if (!testIdParam) return
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getPrepTestDetail(testIdParam)
      setDetail(data)
      setTimingId(data.defaultTimingId)
      setFormatId(data.defaultFormatId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PrepTest")
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [practiceApi, testIdParam])

  useEffect(() => {
    void load()
  }, [load])

  async function persistConfig() {
    if (!testIdParam) return
    try {
      const out = await practiceApi.startPrepTest({
        prepTestId: testIdParam,
        timing: timingId,
        format: formatId,
      })
      setDetail(out.detail)
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
      navigate(`/app/practice/sections/session/${out.session.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start section")
    } finally {
      setStartingSectionId(null)
    }
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
      })
      setScoreHidden(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete PrepTest")
    } finally {
      setFinishing(false)
    }
  }

  async function handleBlindReviewFromModal() {
    if (!testIdParam || startingBlindReview) return
    setStartingBlindReview(true)
    setError(null)
    try {
      await practiceApi.startBlindReview(testIdParam)
      navigate(`/app/practice/blind-review/${encodeURIComponent(testIdParam)}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start blind review")
    } finally {
      setStartingBlindReview(false)
    }
  }

  function leaveToPrepTestList() {
    navigate("/app/practice/preptest", { replace: true })
  }

  function viewPrepTestResults() {
    if (!testIdParam) return
    navigate(`/app/analytics/preptests/results/${encodeURIComponent(testIdParam)}`, { replace: true })
  }

  if (!testIdParam) {
    return <Navigate to="/app/practice/preptest" replace />
  }

  if (loading) {
    return (
      <StudentMain>
        <p className="text-sm text-[#666d80]">Loading PrepTest…</p>
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
      <StudentSubnavStrip
        crumbs={[
          { label: "Practice", href: "/app/practice/drills" },
          { label: "PrepTests", href: "/app/practice/preptest" },
          { label: prepTest.label },
        ]}
      />
      <StudentMain>
        <PrepTestDetailHeader navigate={navigate} prepTestLabel={prepTest.label} />

        {error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-[#f5f9ff] shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)]">
          <div className="border-b border-[#dfe1e7] bg-white/80 px-5 py-6 md:px-8 md:py-8">
            <h1 className="text-2xl font-bold leading-[1.25] text-[#062357] md:text-[28px]">Ready to begin your test?</h1>
            <p className="mt-6 text-3xl font-bold text-[#0d47a1] md:text-[32px]">{prepTest.label}</p>
            <dl className="mt-8 flex flex-wrap items-stretch gap-0 divide-x divide-[#dfe1e7]">
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 px-4 py-1 first:pl-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Questions</dt>
                <dd className="text-2xl font-bold text-[#062357]">{prepTest.questionCount}</dd>
              </div>
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 px-4 py-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Total time</dt>
                <dd className="text-2xl font-bold text-[#062357]">{prepTest.totalMinutes} min</dd>
              </div>
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 px-4 py-1 last:pr-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Sections</dt>
                <dd className="text-2xl font-bold text-[#062357]">{prepTest.practiceableSectionCount}</dd>
              </div>
            </dl>
          </div>
          <div className="grid gap-6 px-5 py-6 md:grid-cols-2 md:gap-8 md:px-8 md:py-8">
            <ConfigSelect
              id="preptest-timing"
              label="Timing"
              value={timingId}
              onChange={(v) => {
                setTimingId(v)
              }}
              options={detail.timingOptions}
            />
            <ConfigSelect
              id="preptest-format"
              label="Format"
              value={formatId}
              onChange={(v) => {
                setFormatId(v)
              }}
              options={detail.formatOptions}
            />
          </div>
          <div className="border-t border-[#dfe1e7] px-5 pb-6 md:px-8">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => void persistConfig()}>
              Save settings
            </Button>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#062357]">Test sections</h2>
            {detail.allPracticeableSectionsComplete ? (
              <Button
                type="button"
                disabled={finishing}
                className="rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0b3d82]"
                onClick={() => void handleFinishTest()}
              >
                {finishing ? "Finishing…" : "Finish test"}
              </Button>
            ) : null}
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {detail.sections.map((row) => (
              <li key={row.id}>
                <PrepTestSectionRow
                  row={row}
                  starting={startingSectionId === row.id}
                  onStart={() => {
                    if (row.activeSectionSessionId) {
                      navigate(`/app/practice/sections/session/${row.activeSectionSessionId}`)
                      return
                    }
                    void handleStartSection(row.id)
                  }}
                />
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
        onSkipDetails={viewPrepTestResults}
        doneLabel="Done with PrepTest"
        onDone={leaveToPrepTestList}
      />
    </>
  )
}

function PrepTestDetailHeader({
  navigate,
  prepTestLabel,
}: {
  navigate: ReturnType<typeof useNavigate>
  prepTestLabel: string
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <Link
        to="/app/practice/preptest"
        className="text-[20px] font-bold leading-[1.3] text-[#0d47a1] transition-colors hover:underline"
      >
        PrepTests
      </Link>
      <button
        type="button"
        onClick={() => navigate("/app/practice/preptest")}
        className="inline-flex size-10 items-center justify-center rounded-xl text-[#666d80] transition-colors hover:bg-[#e8eef9] hover:text-[#062357]"
        aria-label={`Close ${prepTestLabel}`}
      >
        <X className="size-6" />
      </button>
    </div>
  )
}

export { PracticePrepTestPage }
