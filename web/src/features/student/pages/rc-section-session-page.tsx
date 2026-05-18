import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  Bold,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Flag,
  Highlighter,
  Strikethrough,
  Underline,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import { rcSectionSessionMock, type RcSectionQuestion } from "@/features/student/drills/rc-section-mock"
import { StudentMain } from "@/features/student/components/student-main"

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const passageParamToHeader: Record<string, string> = {
  "pt123-s1": "PT141",
  "pt124-s2": "PT142",
}

type RcQuestionPanelProps = {
  question: RcSectionQuestion
  questionNumber: number
  findQuery: string
}

function RcQuestionPanel({ question, questionNumber, findQuery }: RcQuestionPanelProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [hiddenChoices, setHiddenChoices] = useState<Record<number, boolean>>({})

  const matchesFind = useMemo(() => {
    const q = findQuery.trim().toLowerCase()
    if (!q) return () => true
    return (text: string) => text.toLowerCase().includes(q)
  }, [findQuery])

  const stemHit = matchesFind(question.stem)

  return (
    <>
      <div className="flex gap-2">
        <h2 className="min-w-0 flex-1 text-sm font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
          <span style={{ color: "var(--color-student-cta)" }}>{questionNumber}.</span>{" "}
          <span
            style={{
              color: stemHit ? "var(--foreground)" : "var(--muted-foreground)",
              opacity: findQuery.trim() && !stemHit ? 0.45 : 1,
            }}
          >
            {question.stem}
          </span>
        </h2>
        <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Bookmark question">
          <Flag className="size-4" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {question.choices.map((choice, index) => (
          <LrDrillOptionRow
            key={index}
            index={index}
            text={choice}
            selected={selectedChoice === index}
            hidden={Boolean(hiddenChoices[index])}
            onSelect={() => setSelectedChoice(index)}
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

function RcSectionSessionPage() {
  const [searchParams] = useSearchParams()
  const passageKey = searchParams.get("passage") ?? "pt123-s1"
  const headerLabel = passageParamToHeader[passageKey] ?? rcSectionSessionMock.defaultTestLabel

  const questions = rcSectionSessionMock.questions
  const [qIndex, setQIndex] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [findQuery, setFindQuery] = useState("")

  const safeIndex = Math.min(Math.max(qIndex, 1), questions.length)
  const current = questions[safeIndex - 1]!

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const matchesFind = useMemo(() => {
    const q = findQuery.trim().toLowerCase()
    if (!q) return () => true
    return (text: string) => text.toLowerCase().includes(q)
  }, [findQuery])

  const passageHit = matchesFind(rcSectionSessionMock.passage)

  return (
    <StudentMain className="max-w-none bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] py-4 md:py-6">
      <div className="mx-auto w-full max-w-[1200px] px-0">
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
                {(["#fb923c", "#ec4899", "#facc15", "#60a5fa"] as const).map((c) => (
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
                <button type="button" className="rounded-md px-2 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted" aria-label="Text size">
                  Aa
                </button>
                <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Underline">
                  <Underline className="size-4" strokeWidth={2} />
                </button>
                <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Bold">
                  <Bold className="size-4" strokeWidth={2} />
                </button>
                <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Strikethrough">
                  <Strikethrough className="size-4" strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 md:ml-0">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0" strokeWidth={2} />
                <span>
                  Elapsed <span className="font-semibold tabular-nums text-foreground">{formatElapsed(elapsed)}</span>
                </span>
              </span>
              <Button
                type="button"
                className="gap-1 rounded-xl font-semibold text-white"
                style={{ backgroundColor: "var(--color-student-accent)" }}
              >
                Finish
                <ChevronDown className="size-4 opacity-90" strokeWidth={2} />
              </Button>
            </div>
          </header>

          <div className="grid gap-0 lg:grid-cols-2 lg:divide-x" style={{ borderColor: "var(--greyscale-100)" }}>
            <div className="max-h-[min(52vh,480px)] overflow-y-auto border-b p-5 lg:max-h-[560px] lg:border-b-0" style={{ borderColor: "var(--greyscale-100)" }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-student-heading)" }}>
                {rcSectionSessionMock.passageTitle}
              </p>
              <p
                className="mt-3 text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  color: passageHit ? "var(--foreground)" : "var(--muted-foreground)",
                  opacity: findQuery.trim() && !passageHit ? 0.45 : 1,
                }}
              >
                {rcSectionSessionMock.passage}
              </p>
            </div>
            <div className="flex max-h-[min(52vh,480px)] flex-col gap-4 overflow-y-auto p-5 lg:max-h-[560px]">
              <RcQuestionPanel key={current.id} question={current} questionNumber={safeIndex} findQuery={findQuery} />
            </div>
          </div>

          <footer
            className="flex flex-col gap-4 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--greyscale-100)" }}
          >
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {questions.map((_, i) => {
                const n = i + 1
                const active = n === safeIndex
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQIndex(n)}
                    className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors"
                    style={{
                      backgroundColor: active ? "var(--color-student-cta)" : "var(--greyscale-25)",
                      color: active ? "#fff" : "var(--color-student-heading)",
                      border: `1px solid ${active ? "var(--color-student-cta)" : "var(--greyscale-100)"}`,
                    }}
                    aria-current={active ? "true" : undefined}
                    aria-label={`Question ${n}`}
                  >
                    {active ? (
                      <span
                        className="absolute -top-2 left-1/2 h-2 w-1 -translate-x-1/2 rounded-sm"
                        style={{ backgroundColor: "var(--color-student-cta)" }}
                        aria-hidden
                      />
                    ) : null}
                    {n}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Link
                to="/app/practice/sections/rc"
                className="mr-auto text-sm font-semibold hover:underline sm:mr-0"
                style={{ color: "var(--color-student-cta)" }}
              >
                Exit section
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

export { RcSectionSessionPage }
