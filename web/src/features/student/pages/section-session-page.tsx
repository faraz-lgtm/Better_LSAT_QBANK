import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronDown, ChevronLeft, ChevronRight, Flag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import type { DrillQuestion } from "@/features/student/drills/drill-types"
import type { SectionSessionResponse } from "@/features/student/sections/section-types"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { PracticeQuestionStem } from "@/features/student/practice-session/practice-question-stem"
import { PracticeSessionHeader } from "@/features/student/practice-session/practice-session-header"
import {
  canChangePracticeAnswer,
  type PracticeToolMode,
} from "@/features/student/practice-session/practice-session-types"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import { PracticeCompleteModal } from "@/features/student/practice-session/practice-complete-modal"
import { parseFlaggedQuestionIds } from "@/features/student/practice-session/practice-question-flags"
import { usePracticeQuestionFlags } from "@/features/student/practice-session/use-practice-question-flags"
import { usePracticeQuestionSeen } from "@/features/student/practice-session/use-practice-question-seen"
import {
  computeElapsedTimerProgress,
  computeRemainingTimerProgress,
  resolveTimerBudgetSeconds,
  usePracticeSessionTimer,
} from "@/features/student/practice-session/use-practice-session-timer"
import { StudentMain } from "@/features/student/components/student-main"
import { createPracticeApi } from "@/lib/api/practice"
import { writeStoredSectionBreak } from "@/features/student/preptests/preptest-section-break"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const SECTION_TIMER_SECONDS = 35 * 60

function choiceIndexFromAnswer(choices: DrillQuestion["choices"], selectedAnswer: string): number | null {
  const letter = selectedAnswer.trim().toUpperCase()
  const byId = choices.findIndex((c) => c.id.toUpperCase() === letter)
  if (byId >= 0) return byId
  const idx = letter.charCodeAt(0) - 65
  if (idx >= 0 && idx < choices.length) return idx
  return null
}

function regionKey(questionId: string, part: string) {
  return `${questionId}:${part}`
}

type QuestionPanelProps = {
  question: DrillQuestion
  questionNumber: number
  findQuery: string
  selectedIndex: number | null
  revealed: boolean
  isCorrect: boolean | null
  submitting: boolean
  allowReselect: boolean
  getRegionHtml: (key: string, base: string) => string
  toolMode: PracticeToolMode
  onContentMouseUp: ReturnType<typeof usePracticeHighlights>["handleContentMouseUp"]
  onContentClick: ReturnType<typeof usePracticeHighlights>["handleContentClick"]
  onSelect: (index: number) => void
  flagged: boolean
  onToggleFlag: () => void
  flagsDisabled?: boolean
}

function SectionQuestionPanel({
  question,
  questionNumber,
  findQuery,
  selectedIndex,
  revealed,
  isCorrect,
  submitting,
  allowReselect,
  getRegionHtml,
  toolMode,
  onContentMouseUp,
  onContentClick,
  onSelect,
  flagged,
  onToggleFlag,
  flagsDisabled,
}: QuestionPanelProps) {
  const [hiddenChoices, setHiddenChoices] = useState<Record<number, boolean>>({})
  const stemKey = regionKey(question.id, "stem")
  const stemHtml = getRegionHtml(stemKey, question.stemText ?? "")

  return (
    <>
      <PracticeQuestionStem
        questionNumber={questionNumber}
        regionKey={stemKey}
        html={stemHtml}
        findQuery={findQuery}
        toolMode={toolMode}
        onContentMouseUp={onContentMouseUp}
        onContentClick={onContentClick}
        flagged={flagged}
        onToggleFlag={onToggleFlag}
        flagsDisabled={flagsDisabled}
      />
      {revealed && isCorrect != null ? (
        <p
          className="text-xs font-semibold"
          style={{ color: isCorrect ? "var(--color-student-accent)" : "#df1c41" }}
        >
          {isCorrect ? "Correct" : "Incorrect"}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        {question.choices.map((choice, index) => (
          <LrDrillOptionRow
            key={choice.id}
            index={index}
            html={getRegionHtml(regionKey(question.id, `choice-${choice.id}`), choice.text)}
            findQuery={findQuery}
            regionKey={regionKey(question.id, `choice-${choice.id}`)}
            selected={selectedIndex === index}
            hidden={Boolean(hiddenChoices[index])}
            disabled={submitting}
            selectedIndex={selectedIndex}
            allowReselect={allowReselect}
            onSelect={() => onSelect(index)}
            onToggleHidden={() =>
              setHiddenChoices((prev) => ({
                ...prev,
                [index]: !prev[index],
              }))
            }
            toolMode={toolMode}
            onContentMouseUp={onContentMouseUp}
            onContentClick={onContentClick}
          />
        ))}
      </div>
    </>
  )
}

function SectionSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const blindReviewMode = searchParams.get("blindReview") === "1"
  const blindReviewPrepTestId = searchParams.get("prepTestId")
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const sessionBodyRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sectionSession, setSectionSession] = useState<SectionSessionResponse | null>(null)
  const [qIndex, setQIndex] = useState(1)
  const [findQuery, setFindQuery] = useState("")
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<string, { selectedAnswer: string; isCorrect: boolean }>
  >({})
  const [submitting, setSubmitting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [completeModal, setCompleteModal] = useState<{
    rawScore: number
    questionCount: number
  } | null>(null)
  const [scoreHidden, setScoreHidden] = useState(true)

  const { elapsed, countdown, paused, togglePause, resetElapsed, setInitialCountdown } = usePracticeSessionTimer()
  const highlights = usePracticeHighlights()

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getSectionSession(sessionId)
      setSectionSession(data)
      setInitialCountdown(data.metadata.timing === "35" ? SECTION_TIMER_SECONDS : null)
      const map: Record<string, { selectedAnswer: string; isCorrect: boolean }> = {}
      for (const a of data.answers) {
        map[a.questionId] = { selectedAnswer: a.selectedAnswer, isCorrect: a.isCorrect }
      }
      setAnswersByQuestion(map)
      const firstUnanswered = data.questions.findIndex((q) => !map[q.id])
      setQIndex(firstUnanswered >= 0 ? firstUnanswered + 1 : 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load section")
    } finally {
      setLoading(false)
    }
  }, [practiceApi, sessionId, setInitialCountdown])

  useEffect(() => {
    void load()
  }, [load])

  const questions = sectionSession?.questions ?? []
  const metadata = sectionSession?.metadata
  const timedSection = metadata?.timing === "35"
  const showAnswersMode = metadata?.showAnswers ?? "end"
  const sectionType = metadata?.sectionType ?? "LR"
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions])
  const initialFlaggedIds = useMemo(
    () =>
      sectionSession?.metadata?.flaggedQuestionIds ??
      parseFlaggedQuestionIds(sectionSession?.session.metadata),
    [sectionSession?.metadata?.flaggedQuestionIds, sectionSession?.session.metadata],
  )
  const initialSeenIds = useMemo(
    () => sectionSession?.metadata?.seenQuestionIds ?? [],
    [sectionSession?.metadata?.seenQuestionIds],
  )
  const sessionCompleted = Boolean(sectionSession?.session.completed_at)
  const questionFlags = usePracticeQuestionFlags({
    sessionId: sessionId ?? "",
    questionIds,
    initialFlaggedIds,
    practiceApi,
    enabled: Boolean(sessionId) && !sessionCompleted && !blindReviewMode,
  })

  const safeIndex = Math.min(Math.max(qIndex, 1), Math.max(questions.length, 1))
  const current = questions[safeIndex - 1]

  usePracticeQuestionSeen({
    sessionId: sessionId ?? "",
    questionIds,
    initialSeenIds,
    activeQuestionId: current?.id ?? null,
    practiceApi,
    enabled: Boolean(sessionId) && !sessionCompleted && !blindReviewMode,
  })

  const currentAnswer = current ? answersByQuestion[current.id] : undefined
  const selectedIndex =
    current && currentAnswer
      ? choiceIndexFromAnswer(current.choices, currentAnswer.selectedAnswer)
      : null
  const revealed = blindReviewMode
    ? false
    : showAnswersMode === "each"
      ? Boolean(currentAnswer)
      : false

  const passageBody =
    sectionType === "RC" && current?.passage
      ? current.passage.body
      : current?.stimulusText ?? ""

  const passageKey = current ? regionKey(current.id, "passage") : ""
  const passageHtml = current ? highlights.getRegionHtml(passageKey, passageBody) : ""

  useEffect(() => {
    if (!findQuery.trim()) return
    const root = sessionBodyRef.current
    if (!root) return
    const mark = root.querySelector("mark.practice-find-mark")
    mark?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [findQuery, safeIndex, current?.id])

  async function handleSelectChoice(index: number) {
    if (!sessionId || !current || submitting) return
    if (!canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), { blindReview: blindReviewMode })) {
      return
    }
    if (selectedIndex === index) return
    const choice = current.choices[index]
    if (!choice) return

    const optimistic = { selectedAnswer: choice.id, isCorrect: false }
    setAnswersByQuestion((prev) => ({ ...prev, [current.id]: optimistic }))
    setSubmitting(true)

    try {
      const event = await practiceApi.submitAnswer({
        sessionId,
        questionId: current.id,
        selectedAnswer: choice.id,
        blindReview: blindReviewMode || undefined,
      })
      setAnswersByQuestion((prev) => ({
        ...prev,
        [current.id]: { selectedAnswer: event.selected_answer, isCorrect: event.is_correct },
      }))
      if (!blindReviewMode && showAnswersMode === "each") {
        window.setTimeout(() => {
          setQIndex((i) => Math.min(questions.length, i + 1))
        }, 600)
      }
    } catch (e) {
      if (!blindReviewMode) {
        setAnswersByQuestion((prev) => {
          const next = { ...prev }
          delete next[current.id]
          return next
        })
      }
      setError(e instanceof Error ? e.message : "Failed to submit answer")
    } finally {
      setSubmitting(false)
    }
  }

  function blindReviewExitPath(): string {
    if (blindReviewPrepTestId) {
      return `/app/practice/blind-review/${encodeURIComponent(blindReviewPrepTestId)}`
    }
    return "/app/practice/blind-review"
  }

  async function handleFinish() {
    if (!sessionId) return
    if (blindReviewMode) {
      navigate(blindReviewExitPath())
      return
    }
    setFinishing(true)
    try {
      const completed = await practiceApi.completeSession(sessionId)
      const prepTestId = sectionSession?.session.prep_test_id
      const sectionId = sectionSession?.session.section_id
      if (prepTestId && sectionId) {
        writeStoredSectionBreak(prepTestId, sectionId)
      }
      const questionCount = questions.length > 0 ? questions.length : 1
      const rawScore = completed.raw_score ?? 0
      setCompleteModal({ rawScore, questionCount })
      setScoreHidden(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete section")
    } finally {
      setFinishing(false)
    }
  }

  function leaveSectionSession() {
    const prepTestId = sectionSession?.session.prep_test_id
    const sectionId = sectionSession?.session.section_id
    if (prepTestId) {
      navigate(`/app/practice/preptest/${encodeURIComponent(prepTestId)}`, {
        replace: true,
        state:
          completeModal != null && sectionId
            ? { sectionJustCompleted: sectionId }
            : undefined,
      })
      return
    }
    navigate("/app/practice/sections", { replace: true })
  }

  function viewSectionResults() {
    if (!sessionId) return
    const prepTestId = sectionSession?.session.prep_test_id
    const returnTo = prepTestId
      ? `/app/practice/preptest/${encodeURIComponent(prepTestId)}`
      : "/app/practice/sections"
    navigate(
      `/app/practice/results/${encodeURIComponent(sessionId)}?returnTo=${encodeURIComponent(returnTo)}`,
      { replace: true },
    )
  }

  async function enterSectionBlindReview() {
    if (!sessionId) return
    setCompleteModal(null)
    setScoreHidden(true)
    const prepTestId = sectionSession?.session.prep_test_id
    if (prepTestId) {
      try {
        await practiceApi.startBlindReview(prepTestId)
      } catch {
        // PrepTest blind review may already be in progress.
      }
      const q = new URLSearchParams({ blindReview: "1", prepTestId })
      navigate(`/app/practice/sections/session/${encodeURIComponent(sessionId)}?${q.toString()}`, {
        replace: true,
      })
      return
    }
    const q = new URLSearchParams({ blindReview: "1" })
    navigate(`/app/practice/sections/session/${encodeURIComponent(sessionId)}?${q.toString()}`, {
      replace: true,
    })
  }

  if (!sessionId) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">Missing section session.</p>
        <Link to="/app/practice/sections" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to sections
        </Link>
      </StudentMain>
    )
  }

  if (loading) {
    return (
      <StudentMain>
        <p className="text-sm text-muted-foreground">Loading section…</p>
      </StudentMain>
    )
  }

  if (error && !sectionSession) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/app/practice/sections" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to sections
        </Link>
      </StudentMain>
    )
  }

  if (!current || questions.length === 0) {
    return (
      <StudentMain>
        <p className="text-sm text-muted-foreground">This section has no questions.</p>
        <Link to="/app/practice/sections" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to sections
        </Link>
      </StudentMain>
    )
  }

  const headerLabel =
    sectionSession?.sessionLabel ||
    [metadata?.prepTestTitle, metadata?.sectionTitle].filter(Boolean).join(" — ") ||
    (sectionType === "LR" ? "LR Section" : "RC Section")

  const timerBudgetSeconds = resolveTimerBudgetSeconds({
    timing: metadata?.timing,
    questionCount: questions.length,
    sectionTimerSeconds: timedSection ? SECTION_TIMER_SECONDS : undefined,
  })
  const timerLabel = timedSection && countdown != null ? "Remaining" : "Elapsed"
  const timerDisplaySeconds =
    timedSection && countdown != null ? countdown : elapsed
  const timerProgress =
    timedSection && countdown != null
      ? computeRemainingTimerProgress(countdown, timerBudgetSeconds)
      : computeElapsedTimerProgress(elapsed, timerBudgetSeconds)
  const allowReselect = canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), {
    blindReview: blindReviewMode,
  })

  const finishButton = (
    <Button
      type="button"
      disabled={finishing}
      variant="outline"
      size="default"
      className="h-[52px] shrink-0 gap-1 px-4"
      onClick={() => void handleFinish()}
    >
      {blindReviewMode ? "Back to blind review" : finishing ? "Finishing…" : "Finish"}
      <ChevronDown className="size-5 opacity-90" strokeWidth={2} />
    </Button>
  )

  return (
    <StudentMain className="flex min-h-0 max-w-none flex-1 flex-col overflow-hidden bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] px-0 py-4 md:py-5">
      <div
        className="mx-auto flex min-h-0 w-full flex-1 flex-col px-4 md:px-6"
        style={{ maxWidth: 1280 }}
      >
        {error ? (
          <p className="mb-3 shrink-0 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="practice-session-card flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#dfe1e7] bg-background shadow-[0px_1px_1.5px_rgba(13,13,18,0.05)]">
          <PracticeSessionHeader
            title={blindReviewMode ? `Blind review · ${headerLabel}` : headerLabel}
            findQuery={findQuery}
            onFindQueryChange={setFindQuery}
            activeColor={highlights.activeColor}
            toolMode={highlights.toolMode}
            fontScale={highlights.fontScale}
            boldEnabled={highlights.boldEnabled}
            italicEnabled={highlights.italicEnabled}
            onSelectColor={highlights.selectColor}
            onEraser={highlights.selectEraser}
            onUnderline={highlights.selectUnderline}
            onFontSize={highlights.cycleFontSize}
            onToggleBold={highlights.toggleBold}
            onToggleItalic={highlights.toggleItalic}
            timerLabel={timerLabel}
            timerDisplaySeconds={timerDisplaySeconds}
            timerPaused={paused}
            onToggleTimerPause={togglePause}
            onResetTimer={timedSection ? undefined : resetElapsed}
            timerProgress={timerProgress}
            timerDisplayClassName={
              timedSection && countdown === 0 ? "text-[#df1c41]" : undefined
            }
            finishButton={finishButton}
          />

          <div
            ref={sessionBodyRef}
            className="practice-session-body grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2 lg:divide-x divide-[#dfe1e7]"
            style={highlights.contentStyle}
          >
            <div className="practice-session-pane min-h-0 h-full overflow-y-auto overflow-x-hidden border-[#dfe1e7] p-5 border-b lg:border-b-0">
              {sectionType === "RC" && current.passage ? (
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{current.passage.title}</p>
              ) : null}
              <PracticeAnnotatedContent
                regionKey={passageKey}
                html={passageHtml}
                findQuery={findQuery}
                toolMode={highlights.toolMode}
                onMouseUp={highlights.handleContentMouseUp}
                onClickCapture={highlights.handleContentClick}
              />
            </div>
            <div className="practice-session-pane flex min-h-0 h-full flex-col gap-4 overflow-y-auto overflow-x-hidden border-[#dfe1e7] p-5">
              <SectionQuestionPanel
                key={current.id}
                question={current}
                questionNumber={safeIndex}
                findQuery={findQuery}
                selectedIndex={selectedIndex}
                revealed={revealed}
                isCorrect={currentAnswer?.isCorrect ?? null}
                submitting={submitting}
                allowReselect={allowReselect}
                getRegionHtml={highlights.getRegionHtml}
                toolMode={highlights.toolMode}
                onContentMouseUp={highlights.handleContentMouseUp}
                onContentClick={highlights.handleContentClick}
                onSelect={(index) => void handleSelectChoice(index)}
                flagged={current ? questionFlags.isFlagged(current.id) : false}
                onToggleFlag={() => current && questionFlags.toggleFlag(current.id)}
                flagsDisabled={sessionCompleted || blindReviewMode}
              />
            </div>
          </div>

          <footer className="practice-session-footer relative z-10 flex shrink-0 items-center justify-between gap-3 border-t border-[#dfe1e7] bg-background px-4 py-3 md:gap-4 md:px-6">
            <div className="practice-session-scroll-hidden flex min-h-0 min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden py-0.5 sm:gap-2">
              {questions.map((q, i) => {
                const n = i + 1
                const active = n === safeIndex
                const answered = Boolean(answersByQuestion[q.id])
                const flagged = questionFlags.isFlagged(q.id)
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQIndex(n)}
                    className="relative flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors sm:size-9 sm:text-xs"
                    style={{
                      backgroundColor: active
                        ? "var(--color-student-cta)"
                        : answered
                          ? "color-mix(in srgb, var(--color-student-cta) 25%, var(--greyscale-25))"
                          : "var(--greyscale-25)",
                      color: active ? "#fff" : "var(--color-student-heading)",
                      border: `1px solid ${active ? "var(--color-student-cta)" : "var(--greyscale-100)"}`,
                    }}
                    aria-current={active ? "true" : undefined}
                    aria-label={flagged ? `Question ${n}, flagged` : `Question ${n}`}
                  >
                    {n}
                    {flagged ? (
                      <Flag
                        className="absolute -right-0.5 -top-0.5 size-2.5 fill-[var(--color-student-cta)] text-[var(--color-student-cta)]"
                        strokeWidth={2}
                        aria-hidden
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full border bg-background transition hover:bg-muted disabled:opacity-40"
                style={{ borderColor: "var(--greyscale-100)" }}
                disabled={safeIndex <= 1}
                aria-label="Previous question"
                onClick={() => setQIndex((i) => Math.max(1, i - 1))}
              >
                <ChevronLeft className="size-5 text-muted-foreground" strokeWidth={2} />
              </button>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full border bg-background transition hover:bg-muted disabled:opacity-40"
                style={{ borderColor: "var(--greyscale-100)" }}
                disabled={safeIndex >= questions.length}
                aria-label="Next question"
                onClick={() => setQIndex((i) => Math.min(questions.length, i + 1))}
              >
                <ChevronRight className="size-5 text-muted-foreground" strokeWidth={2} />
              </button>
            </div>
          </footer>
        </div>
      </div>

      <PracticeCompleteModal
        open={completeModal != null}
        titleId="section-complete-title"
        subtitle="You've completed the section"
        rawScore={completeModal?.rawScore ?? 0}
        questionCount={completeModal?.questionCount ?? 1}
        scoreHidden={scoreHidden}
        onToggleScoreHidden={() => setScoreHidden((h) => !h)}
        showBlindReview
        onBlindReview={() => void enterSectionBlindReview()}
        onSkipDetails={viewSectionResults}
        onDone={leaveSectionSession}
      />
    </StudentMain>
  )
}

export { SectionSessionPage }
