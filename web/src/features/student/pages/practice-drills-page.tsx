import { useState } from "react"

import { ContinueDrillCard, type ContinueDrillCardDrill } from "@/features/student/components/continue-drill-card"
import { StudentMain } from "@/features/student/components/student-main"
import { ExternalLink, LineChart } from "lucide-react"

type TagDrill = {
  id: string
  sectionLabel: string
  sectionTone: "lr" | "rc"
  title: string
  difficultyLabel: string
  filledBars: number
  difficultyColor: string
}

const continueDrills: ContinueDrillCardDrill[] = [
  {
    id: "cd-1",
    section: "LR",
    title: "Causal reasoning drill",
    progressPct: 45,
    questions: "45/100",
    timeLabel: "15 min",
    lastAttempt: "2 days ago",
    progressColor: "#9d1be8",
  },
  {
    id: "cd-2",
    section: "RC",
    title: "Comparative drill",
    progressPct: 45,
    questions: "45/100",
    timeLabel: "15 min",
    lastAttempt: "2 days ago",
    progressColor: "#ff9d51",
  },
]

const tagDrills: TagDrill[] = [
  {
    id: "tag-1",
    sectionLabel: "Logical Reasoning",
    sectionTone: "lr",
    title: "Causal reasoning drill",
    difficultyLabel: "Hardest",
    filledBars: 5,
    difficultyColor: "#df1c41",
  },
  {
    id: "tag-2",
    sectionLabel: "Reading Comprehension",
    sectionTone: "rc",
    title: "Critique or debate drill",
    difficultyLabel: "Easy",
    filledBars: 2,
    difficultyColor: "#ffbd4c",
  },
  {
    id: "tag-3",
    sectionLabel: "Logical Reasoning",
    sectionTone: "lr",
    title: "Causal reasoning drill",
    difficultyLabel: "Medium",
    filledBars: 3,
    difficultyColor: "#ff6f00",
  },
  {
    id: "tag-4",
    sectionLabel: "Reading Comprehension",
    sectionTone: "rc",
    title: "Critique or debate drill",
    difficultyLabel: "Easiest",
    filledBars: 1,
    difficultyColor: "#ff9d51",
  },
]

function filterPill(active: boolean): string {
  if (active) return "border-[#0b4e6e] bg-[#0d47a1] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
  return "border-[#dfe1e7] bg-white text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)]"
}


function PracticeDrillsPage() {
  const [continueFilter, setContinueFilter] = useState<"all" | "lr" | "rc">("all")
  const [sectionFilter, setSectionFilter] = useState<"all" | "lr" | "rc">("all")
  const filteredContinue = continueDrills.filter((drill) => {
    if (continueFilter === "all") return true
    return continueFilter === "lr" ? drill.section === "LR" : drill.section === "RC"
  })
  const filteredTags = tagDrills.filter((drill) => {
    if (sectionFilter === "all") return true
    return sectionFilter === "lr" ? drill.sectionTone === "lr" : drill.sectionTone === "rc"
  })

  return (
    <>
      <section className="border-b border-[#dfe1e7] bg-[#f3f7ff]">
        <div className="mx-auto flex h-12 w-full max-w-[1280px] items-center justify-between px-4 md:px-6">
          <h1 className="text-[20px] font-bold leading-[1.35] text-[#062357]">Drills</h1>
          <div className="flex items-center gap-1 text-xs tracking-[0.24px]">
            <span className="text-[#666d80]">Practice</span>
            <span className="text-[#666d80]">/</span>
            <span className="font-semibold text-[#0d47a1]">Drills</span>
          </div>
        </div>
      </section>

      <StudentMain className="space-y-6">
        <section className="rounded-3xl border border-[#dfe1e7] bg-white p-6">
          <div className="flex items-center gap-2 text-base font-semibold tracking-[0.32px] text-[#0d47a1]">
            <button type="button" className="inline-flex items-center gap-1 hover:underline">
              Drills History
              <ExternalLink className="size-4" />
            </button>
            <span className="mx-1 h-3.5 w-px bg-[#dfe1e7]" />
            <span>In Process</span>
            <span className="inline-flex size-5 items-center justify-center rounded-xl bg-[#eceff3] text-xs font-semibold text-[#0d47a1]">
              0
            </span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#dfe1e7] bg-[#f6f8fa] px-6 py-9 shadow-[0px_5px_10px_rgba(13,13,18,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#fffbeb] text-xl font-black text-[#ae8b00]">LR</span>
                  <div>
                    <h2 className="text-[28px] font-bold leading-[1.2] text-[#062357]">Logical Reasoning</h2>
                    <p className="text-xs tracking-[0.24px] text-[#062357]">Master argument analysis and critical thinking skills</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="h-[52px] rounded-2xl border border-[#7f0ac2] bg-[#fffbeb] px-4 text-base font-semibold tracking-[0.32px] text-[#ae8b00]"
                >
                  New Drill
                </button>
              </div>
            </article>

            <article className="rounded-3xl border border-[#dfe1e7] bg-[#f6f8fa] px-6 py-9 shadow-[0px_5px_10px_rgba(13,13,18,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#ff9d51] text-xl font-black text-white">RC</span>
                  <div>
                    <h2 className="text-[28px] font-bold leading-[1.2] text-[#062357]">Reading Comprehension</h2>
                    <p className="text-xs tracking-[0.24px] text-[#062357]">Improve passage analysis and comprehension strategies</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="h-[52px] rounded-2xl border border-[#40c4aa] bg-[#fff3ea] px-4 text-base font-semibold tracking-[0.32px] text-[#ff9d51]"
                >
                  Start Drill
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-3xl border border-[#dfe1e7] bg-white p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[34px] font-bold leading-[1.2] text-[#062357]">Continue Drills</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setContinueFilter("all")} className={`h-10 rounded-2xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(continueFilter === "all")}`}>
                All Drills
              </button>
              <button type="button" onClick={() => setContinueFilter("lr")} className={`h-10 rounded-xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(continueFilter === "lr")}`}>
                Logical Reasoning
              </button>
              <button type="button" onClick={() => setContinueFilter("rc")} className={`h-10 rounded-xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(continueFilter === "rc")}`}>
                Reading Comprehension
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {filteredContinue.map((drill) => (
              <ContinueDrillCard key={drill.id} drill={drill} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#dfe1e7] bg-white p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[34px] font-bold leading-[1.2] text-[#062357]">Drills by Tags</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setSectionFilter("all")} className={`h-10 rounded-2xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(sectionFilter === "all")}`}>
                All Drills
              </button>
              <button type="button" onClick={() => setSectionFilter("lr")} className={`h-10 rounded-xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(sectionFilter === "lr")}`}>
                Logical Reasoning
              </button>
              <button type="button" onClick={() => setSectionFilter("rc")} className={`h-10 rounded-xl border px-4 text-sm font-semibold tracking-[0.28px] ${filterPill(sectionFilter === "rc")}`}>
                Reading Comprehension
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.28px] text-[#0d47a1]">
              <LineChart className="size-4" />
              Priority ratings are assigned to tags based on your past performance and potential impact on your score.
            </p>
            <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold tracking-[0.24px] text-[#0d47a1] hover:underline">
              View all priorities
              <ExternalLink className="size-3.5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredTags.map((drill) => (
              <article key={drill.id} className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_5px_10px_rgba(13,13,18,0.06)]">
                <div
                  className={`flex h-12 items-center justify-center text-lg font-bold leading-[1.35] ${
                    drill.sectionTone === "lr" ? "bg-[#fffbeb] text-[#ae8b00]" : "bg-[#fff3ea] text-[#ff9d51]"
                  }`}
                >
                  {drill.sectionLabel}
                </div>
                <div className="space-y-5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="max-w-[150px] text-[28px] font-bold leading-[1.2] text-[#062357]">{drill.title}</h3>
                    <div className="rounded-[10px] bg-[#f3f7ff] px-2.5 py-2">
                      <p className="text-right text-[10px] font-semibold tracking-[0.24px]" style={{ color: drill.difficultyColor }}>
                        {drill.difficultyLabel}
                      </p>
                      <div className="mt-1 flex gap-1.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span key={index} className="h-4 w-1.5 rounded-full" style={{ backgroundColor: index < drill.filledBars ? drill.difficultyColor : "#ced0e7" }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="h-10 w-full rounded-2xl bg-[#0d47a1] text-sm font-semibold tracking-[0.28px] text-white shadow-[0px_5px_10px_rgba(13,13,18,0.06)] hover:bg-[#0d47a1]/90"
                  >
                    Start Drill
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </StudentMain>
    </>
  )
}

export { PracticeDrillsPage }
