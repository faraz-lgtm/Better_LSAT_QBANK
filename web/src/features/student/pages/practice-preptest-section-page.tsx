import { useEffect, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { PrepTestPreviewNotice } from "@/features/student/components/prep-test-preview-notice"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { getPrepTestPracticeDetail, mockPrepTestSectionStub } from "@/features/student/lib/mock-preptest"
import { cn } from "@/lib/utils"
import { ChevronRight, Timer, X } from "lucide-react"

function parseTimeDisplayToSeconds(display: string): number {
  const parts = display.split(":").map((p) => Number.parseInt(p, 10))
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return 35 * 60
  const [m, s] = parts
  return Math.max(0, (m ?? 0) * 60 + (s ?? 0))
}

function formatSecondsClock(total: number): string {
  const capped = Math.max(0, total)
  const m = Math.floor(capped / 60)
  const s = capped % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function PracticePrepTestSectionPage() {
  const navigate = useNavigate()
  const { testId: testIdParam, sectionId } = useParams<{ testId: string; sectionId: string }>()

  const detail = useMemo(() => getPrepTestPracticeDetail(testIdParam ?? null), [testIdParam])
  const section = detail.sections.find((s) => s.id === sectionId)

  const hubHref = `/app/practice/preptest/${encodeURIComponent(detail.testId)}`

  const [secondsLeft, setSecondsLeft] = useState(() =>
    section ? parseTimeDisplayToSeconds(section.timeDisplay) : 35 * 60,
  )
  const [choiceIndex, setChoiceIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!section) return
    setSecondsLeft(parseTimeDisplayToSeconds(section.timeDisplay))
  }, [section])

  useEffect(() => {
    if (!section) return
    const t = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [section])

  if (!testIdParam || !sectionId) {
    return <Navigate to="/app/practice/preptest" replace />
  }

  if (!section) {
    return <Navigate to={hubHref} replace />
  }

  const letters = ["A", "B", "C", "D", "E"] as const

  return (
    <>
      <StudentSubnavStrip
        title={detail.label}
        crumbs={[
          { label: "Practice", href: "/app/practice/drills" },
          { label: "PrepTests", href: "/app/practice/preptest" },
          { label: detail.label, href: hubHref },
          { label: section.shortTitle },
        ]}
      />
      <StudentMain>
        <PrepTestPreviewNotice />
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            to={hubHref}
            className="text-[20px] font-bold leading-[1.3] text-[#0d47a1] transition-colors hover:underline"
          >
            {detail.parentLabel}
          </Link>
          <button
            type="button"
            onClick={() => navigate(detail.parentHref)}
            className="inline-flex size-10 items-center justify-center rounded-xl text-[#666d80] transition-colors hover:bg-[#e8eef9] hover:text-[#062357]"
            aria-label="Close"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dfe1e7] bg-[#f5f9ff] px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Timer className="size-5 text-[#0d47a1]" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Section timer</p>
              <p className="text-2xl font-bold tabular-nums text-[#062357]">{formatSecondsClock(secondsLeft)}</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-[#666d80]">
            {section.shortTitle} · {section.questionsLine}
          </p>
        </div>

        <article className="rounded-2xl border border-[#dfe1e7] bg-white p-5 shadow-sm md:p-8">
          <p className="text-base leading-relaxed text-[#062357]">{mockPrepTestSectionStub.stem}</p>

          <ol className="mt-8 flex flex-col gap-3">
            {mockPrepTestSectionStub.choices.map((text, i) => {
              const selected = choiceIndex === i
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setChoiceIndex(i)}
                    className={cn(
                      "flex w-full gap-4 rounded-2xl border px-4 py-4 text-left text-sm font-medium leading-snug transition-colors md:text-base",
                      selected
                        ? "border-[#0d47a1] bg-[#f0f5ff] text-[#062357]"
                        : "border-[#dfe1e7] bg-[#fafbfd] text-[#062357] hover:border-[#b8c4dc]",
                    )}
                  >
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#dfe1e7] bg-white text-xs font-bold text-[#0d47a1]">
                      {letters[i]}
                    </span>
                    <span>{text}</span>
                  </button>
                </li>
              )
            })}
          </ol>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#dfe1e7] pt-6">
            <Button type="button" variant="outline" className="rounded-2xl border-[#dfe1e7]" asChild>
              <Link to={hubHref}>Back to test</Link>
            </Button>
            <Button
              type="button"
              className="rounded-2xl bg-[#0d47a1] px-6 text-white hover:bg-[#0b3d82]"
              disabled={choiceIndex === null}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </article>
      </StudentMain>
    </>
  )
}

export { PracticePrepTestSectionPage }
