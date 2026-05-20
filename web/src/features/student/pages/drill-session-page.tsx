import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronDown, ChevronLeft, ChevronRight, Clock, Eraser, Flag, Highlighter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import type { DrillQuestion, DrillSessionResponse } from "@/features/student/drills/drill-types"
import { StudentMain } from "@/features/student/components/student-main"
import { createPracticeApi } from "@/lib/api/practice"
import { HtmlContent } from "@/lib/html/html-content"
import { plainTextFromHtml } from "@/lib/html/plain-text-from-html"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

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
  onSelect: (index: number) => void
}

function DrillQuestionPanel({
  question,
  questionNumber,
  findQuery,
  selectedIndex,
  revealed,
  isCorrect,
  submitting,
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
            className={cn(findQuery.trim() && !stemHit && "opacity-45")}
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
              if (!submitting && selectedIndex == null) onSelect(index)
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

function DrillSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const returnTo = searchParams.get("returnTo")?.trim() ?? ""

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drill, setDrill] = useState<DrillSessionResponse | null>(null)
  const [qIndex, setQIndex] = useState(1)
  const [elapsed, setElapsed] = useState(0)
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
  const [showScoreInModal, setShowScoreInModal] = useState(false)

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

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const questions = drill?.questions ?? []
  const metadata = drill?.metadata
  const showAnswersMode = metadata?.showAnswers ?? "end"
  const sectionType = metadata?.sectionType ?? "LR"

  const safeIndex = Math.min(Math.max(qIndex, 1), Math.max(questions.length, 1))
  const current = questions[safeIndex - 1]
  const currentAnswer = current ? answersByQuestion[current.id] : undefined
  const selectedIndex =
    current && currentAnswer
      ? choiceIndexFromAnswer(current.choices, currentAnswer.selectedAnswer)
      : null
  const revealed =
    showAnswersMode === "each" ? Boolean(currentAnswer) : showAnswersMode === "never" ? false : false

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
    if (!sessionId || !current || currentAnswer) return
    const choice = current.choices[index]
    if (!choice) return
    setSubmitting(true)
    try {
      const event = await practiceApi.submitAnswer({
        sessionId,
        questionId: current.id,
        selectedAnswer: choice.id,
      })
      setAnswersByQuestion((prev) => ({
        ...prev,
        [current.id]: { selectedAnswer: event.selected_answer, isCorrect: event.is_correct },
      }))
      if (showAnswersMode === "each") {
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

  async function handleFinish() {
    if (!sessionId) return
    setFinishing(true)
    try {
      const completed = await practiceApi.completeSession(sessionId)
      const questionCount = questions.length > 0 ? questions.length : 1
      const rawScore = completed.raw_score ?? 0
      if (resolveReturnPath()) {
        setCompleteModal({ rawScore, questionCount })
        setShowScoreInModal(false)
        return
      }
      navigate("/app/practice/drills", { replace: true })
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

  const answeredCount = Object.keys(answersByQuestion).length
  const allAnswered = answeredCount >= questions.length
  const headerLabel = drill?.drillLabel ?? metadata?.title ?? (sectionType === "LR" ? "LR Drill" : "RC Drill")
  const exitHref = resolveReturnPath() || "/app/practice/drills"
  const modalPct =
    completeModal && completeModal.questionCount > 0
      ? Math.round((completeModal.rawScore / completeModal.questionCount) * 100)
      : 0

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
              {headerLabel}
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
                  Elapsed{" "}
                  <span className="font-semibold tabular-nums text-foreground">{formatElapsed(elapsed)}</span>
                </span>
              </span>
              <Button
                type="button"
                disabled={finishing}
                className="gap-1 rounded-xl font-semibold text-white"
                style={{ backgroundColor: "var(--color-student-accent)" }}
                onClick={() => void handleFinish()}
              >
                {finishing ? "Finishing…" : allAnswered ? "Finish" : `Finish (${answeredCount}/${questions.length})`}
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
              <DrillQuestionPanel
                key={current.id}
                question={current}
                questionNumber={safeIndex}
                findQuery={findQuery}
                selectedIndex={selectedIndex}
                revealed={revealed}
                isCorrect={currentAnswer?.isCorrect ?? null}
                submitting={submitting}
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
                to={exitHref}
                className="mr-auto text-sm font-semibold hover:underline sm:mr-0"
                style={{ color: "var(--color-student-cta)" }}
              >
                Exit drill
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

      {completeModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drill-complete-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <h2 id="drill-complete-title" className="text-2xl font-bold text-[#062357]">
              Well Done!
            </h2>
            <p className="mt-2 text-sm text-[#666d80]">You have completed the drill!</p>
            {showScoreInModal ? (
              <div className="mt-6 flex items-center justify-center gap-8">
                <p className="text-3xl font-bold text-[#062357]">
                  {completeModal.rawScore}/{completeModal.questionCount}
                </p>
                <div
                  className="flex size-20 items-center justify-center rounded-full border-4 border-[#0d47a1] text-lg font-bold text-[#0d47a1]"
                  aria-label={`${modalPct} percent`}
                >
                  {modalPct}%
                </div>
              </div>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {!showScoreInModal ? (
                <Button
                  type="button"
                  className="h-11 rounded-2xl bg-[#0d47a1] px-6 font-semibold text-white hover:bg-[#0b3d8c]"
                  onClick={() => setShowScoreInModal(true)}
                >
                  View Score
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-11 rounded-2xl bg-[#0d47a1] px-6 font-semibold text-white hover:bg-[#0b3d8c]"
                  onClick={() => leaveDrillSession()}
                >
                  View Result
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border-[#dfe1e7] px-6 font-semibold text-[#0d47a1]"
                onClick={() => leaveDrillSession()}
              >
                Done with Drill
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </StudentMain>
  )
}

export { DrillSessionPage }
