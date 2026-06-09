import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import type { DrillQuestion, DrillSessionResponse } from "@/features/student/drills/drill-types"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { PracticeQuestionStem } from "@/features/student/practice-session/practice-question-stem"
import { PracticeSessionHeader } from "@/features/student/practice-session/practice-session-header"
import {
  canChangePracticeAnswer,
  type PracticeToolMode,
} from "@/features/student/practice-session/practice-session-types"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import { PracticeCompleteModal } from "@/features/student/practice-session/practice-complete-modal"
import { PracticeSessionQuestionNavButton } from "@/features/student/practice-session/practice-session-question-nav-button"
import { parseFlaggedQuestionIds } from "@/features/student/practice-session/practice-question-flags"
import { usePracticeQuestionFlags } from "@/features/student/practice-session/use-practice-question-flags"
import {
  computeElapsedTimerProgress,
  resolveTimerBudgetSeconds,
  usePracticeSessionTimer,
} from "@/features/student/practice-session/use-practice-session-timer"
import { StudentMain } from "@/features/student/components/student-main"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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

function DrillQuestionPanel({
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

function DrillSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const returnTo = searchParams.get("returnTo")?.trim() ?? ""
  const sessionBodyRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drill, setDrill] = useState<DrillSessionResponse | null>(null)
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
  const [reviewAfterComplete, setReviewAfterComplete] = useState(false)

  const { elapsed, paused, togglePause, resetElapsed } = usePracticeSessionTimer()
  const highlights = usePracticeHighlights()

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getDrillSession(sessionId)
      setDrill(data)
      const map: Record<string, { selectedAnswer: string; isCorrect: boolean }> = {}
      for (const a of data.answers) {
        map[a.questionId] = { selectedAnswer: a.selectedAnswer, isCorrect: a.isCorrect }
      }
      setAnswersByQuestion(map)
      const firstUnanswered = data.questions.findIndex((q) => !map[q.id])
      setQIndex(firstUnanswered >= 0 ? firstUnanswered + 1 : 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load drill")
    } finally {
      setLoading(false)
    }
  }, [practiceApi, sessionId])

  useEffect(() => {
    void load()
  }, [load])

  const questions = drill?.questions ?? []
  const metadata = drill?.metadata
  const showAnswersMode = metadata?.showAnswers ?? "end"
  const sectionType = metadata?.sectionType ?? "LR"
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions])
  const initialFlaggedIds = useMemo(
    () =>
      drill?.metadata?.flaggedQuestionIds ??
      parseFlaggedQuestionIds(drill?.session.metadata),
    [drill?.metadata?.flaggedQuestionIds, drill?.session.metadata],
  )
  const sessionCompleted = Boolean(drill?.session.completed_at)
  const questionFlags = usePracticeQuestionFlags({
    sessionId: sessionId ?? "",
    questionIds,
    initialFlaggedIds,
    practiceApi,
    enabled: Boolean(sessionId) && !sessionCompleted,
  })

  const safeIndex = Math.min(Math.max(qIndex, 1), Math.max(questions.length, 1))
  const current = questions[safeIndex - 1]
  const currentAnswer = current ? answersByQuestion[current.id] : undefined
  const selectedIndex =
    current && currentAnswer
      ? choiceIndexFromAnswer(current.choices, currentAnswer.selectedAnswer)
      : null
  const revealed = reviewAfterComplete
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
    if (!canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), { blindReview: reviewAfterComplete })) {
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
        blindReview: reviewAfterComplete || undefined,
      })
      setAnswersByQuestion((prev) => ({
        ...prev,
        [current.id]: { selectedAnswer: event.selected_answer, isCorrect: event.is_correct },
      }))
      if (showAnswersMode === "each" && !reviewAfterComplete) {
        window.setTimeout(() => {
          setQIndex((i) => Math.min(questions.length, i + 1))
        }, 600)
      }
    } catch (e) {
      setAnswersByQuestion((prev) => {
        const next = { ...prev }
        delete next[current.id]
        return next
      })
      setError(e instanceof Error ? e.message : "Failed to submit answer")
    } finally {
      setSubmitting(false)
    }
  }

  function resolveReturnPath(): string {
    if (returnTo.startsWith("/app/")) return returnTo
    const meta = drill?.session.metadata
    if (
      meta &&
      typeof meta === "object" &&
      (meta.source === "prep_course_active_drill" || meta.source === "prep_course_adaptive_drill")
    ) {
      const lessonId = typeof meta.lessonId === "string" ? meta.lessonId : ""
      if (lessonId) {
        return returnTo || "/app/prep-course"
      }
    }
    return ""
  }

  function leaveDrillSession() {
    const path = resolveReturnPath()
    if (path) {
      navigate(path, { replace: true })
      return
    }
    navigate("/app/practice/drills", { replace: true })
  }

  function viewDrillResults() {
    if (!sessionId) return
    const path = resolveReturnPath()
    if (path.startsWith("/app/prep-course/")) {
      navigate(path, { replace: true })
      return
    }
    const params = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
    navigate(`/app/practice/results/${encodeURIComponent(sessionId)}${params}`, { replace: true })
  }

  async function handleFinish() {
    if (!sessionId) return
    setFinishing(true)
    try {
      const completed = await practiceApi.completeSession(sessionId)
      const questionCount = questions.length > 0 ? questions.length : 1
      const rawScore = completed.raw_score ?? 0
      setCompleteModal({ rawScore, questionCount })
      setScoreHidden(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete drill")
    } finally {
      setFinishing(false)
    }
  }

  if (!sessionId) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">Missing drill session.</p>
        <Link to="/app/practice/drills" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to drills
        </Link>
      </StudentMain>
    )
  }

  if (loading) {
    return (
      <StudentMain>
        <p className="text-sm text-muted-foreground">Loading drill…</p>
      </StudentMain>
    )
  }

  if (error && !drill) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/app/practice/drills" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to drills
        </Link>
      </StudentMain>
    )
  }

  if (!current || questions.length === 0) {
    return (
      <StudentMain>
        <p className="text-sm text-muted-foreground">This drill has no questions.</p>
        <Link to="/app/practice/drills" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to drills
        </Link>
      </StudentMain>
    )
  }

  const headerLabel = drill?.drillLabel ?? metadata?.title ?? (sectionType === "LR" ? "LR Drill" : "RC Drill")
  const isPrepCourseDrill = Boolean(resolveReturnPath())
  const timerBudgetSeconds = resolveTimerBudgetSeconds({
    timing: metadata?.timing,
    questionCount: questions.length,
  })
  const timerProgress = computeElapsedTimerProgress(elapsed, timerBudgetSeconds)
  const allowReselect = canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), {
    blindReview: reviewAfterComplete,
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
      {finishing ? "Finishing…" : "Finish"}
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
            title={reviewAfterComplete ? `Blind review · ${headerLabel}` : headerLabel}
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
            timerDisplaySeconds={elapsed}
            timerPaused={paused}
            onToggleTimerPause={togglePause}
            onResetTimer={resetElapsed}
            timerProgress={timerProgress}
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
              <DrillQuestionPanel
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
                flagsDisabled={sessionCompleted}
              />
            </div>
          </div>

          <footer className="practice-session-footer relative z-10 flex shrink-0 items-center justify-between gap-3 border-t border-[#dfe1e7] bg-background px-4 py-3 md:gap-4 md:px-6">
            <div className="practice-session-scroll-hidden flex min-h-0 min-w-0 flex-1 flex-nowrap items-stretch gap-1.5 overflow-x-auto overflow-y-hidden pb-0.5 pt-2.5 sm:gap-2">
              {questions.map((q, i) => {
                const n = i + 1
                return (
                  <PracticeSessionQuestionNavButton
                    key={q.id}
                    number={n}
                    active={n === safeIndex}
                    answered={Boolean(answersByQuestion[q.id])}
                    flagged={questionFlags.isFlagged(q.id)}
                    onClick={() => setQIndex(n)}
                  />
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
        titleId="drill-complete-title"
        subtitle={
          isPrepCourseDrill ? "You've completed the active drill" : "You've completed the drill"
        }
        rawScore={completeModal?.rawScore ?? 0}
        questionCount={completeModal?.questionCount ?? 1}
        scoreHidden={scoreHidden}
        onToggleScoreHidden={() => setScoreHidden((h) => !h)}
        showBlindReview
        onBlindReview={() => {
          setCompleteModal(null)
          setReviewAfterComplete(true)
          setScoreHidden(true)
          setQIndex(1)
        }}
        onSkipDetails={viewDrillResults}
        onDone={leaveDrillSession}
      />
    </StudentMain>
  )
}

export { DrillSessionPage }
