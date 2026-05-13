import { useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { mockAnalyticsOverview, mockPrepTestResult, mockSectionResults } from "@/features/student/lib/mock-analytics"

function AnalyticsPage() {
  const [params] = useSearchParams()
  const tab = params.get("tab") ?? "overview"

  return (
    <>
      <StudentSubnavStrip crumbs={[{ label: "Analytics" }]} />
      <StudentMain>
        {tab !== "overview" ? (
          <p className="mb-4 rounded-xl border-[color:var(--greyscale-100)] bg-[color-mix(in_srgb,var(--color-student-accent)_8%,white)] px-4 py-3 text-sm text-[color:var(--color-student-heading)]">
            Viewing <span className="font-semibold">{tab}</span> analytics (sample layout). Use the nav menu links to toggle tabs.
          </p>
        ) : null}

        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#dfe1e7] pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Overview</p>
            <h1 className="mt-1 text-3xl font-semibold text-[color:var(--color-student-heading)]">Your study snapshot</h1>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="rounded-xl border-[color:var(--color-student-accent)] text-[color:var(--color-student-accent)]">
              Export
            </Button>
            <Button type="button" className="rounded-xl bg-[color:var(--color-student-accent)] text-white hover:opacity-90">
              PrepTest results
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-[#666d80]">All time</p>
            <p className="mt-2 text-3xl font-semibold text-[color:var(--color-student-heading)]">{mockAnalyticsOverview.totalStudyHours}h</p>
            <p className="mt-1 text-sm text-[#666d80]">Total study time</p>
          </article>
          <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-[#666d80]">+3% this week</p>
            <p className="mt-2 text-3xl font-semibold text-[color:var(--color-student-heading)]">{mockAnalyticsOverview.overallAccuracyPct}%</p>
            <p className="mt-1 text-sm text-[#666d80]">Overall accuracy</p>
          </article>
          <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-[#666d80]">Practice + Tests</p>
            <p className="mt-2 text-3xl font-semibold text-[color:var(--color-student-heading)]">{mockAnalyticsOverview.questionsAnswered.toLocaleString()}</p>
            <p className="mt-1 text-sm text-[#666d80]">Questions answered</p>
          </article>
        </div>

        <section className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 border-b border-[#dfe1e7] pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs text-[#666d80]">{mockPrepTestResult.dateLabel}</p>
              <h2 className="text-2xl font-semibold text-[color:var(--color-student-heading)]">{mockPrepTestResult.testLabel}</h2>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-xl">
                Review
              </Button>
              <Button type="button" size="sm" className="rounded-xl bg-[color:var(--color-student-accent)] text-white">
                Share
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[290px_1fr]">
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl bg-[color:var(--color-student-heading)] p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Your score</p>
                <p className="mt-2 text-5xl font-bold">{mockPrepTestResult.score}</p>
                <p className="mt-2 text-sm opacity-90">
                  {mockPrepTestResult.correct}/{mockPrepTestResult.total} correct (−{mockPrepTestResult.missed})
                </p>
                <p className="mt-2 text-sm opacity-90">Percentile: {mockPrepTestResult.percentile}</p>
              </div>
              <div className="rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] p-4">
                <div className="flex justify-between gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#666d80]">Your prediction</p>
                    <p className="text-2xl font-semibold text-[color:var(--color-student-heading)]">{mockPrepTestResult.prediction}</p>
                  </div>
                  <div className="w-px bg-[#dfe1e7]" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#666d80]">Blind review</p>
                    <p className="text-2xl font-semibold text-[color:var(--color-student-heading)]">{mockPrepTestResult.blindReview}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Results by section</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {mockSectionResults.map((s) => (
                  <article key={s.id} className="rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] p-4">
                    <p className="text-xs font-bold text-[color:var(--color-student-accent)]">{s.label}</p>
                    <p className="mt-4 text-3xl font-semibold text-[color:var(--color-student-heading)]">
                      {s.correct}/{s.total}
                    </p>
                    <p className="mt-1 text-xs text-[#666d80]">Correct</p>
                  </article>
                ))}
                <article className="rounded-2xl border border-dashed border-[#dfe1e7] bg-[#f9fbfc] p-4 text-sm text-[#666d80] sm:col-span-2 xl:col-span-1">
                  Combined sections appear here when a full PrepTest is completed.
                </article>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe1e7] pt-6">
            <p className="text-lg font-semibold text-[color:var(--color-student-heading)]">Total Questions: {mockPrepTestResult.total}</p>
            <Button type="button" variant="outline" className="rounded-xl">
              Question breakdown
            </Button>
          </div>
        </section>
      </StudentMain>
    </>
  )
}

export { AnalyticsPage }
