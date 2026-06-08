import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { ChevronRight } from "lucide-react"
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"
import { PracticeSectionIntroHeader } from "@/features/student/practice-session/practice-section-intro-header"
import {
  computeRemainingTimerProgress,
  resolveTimerBudgetSeconds,
  usePracticeSessionTimer,
} from "@/features/student/practice-session/use-practice-session-timer"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import {
  formatSectionTimeMinutes,
  sectionIntroDirections,
  sectionIntroTitle,
} from "@/features/student/sections/section-intro-directions"
import type { SectionSessionResponse } from "@/features/student/sections/section-types"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const SECTION_TIMER_SECONDS = 35 * 60

function SectionIntroOverlay({ children }: { children: ReactNode }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex min-h-0 flex-col overflow-hidden bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="PrepTest section introduction"
    >
      <p className="shrink-0 px-6 pt-5 text-sm font-medium tracking-[0.02em] text-[#a4acb9] md:px-10 md:pt-6">
        PrepTest - Question
      </p>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-8 pt-2 md:px-10 md:pb-10">
        {children}
      </div>
    </div>,
    document.body,
  )
}

function prepTestHeaderLabel(moduleId: string | null, prepTestTitle: string | null): string {
  const match = moduleId?.match(/^LSAC(\d+)$/i)
  if (match) return `PT${match[1]}`
  const trimmed = prepTestTitle?.trim()
  if (trimmed) return trimmed.replace(/^PrepTest\s*/i, "PT")
  return "PrepTest"
}

function PracticePrepTestSectionPage() {
  const { testId, sectionId } = useParams<{ testId: string; sectionId: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("sessionId")
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sectionSession, setSectionSession] = useState<SectionSessionResponse | null>(null)

  const highlights = usePracticeHighlights()
  const { countdown, paused, togglePause, setInitialCountdown } = usePracticeSessionTimer()

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getSectionSession(sessionId)
      setSectionSession(data)
      setInitialCountdown(data.metadata.timing === "35" ? SECTION_TIMER_SECONDS : null)
      if (data.answers.length > 0) {
        const prepTestId = testId ?? data.session.prep_test_id ?? data.section.prepTestId
        const sessionPath = `/app/practice/sections/session/${encodeURIComponent(sessionId)}`
        navigate(
          prepTestId
            ? `${sessionPath}?prepTestId=${encodeURIComponent(prepTestId)}&started=1`
            : `${sessionPath}?started=1`,
          { replace: true },
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load section")
      setSectionSession(null)
    } finally {
      setLoading(false)
    }
  }, [navigate, practiceApi, sessionId, setInitialCountdown, testId])

  useEffect(() => {
    void load()
  }, [load])

  const prepTestId = testId ?? sectionSession?.session.prep_test_id ?? sectionSession?.section.prepTestId ?? null
  const sectionType = sectionSession?.metadata.sectionType ?? "LR"
  const sectionNumber = sectionSession?.section.sectionNumber ?? null
  const questionCount = sectionSession?.questions.length ?? 0
  const timeMinutes = sectionSession?.section.timeMinutes ?? 35
  const headerLabel = prepTestHeaderLabel(
    sectionSession?.section.moduleId ?? null,
    sectionSession?.section.prepTestTitle ?? null,
  )

  const timerBudgetSeconds = resolveTimerBudgetSeconds({
    timing: sectionSession?.metadata.timing,
    questionCount,
    sectionTimerSeconds: sectionSession?.metadata.timing === "35" ? SECTION_TIMER_SECONDS : undefined,
  })
  const timedSection = sectionSession?.metadata.timing === "35"
  const timerLabel = timedSection && countdown != null ? "Time Left" : "Elapsed"
  const timerDisplaySeconds = timedSection && countdown != null ? countdown : 0
  const timerProgress =
    timedSection && countdown != null
      ? computeRemainingTimerProgress(countdown, timerBudgetSeconds)
      : 0

  function handleExitSession() {
    if (prepTestId) {
      navigate(`/app/practice/preptest/${encodeURIComponent(prepTestId)}`, { replace: true })
      return
    }
    navigate("/app/practice/sections", { replace: true })
  }

  function handleGoToQuestions() {
    if (!sessionId) return
    const sessionPath = `/app/practice/sections/session/${encodeURIComponent(sessionId)}`
    navigate(
      prepTestId
        ? `${sessionPath}?prepTestId=${encodeURIComponent(prepTestId)}&started=1`
        : `${sessionPath}?started=1`,
    )
  }

  if (!testId || !sectionId) {
    return <Navigate to="/app/practice/preptest" replace />
  }

  if (!sessionId) {
    return <Navigate to={`/app/practice/preptest/${encodeURIComponent(testId)}`} replace />
  }

  if (loading) {
    return (
      <SectionIntroOverlay>
        <p className="text-sm font-medium text-white/90">Loading section…</p>
      </SectionIntroOverlay>
    )
  }

  if (error || !sectionSession) {
    return (
      <SectionIntroOverlay>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-10">
          <p className="text-sm text-red-600" role="alert">
            {error ?? "Section not found"}
          </p>
          <Button type="button" variant="outline" onClick={() => navigate(`/app/practice/preptest/${testId}`)}>
            Back to PrepTest
          </Button>
        </div>
      </SectionIntroOverlay>
    )
  }

  return (
    <SectionIntroOverlay>
      <div className="flex max-h-[min(680px,calc(100svh-5rem))] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_24px_64px_rgba(13,13,18,0.22)]">
        <PracticeSectionIntroHeader
          title={headerLabel}
          fontScale={highlights.fontScale}
          toolMode={highlights.toolMode}
          onFontSize={highlights.cycleFontSize}
          onLineSpacing={highlights.cycleLineSpacing}
          onUnderline={highlights.selectUnderline}
          timerLabel={timerLabel}
          timerDisplaySeconds={timerDisplaySeconds}
          timerPaused={paused}
          onToggleTimerPause={togglePause}
          timerProgress={timerProgress}
          finishButton={
            <PracticeSessionFinishMenu
              exitOnly
              onSubmitSection={() => {}}
              onExit={handleExitSession}
            />
          }
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white px-8 py-8 md:px-12 md:py-10">
          <h2 className="text-[26px] font-bold leading-[1.3] text-[#0d47a1] md:text-[28px]">
            {sectionIntroTitle(sectionNumber, sectionType)}
          </h2>
          <div className="mt-3 flex items-center justify-between gap-4 text-sm font-semibold tracking-[0.02em] text-[#0d47a1]">
            <span>
              {questionCount} question{questionCount === 1 ? "" : "s"}
            </span>
            <span>Time: {formatSectionTimeMinutes(timeMinutes)}</span>
          </div>
          <p className="mt-8 text-sm leading-7 text-[#36394a]">
            <span className="font-bold text-[#062357]">Directions: </span>
            {sectionIntroDirections(sectionType)}
          </p>
          <div className="mt-auto flex justify-end pt-10">
            <Button
              type="button"
              className="ds-btn-sm gap-1 px-6 text-sm"
              onClick={handleGoToQuestions}
            >
              Go to Question
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </SectionIntroOverlay>
  )
}

export { PracticePrepTestSectionPage }
