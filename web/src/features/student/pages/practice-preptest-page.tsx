import { useEffect, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { PrepTestPreviewNotice } from "@/features/student/components/prep-test-preview-notice"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import {
  getPrepTestPracticeDetail,
  type PrepTestPracticeSectionRow,
} from "@/features/student/lib/mock-preptest"
import { ChevronDown, ChevronRight, Timer, X } from "lucide-react"

function ConfigSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-[#062357]">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[52px] w-full appearance-none rounded-2xl border border-[#dfe1e7] bg-[#f5f9ff] px-4 pr-11 text-base font-medium text-[#062357] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] focus:outline-none focus:ring-2 focus:ring-[#0d47a1]/25"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-[#666d80]"
          aria-hidden
        />
      </div>
    </div>
  )
}

function PrepTestSectionRow({
  row,
  onStart,
}: {
  row: PrepTestPracticeSectionRow
  onStart: (sectionId: string) => void
}) {
  const active = row.unlocked
  return (
    <div
      className={cn(
        "flex min-h-[100px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dfe1e7] bg-white px-5 py-4 shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)] md:px-6",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className={cn("text-2xl font-bold leading-[1.3]", active ? "text-[#0d47a1]" : "text-[#a4acb9]")}>
          {row.shortTitle}
        </p>
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 text-sm font-semibold leading-[1.5] tracking-[0.02em]",
            active ? "text-[#666d80]" : "text-[#a4acb9]",
          )}
        >
          <Timer className="size-4 shrink-0" aria-hidden />
          <span>{row.timeDisplay}</span>
          <span className="hidden h-3.5 w-px bg-[#dfe1e7] sm:block" aria-hidden />
          <span>{row.questionsLine}</span>
        </div>
      </div>
      {active ? (
        <button
          type="button"
          onClick={() => onStart(row.id)}
          className="inline-flex h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] px-5 text-base font-semibold text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#0b3d82] sm:w-auto"
        >
          Start Section
          <ChevronRight className="size-5 shrink-0" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}

function PracticePrepTestPage() {
  const navigate = useNavigate()
  const { testId: testIdParam } = useParams<{ testId: string }>()

  const detail = useMemo(() => getPrepTestPracticeDetail(testIdParam ?? null), [testIdParam])
  const [timingId, setTimingId] = useState(detail.defaultTimingId)
  const [formatId, setFormatId] = useState(detail.defaultFormatId)

  useEffect(() => {
    setTimingId(detail.defaultTimingId)
    setFormatId(detail.defaultFormatId)
  }, [detail.testId, detail.defaultTimingId, detail.defaultFormatId])

  if (!testIdParam) {
    return <Navigate to="/app/practice/preptest" replace />
  }

  return (
    <>
      <StudentSubnavStrip crumbs={[{ label: "Practice", href: "/app/practice/drills" }, { label: "PrepTests", href: "/app/practice/preptest" }, { label: detail.label }]} />
      <StudentMain>
        <PrepTestPreviewNotice />
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            to={detail.parentHref}
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

        <section className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-[#f5f9ff] shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)]">
          <div className="border-b border-[#dfe1e7] bg-white/80 px-5 py-6 md:px-8 md:py-8">
            <h1 className="text-2xl font-bold leading-[1.25] text-[#062357] md:text-[28px]">{detail.headline}</h1>
            <p className="mt-6 text-3xl font-bold text-[#0d47a1] md:text-[32px]">{detail.label}</p>

            <dl className="mt-8 flex flex-wrap items-stretch gap-0 divide-x divide-[#dfe1e7]">
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 px-4 py-1 first:pl-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Questions</dt>
                <dd className="text-2xl font-bold text-[#062357]">{detail.questionCount}</dd>
              </div>
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 px-4 py-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Total time</dt>
                <dd className="text-2xl font-bold text-[#062357]">{detail.totalMinutes} min</dd>
              </div>
              <div className="flex min-w-[100px] flex-1 flex-col gap-1 px-4 py-1 last:pr-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Sections</dt>
                <dd className="text-2xl font-bold text-[#062357]">{detail.sectionCount}</dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-6 px-5 py-6 md:grid-cols-2 md:gap-8 md:px-8 md:py-8">
            <ConfigSelect
              id="preptest-timing"
              label="Timing"
              value={timingId}
              onChange={setTimingId}
              options={detail.timingOptions}
            />
            <ConfigSelect
              id="preptest-format"
              label="Format"
              value={formatId}
              onChange={setFormatId}
              options={detail.formatOptions}
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#062357]">Test Section</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {detail.sections.map((row) => (
              <li key={row.id}>
                <PrepTestSectionRow
                  row={row}
                  onStart={(sectionId) =>
                    navigate(
                      `/app/practice/preptest/${encodeURIComponent(detail.testId)}/section/${encodeURIComponent(sectionId)}`,
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      </StudentMain>
    </>
  )
}

export { PracticePrepTestPage }
