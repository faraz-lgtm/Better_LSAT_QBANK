import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronDown, ChevronLeft, ChevronRight, Flag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import type { DrillQuestion } from "@/features/student/drills/drill-types"
import type { SectionSessionResponse } from "@/features/student/sections/section-types"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { PracticeSessionHeader } from "@/features/student/practice-session/practice-session-header"
import {
  canChangePracticeAnswer,
  type PracticeToolMode,
} from "@/features/student/practice-session/practice-session-types"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import { PracticeCompleteModal } from "@/features/student/practice-session/practice-complete-modal"
import { parseFlaggedQuestionIds } from "@/features/student/practice-session/practice-question-flags"
import { PracticeQuestionFlagButton } from "@/features/student/practice-session/practice-question-flag-button"
import { usePracticeQuestionFlags } from "@/features/student/practice-session/use-practice-question-flags"
import { usePracticeQuestionSeen } from "@/features/student/practice-session/use-practice-question-seen"
import { usePracticeSessionTimer } from "@/features/student/practice-session/use-practice-session-timer"
import { StudentMain } from "@/features/student/components/student-main"
import { createPracticeApi } from "@/lib/api/practice"
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
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <span
            className="text-sm font-semibold leading-snug"
            style={{ color: "var(--color-student-cta)" }}
          >
            {questionNumber}.
          </span>
          <PracticeAnnotatedContent
            regionKey={stemKey}
            html={stemHtml}
            findQuery={findQuery}
            scrollAnchor
            as="div"
            className="text-sm font-semibold leading-snug"
            style={{ color: "var(--foreground)" }}
            toolMode={toolMode}
            onMouseUp={onContentMouseUp}
            onClickCapture={onContentClick}
          />
        </div>
        <PracticeQuestionFlagButton flagged={flagged} onToggle={onToggleFlag} disabled={flagsDisabled} />
      </div>
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

  const { elapsed, countdown, paused, togglePause, setInitialCountdown } = usePracticeSessionTimer()
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
    if (prepTestId) {
      navigate(`/app/practice/preptest/${encodeURIComponent(prepTestId)}`, { replace: true })
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

  const answeredCount = Object.keys(answersByQuestion).length
  const allAnswered = answeredCount >= questions.length
  const headerLabel =
    sectionSession?.sessionLabel ||
    [metadata?.prepTestTitle, metadata?.sectionTitle].filter(Boolean).join(" — ") ||
    (sectionType === "LR" ? "LR Section" : "RC Section")

  const timerLabel = timedSection && countdown != null ? "Remaining" : "Elapsed"
  const timerDisplaySeconds =
    timedSection && countdown != null ? countdown : elapsed
  const timerProgress =
    timedSection && countdown != null
      ? countdown / SECTION_TIMER_SECONDS
      : questions.length > 0
        ? answeredCount / questions.length
        : 0
  const allowReselect = canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), {
    blindReview: blindReviewMode,
  })

  const finishButton = (
    <Button
      type="button"
      disabled={finishing}
      variant="outline"
      className="h-[52px] gap-1 rounded-2xl border bg-[#f6f8fa] px-3 font-medium text-[#062357] hover:bg-[#eceff3]"
      style={{ borderColor: "#dfe1e7" }}
      onClick={() => void handleFinish()}
    >
      {blindReviewMode
        ? "Back to blind review"
        : finishing
          ? "Finishing…"
          : allAnswered
            ? "Finish"
            : `Finish (${answeredCount}/${questions.length})`}
      <ChevronDown className="size-5 opacity-90" strokeWidth={2} />
    </Button>
  )

  return (
    <StudentMain className="max-w-none bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] py-4 md:py-6">
      <div className="mx-auto w-full max-w-[1200px] px-0">
        {error ? (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div
          className="overflow-hidden rounded-2xl border bg-background shadow-sm"
          style={{ borderColor: "var(--color-student-cta)" }}
        >
          <PracticeSessionHeader
            title={blindReviewMode ? `Blind review · ${headerLabel}` : headerLabel}
            findQuery={findQuery}
            onFindQueryChange={setFindQuery}
            activeColor={highlights.activeColor}
            toolMode={highlights.toolMode}
            fontScale={highlights.fontScale}
            lineSpacing={highlights.lineSpacing}
            onSelectColor={highlights.selectColor}
            onEraser={highlights.selectEraser}
            onUnderline={highlights.selectUnderline}
            onFontSize={highlights.cycleFontSize}
            onLineSpacing={highlights.cycleLineSpacing}
            timerLabel={timerLabel}
            timerDisplaySeconds={timerDisplaySeconds}
            timerPaused={paused}
            onToggleTimerPause={togglePause}
            timerProgress={timerProgress}
            timerDisplayClassName={
              timedSection && countdown === 0 ? "text-[#df1c41]" : undefined
            }
            finishButton={finishButton}
          />

          <div
            ref={sessionBodyRef}
            className="grid gap-0 lg:grid-cols-2 lg:divide-x"
            style={{ borderColor: "var(--greyscale-100)", ...highlights.contentStyle }}
          >
            <div
              className="max-h-[min(52vh,480px)] overflow-y-auto border-b p-5 lg:max-h-[560px] lg:border-b-0"
              style={{ borderColor: "var(--greyscale-100)" }}
            >
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
            <div className="flex max-h-[min(52vh,480px)] flex-col gap-4 overflow-y-auto p-5 lg:max-h-[560px]">
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

          <footer
            className="flex flex-col gap-4 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--greyscale-100)" }}
          >
            <div className="flex flex-wrap items-center gap-2 pt-2">
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
                    className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors"
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
            <div className="flex items-center justify-end gap-2">
              <Link
                to={blindReviewMode ? blindReviewExitPath() : "/app/practice/sections"}
                className="mr-auto text-sm font-semibold hover:underline sm:mr-0"
                style={{ color: "var(--color-student-cta)" }}
              >
                {blindReviewMode ? "Exit blind review" : "Exit section"}
              </Link>
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
