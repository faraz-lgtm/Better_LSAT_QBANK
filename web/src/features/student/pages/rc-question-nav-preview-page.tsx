import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { StudentMain } from "@/features/student/components/student-main"
import { PracticeSessionActiveDrillFooterNav } from "@/features/student/practice-session/practice-session-active-drill-footer-nav"
import {
  ACTIVE_DRILL_FOOTER_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { passageBreakAfterIndices } from "@/features/student/practice-session/question-nav-passage-breaks"
import { cn } from "@/lib/utils"

type PreviewQuestion = {
  id: string
  passage: { id: string }
  sourceGroupId: string
}

/** PT158-style RC groups: 1–7 | 8–13 | 14–21 | 22–27 */
const PASSAGE_SIZES = [7, 6, 8, 6] as const

function buildPreviewQuestions(): PreviewQuestion[] {
  const questions: PreviewQuestion[] = []
  let n = 1
  PASSAGE_SIZES.forEach((size, passageIndex) => {
    const groupId = `g${passageIndex + 1}`
    const passageId = `pass-${passageIndex + 1}`
    for (let i = 0; i < size; i += 1) {
      questions.push({
        id: `q-${n}`,
        passage: { id: passageId },
        sourceGroupId: groupId,
      })
      n += 1
    }
  })
  return questions
}

function formatRanges(questions: PreviewQuestion[]): string {
  const ranges: string[] = []
  let start = 1
  for (let i = 0; i < questions.length; i += 1) {
    const next = questions[i + 1]
    const cur = questions[i]!
    if (!next || next.sourceGroupId !== cur.sourceGroupId) {
      const end = i + 1
      ranges.push(start === end ? `Q${start}` : `Q${start}–${end}`)
      start = end + 1
    }
  }
  return ranges.join("  ·  ")
}

function RcQuestionNavPreviewPage() {
  const questions = useMemo(() => buildPreviewQuestions(), [])
  const [safeIndex, setSafeIndex] = useState(7)
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, unknown>>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})

  const breakAfter = useMemo(() => passageBreakAfterIndices(questions), [questions])
  const current = questions[safeIndex - 1]
  const passageLabel = current
    ? `Passage ${current.sourceGroupId.replace("g", "")}`
    : "—"

  function selectQuestion(n: number) {
    setSafeIndex(n)
    const q = questions[n - 1]
    if (q) {
      setAnswersByQuestion((prev) => ({ ...prev, [q.id]: { selected: true } }))
    }
  }

  return (
    <StudentMain
      layout="immersive"
      className="bg-[#e8eaed]"
      contentClassName="flex min-h-0 flex-1 flex-col"
    >
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-4 px-4 py-6">
        <div className="rounded-[16px] border border-[#dfe1e7] bg-white p-5 shadow-[0px_1px_1.5px_rgba(13,13,18,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#666d80]">UI preview</p>
          <h1 className="mt-1 text-2xl font-bold text-[#062357]">RC question nav — passage dividers</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#666d80]">
            LawHub-style vertical breaks between Reading Comprehension passage groups. Mock PT158 layout:{" "}
            <span className="font-semibold text-[#062357]">{formatRanges(questions)}</span>
          </p>
          <p className="mt-3 text-sm text-[#062357]">
            Current: <span className="font-semibold">Q{safeIndex}</span> · {passageLabel}
            <span className="mx-2 text-[#dfe1e7]">|</span>
            Dividers after questions:{" "}
            <span className="font-semibold">
              {[...breakAfter].map((i) => i + 1).join(", ") || "none"}
            </span>
          </p>
          <Link
            to="/app/practice/sections"
            className="mt-4 inline-flex text-sm font-semibold text-[#0d47a1] hover:underline"
          >
            ← Back to Sections
          </Link>
        </div>

        <div
          className={cn(
            "practice-session-card practice-session-card--active-drill flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white",
          )}
        >
          <div className="flex min-h-0 flex-1 gap-0 border-b border-[#dfe1e7]">
            <div className="flex min-w-0 flex-1 flex-col border-r border-[#dfe1e7] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#666d80]">{passageLabel}</p>
              <p className="mt-3 text-[1.05rem] leading-[1.55] text-[#0d0d12]">
                Preview passage panel. Switch questions in the footer to move between passage groups — dividers
                appear between {formatRanges(questions)}.
              </p>
            </div>
            <div className="flex w-full max-w-[420px] flex-col p-6">
              <p className="text-sm font-semibold text-[#062357]">Question {safeIndex}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#666d80]">
                Which one of the following most accurately describes… (preview stem for {passageLabel}).
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#062357]">
                {["A", "B", "C", "D", "E"].map((letter) => (
                  <li
                    key={letter}
                    className="rounded-[12px] border border-[#dfe1e7] px-3 py-2"
                  >
                    {letter}. Option preview
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <footer className={cn(ACTIVE_DRILL_FOOTER_CLASS, "practice-session-footer")}>
            <PracticeSessionActiveDrillFooterNav
              questions={questions}
              safeIndex={safeIndex}
              answersByQuestion={answersByQuestion}
              isFlagged={(id) => Boolean(flagged[id])}
              variant="active-drill"
              onSelectQuestion={selectQuestion}
              onPrev={() => setSafeIndex((i) => Math.max(1, i - 1))}
              onNext={() => setSafeIndex((i) => Math.min(questions.length, i + 1))}
            />
          </footer>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-[12px] border border-[#dfe1e7] bg-white px-3 py-2 text-sm font-semibold text-[#0d47a1]"
            onClick={() => {
              const q = questions[safeIndex - 1]
              if (!q) return
              setFlagged((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
            }}
          >
            Toggle flag on Q{safeIndex}
          </button>
          <button
            type="button"
            className="rounded-[12px] border border-[#dfe1e7] bg-white px-3 py-2 text-sm font-semibold text-[#0d47a1]"
            onClick={() => setSafeIndex(8)}
          >
            Jump to Q8 (next passage)
          </button>
        </div>
      </div>
    </StudentMain>
  )
}

export { RcQuestionNavPreviewPage }
