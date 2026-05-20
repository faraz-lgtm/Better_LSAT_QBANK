import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronDown, ChevronLeft, ChevronRight, Clock, Eraser, Flag, Highlighter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import type { DrillQuestion } from "@/features/student/drills/drill-types"
import type { SectionSessionResponse } from "@/features/student/sections/section-types"
import { StudentMain } from "@/features/student/components/student-main"
import { createPracticeApi } from "@/lib/api/practice"
import { HtmlContent } from "@/lib/html/html-content"
import { plainTextFromHtml } from "@/lib/html/plain-text-from-html"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const SECTION_TIMER_SECONDS = 35 * 60

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function choiceIndexFromAnswer(choices: DrillQuestion["choices"], selectedAnswer: string): number | null {
  const letter = selectedAnswer.trim().toUpperCase()
  const byId = choices.findIndex((c) => c.id.toUpperCase() === letter)
  if (byId >= 0) return byId
  const idx = letter.charCodeAt(0) - 65
  if (idx >= 0 && idx < choices.length) return idx
  return null
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
  onSelect: (index: number) => void
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
  onSelect,
}: QuestionPanelProps) {
  const [hiddenChoices, setHiddenChoices] = useState<Record<number, boolean>>({})

  const matchesFind = useMemo(() => {
    const q = findQuery.trim().toLowerCase()
    if (!q) return () => true
    return (html: string) => plainTextFromHtml(html).toLowerCase().includes(q)
  }, [findQuery])

  const stem = question.stemText ?? ""
  const stemHit = matchesFind(stem)

  return (
    <>
      <div className="flex gap-2">
        <h2 className="min-w-0 flex-1 text-sm font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
          <span style={{ color: "var(--color-student-cta)" }}>{questionNumber}.</span>{" "}
          <HtmlContent
            html={stem}
            as="span"
            className={cn(
              findQuery.trim() && !stemHit && "opacity-45",
            )}
            style={{
              color: stemHit ? "var(--foreground)" : "var(--muted-foreground)",
            }}
          />
        </h2>
        <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Bookmark question">
          <Flag className="size-4" strokeWidth={2} />
        </button>
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
            html={choice.text}
            selected={selectedIndex === index}
            hidden={Boolean(hiddenChoices[index])}
            onSelect={() => {
              if (!submitting && (allowReselect || selectedIndex == null)) onSelect(index)
            }}
            onToggleHidden={() =>
              setHiddenChoices((prev) => ({
                ...prev,
                [index]: !prev[index],
              }))
            }
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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sectionSession, setSectionSession] = useState<SectionSessionResponse | null>(null)
  const [qIndex, setQIndex] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [findQuery, setFindQuery] = useState("")
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<string, { selectedAnswer: string; isCorrect: boolean }>
  >({})
  const [submitting, setSubmitting] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getSectionSession(sessionId)
      setSectionSession(data)
      if (data.metadata.timing === "35") {
        setCountdown(SECTION_TIMER_SECONDS)
      } else {
        setCountdown(null)
      }
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
  }, [practiceApi, sessionId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed((t) => t + 1)
      setCountdown((t) => (t != null && t > 0 ? t - 1 : t))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const questions = sectionSession?.questions ?? []
  const metadata = sectionSession?.metadata
  const timedSection = metadata?.timing === "35"
  const showAnswersMode = metadata?.showAnswers ?? "end"
  const sectionType = metadata?.sectionType ?? "LR"

  const safeIndex = Math.min(Math.max(qIndex, 1), Math.max(questions.length, 1))
  const current = questions[safeIndex - 1]
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

  const matchesFind = useMemo(() => {
    const q = findQuery.trim().toLowerCase()
    if (!q) return () => true
    return (html: string) => plainTextFromHtml(html).toLowerCase().includes(q)
  }, [findQuery])

  const stimulusHit = matchesFind(passageBody)

  async function handleSelectChoice(index: number) {
    if (!sessionId || !current) return
    if (!blindReviewMode && currentAnswer) return
    const choice = current.choices[index]
    if (!choice) return
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
      await practiceApi.completeSession(sessionId)
      navigate("/app/practice/sections", { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete section")
    } finally {
      setFinishing(false)
    }
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
  const timerDisplay =
    timedSection && countdown != null ? formatElapsed(countdown) : formatElapsed(elapsed)

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
          <header
            className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:flex-wrap md:items-center md:gap-4"
            style={{ borderColor: "var(--greyscale-100)" }}
          >
            <p className="text-lg font-bold tracking-tight" style={{ color: "var(--color-student-cta)" }}>
              {blindReviewMode ? `Blind review · ${headerLabel}` : headerLabel}
            </p>
            <div className="min-w-[160px] flex-1 md:max-w-xs">
              <Input
                placeholder="Find Text"
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                className="h-10 rounded-xl border text-sm"
                style={{ borderColor: "var(--greyscale-100)" }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 md:ml-auto">
              <span className="text-xs font-medium text-muted-foreground">Tools:</span>
              <div className="flex items-center gap-1">
                {(["#fb923c", "#ec4899", "#facc15"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="size-7 rounded-md border shadow-sm"
                    style={{ backgroundColor: c, borderColor: "var(--greyscale-100)" }}
                    aria-label="Highlighter color"
                  />
                ))}
                <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Eraser">
                  <Eraser className="size-4" strokeWidth={2} />
                </button>
                <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Highlighter">
                  <Highlighter className="size-4" strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 md:ml-0">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0" strokeWidth={2} />
                <span>
                  {timerLabel}{" "}
                  <span
                    className="font-semibold tabular-nums text-foreground"
                    style={timedSection && countdown === 0 ? { color: "#df1c41" } : undefined}
                  >
                    {timerDisplay}
                  </span>
                </span>
              </span>
              <Button
                type="button"
                disabled={finishing}
                className="gap-1 rounded-xl font-semibold text-white"
                style={{ backgroundColor: "var(--color-student-accent)" }}
                onClick={() => void handleFinish()}
              >
                {blindReviewMode
                  ? "Back to blind review"
                  : finishing
                    ? "Finishing…"
                    : allAnswered
                      ? "Finish"
                      : `Finish (${answeredCount}/${questions.length})`}
                <ChevronDown className="size-4 opacity-90" strokeWidth={2} />
              </Button>
            </div>
          </header>

          <div className="grid gap-0 lg:grid-cols-2 lg:divide-x" style={{ borderColor: "var(--greyscale-100)" }}>
            <div
              className="max-h-[min(52vh,480px)] overflow-y-auto border-b p-5 lg:max-h-[560px] lg:border-b-0"
              style={{ borderColor: "var(--greyscale-100)" }}
            >
              {sectionType === "RC" && current.passage ? (
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{current.passage.title}</p>
              ) : null}
              <HtmlContent
                html={passageBody}
                className={cn(findQuery.trim() && !stimulusHit && "opacity-45")}
                style={{
                  color: stimulusHit ? "var(--foreground)" : "var(--muted-foreground)",
                }}
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
                allowReselect={blindReviewMode}
                onSelect={(index) => void handleSelectChoice(index)}
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
                    aria-label={`Question ${n}`}
                  >
                    {n}
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
    </StudentMain>
  )
}

export { SectionSessionPage }
