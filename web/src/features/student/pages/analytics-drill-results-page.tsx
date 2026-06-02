import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { CheckCircle2, ChevronDown, ChevronUp, Flag, Loader2, XCircle } from "lucide-react"

import { ExplanationChoiceList } from "@/features/student/explanation-detail/explanation-choice-list"
import { parseFlaggedQuestionIds } from "@/features/student/practice-session/practice-question-flags"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import type { DrillQuestion, DrillSessionResponse } from "@/features/student/drills/drill-types"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const LETTERS = ["A", "B", "C", "D", "E"] as const

function choiceLetter(choices: DrillQuestion["choices"], selectedAnswer: string): string | null {
  const letter = selectedAnswer.trim().toUpperCase()
  const byId = choices.findIndex((c) => c.id.toUpperCase() === letter)
  if (byId >= 0) return LETTERS[byId] ?? letter
  const byLetter = choices.findIndex((_, i) => LETTERS[i] === letter)
  if (byLetter >= 0) return letter
  return null
}

function choiceIdFromAnswer(choices: DrillQuestion["choices"], selectedAnswer: string): string | null {
  const letter = selectedAnswer.trim().toUpperCase()
  const byId = choices.find((c) => c.id.toUpperCase() === letter)
  if (byId) return byId.id
  const idx = letter.charCodeAt(0) - 65
  if (idx >= 0 && idx < choices.length) return choices[idx]!.id
  return null
}

function hasAnyOptionExplanation(question: DrillQuestion): boolean {
  return question.choices.some((c) => Boolean(c.explanationHtml?.trim()))
}

function ScoreRing({ pct }: { pct: number }) {
  const ringFill = useMemo(
    () => `conic-gradient(from 270deg, #0a357f ${pct}%, #dfe1e7 ${pct}% 100%)`,
    [pct],
  )
  return (
    <div
      className="flex size-[120px] items-center justify-center rounded-full p-1"
      style={{ background: ringFill }}
      aria-label={`${pct} percent`}
    >
      <div className="flex size-full items-center justify-center rounded-full bg-[#edf3ff]">
        <span className="text-[33px] font-bold leading-none text-[#666d80]">{pct}%</span>
      </div>
    </div>
  )
}

function DrillQuestionResultCard({
  question,
  correctChoiceId,
  selectedAnswer,
  isCorrect,
  flagged,
}: {
  question: DrillQuestion
  correctChoiceId: string
  selectedAnswer: string | null
  isCorrect: boolean | null
  flagged?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const num = question.questionNumber ?? "?"
  const letter = selectedAnswer ? choiceLetter(question.choices, selectedAnswer) : null
  const highlightId = selectedAnswer ? choiceIdFromAnswer(question.choices, selectedAnswer) : null
  const showChoices = hasAnyOptionExplanation(question)
  const explanationHref = highlightId
    ? `/app/learn/explanations/q/${encodeURIComponent(question.id)}?choice=${encodeURIComponent(highlightId)}`
    : `/app/learn/explanations/q/${encodeURIComponent(question.id)}`

  const choicesForList = question.choices.map((c, i) => ({
    id: c.id,
    index: c.index ?? i + 1,
    text: c.text,
    explanationHtml: c.explanationHtml ?? null,
  }))

  return (
    <article className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_1px_rgba(13,13,18,0.04)]">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white",
            isCorrect === true ? "bg-[#00d492]" : isCorrect === false ? "bg-[#df1c41]" : "bg-[#666d80]",
          )}
        >
          {num}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#062357]">
            {flagged ? (
              <Flag className="size-4 shrink-0 fill-[#0d47a1] text-[#0d47a1]" strokeWidth={2} aria-label="Flagged for review" />
            ) : null}
            Question {num}
            {letter ? (
              <span className="ml-2 font-medium text-[#666d80]">
                Your answer: <span className="text-[#0d47a1]">{letter}</span>
              </span>
            ) : (
              <span className="ml-2 font-medium text-[#666d80]">No answer</span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {isCorrect === true ? (
            <CheckCircle2 className="size-5 text-[#00d492]" aria-label="Correct" />
          ) : isCorrect === false ? (
            <XCircle className="size-5 text-[#df1c41]" aria-label="Incorrect" />
          ) : null}
          {showChoices ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#0d47a1] hover:underline"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
            >
              {expanded ? "Hide choices" : "Review choices"}
              {expanded ? (
                <ChevronUp className="size-4" aria-hidden />
              ) : (
                <ChevronDown className="size-4" aria-hidden />
              )}
            </button>
          ) : null}
          <Link to={explanationHref} className="text-sm font-semibold text-[#0d47a1] hover:underline">
            Full explanation
          </Link>
        </div>
      </div>
      {expanded && showChoices ? (
        <div className="border-t border-[#dfe1e7] bg-[#f9fbfc] px-5 py-4">
          <ExplanationChoiceList
            choices={choicesForList}
            correctChoiceId={correctChoiceId}
            showCorrect
            highlightChoiceId={highlightId}
          />
        </div>
      ) : null}
    </article>
  )
}

function AnalyticsDrillResultsPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get("returnTo")?.trim() ?? ""
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DrillSessionResponse | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      setError("Missing drill session.")
      return
    }
    setLoading(true)
    setError(null)
    void practiceApi
      .getDrillSession(sessionId)
      .then((res) => {
        if (!res.session.completed_at) {
          setError("This drill is not finished yet.")
          setData(null)
          return
        }
        setData(res)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load drill results"))
      .finally(() => setLoading(false))
  }, [practiceApi, sessionId])

  const answersByQuestion = useMemo(() => {
    const map = new Map<string, { selectedAnswer: string; isCorrect: boolean }>()
    for (const a of data?.answers ?? []) {
      map.set(a.questionId, { selectedAnswer: a.selectedAnswer, isCorrect: a.isCorrect })
    }
    return map
  }, [data?.answers])

  const flaggedQuestionIds = useMemo(
    () =>
      new Set(
        data?.metadata?.flaggedQuestionIds ??
          parseFlaggedQuestionIds(data?.session.metadata),
      ),
    [data?.metadata?.flaggedQuestionIds, data?.session.metadata],
  )

  const questionCount = data?.questions.length ?? 0
  const rawScore = data?.session.raw_score ?? 0
  const pct = questionCount > 0 ? Math.round((rawScore / questionCount) * 100) : 0
  const title =
    data?.drillLabel ??
    (typeof data?.metadata.title === "string" ? data.metadata.title : null) ??
    (data?.metadata.sectionType === "RC" ? "RC Drill" : "LR Drill")

  const completedLabel = useMemo(() => {
    const at = data?.session.completed_at
    if (!at) return "Drill results"
    const d = new Date(at)
    return `Drill — ${d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`
  }, [data?.session.completed_at])

  function handleBack() {
    if (returnTo.startsWith("/app/")) {
      navigate(returnTo, { replace: true })
      return
    }
    navigate("/app/practice/drills", { replace: true })
  }

  if (loading) {
    return (
      <StudentMain>
        <div className="flex items-center gap-2 text-sm text-[#666d80]">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading drill results…
        </div>
      </StudentMain>
    )
  }

  if (error || !data) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">{error ?? "Results not found."}</p>
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-[#0d47a1] hover:underline"
          onClick={handleBack}
        >
          Back to drills
        </button>
      </StudentMain>
    )
  }

  return (
    <>
      <StudentSubnavStrip
        crumbs={[
          { label: "Analytics", href: "/app/analytics" },
          { label: "Drills", href: "/app/analytics/drills" },
          { label: "Results" },
        ]}
      />
      <StudentMain>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold leading-[1.3] text-[#062357]">{completedLabel}</h1>
          <button
            type="button"
            className="text-sm font-semibold text-[#0d47a1] hover:underline"
            onClick={handleBack}
          >
            Back to practice
          </button>
        </div>

        <section className="mb-8 flex flex-wrap items-center gap-8 rounded-2xl border border-[#0d47a1] bg-[#edf3ff] px-8 py-6">
          <div>
            <p className="text-sm font-semibold tracking-[0.28px] text-[#6a7282]">Your Score</p>
            <p className="text-[48px] font-bold leading-[1.2] text-[#062357] select-none">
              {rawScore}/{questionCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#062357]">{title}</p>
          </div>
          <ScoreRing pct={pct} />
        </section>

        <h2 className="mb-4 text-lg font-bold text-[#062357]">Question breakdown</h2>
        <ul className="flex flex-col gap-3">
          {data.questions.map((q) => {
            const ans = answersByQuestion.get(q.id)
            const correctId = q.correctChoiceId ?? ""
            return (
              <li key={q.id}>
                <DrillQuestionResultCard
                  question={q}
                  correctChoiceId={correctId}
                  selectedAnswer={ans?.selectedAnswer ?? null}
                  isCorrect={ans != null ? ans.isCorrect : null}
                  flagged={flaggedQuestionIds.has(q.id)}
                />
              </li>
            )
          })}
        </ul>
      </StudentMain>
    </>
  )
}

export { AnalyticsDrillResultsPage }
