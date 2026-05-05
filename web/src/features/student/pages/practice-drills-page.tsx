import { useState } from "react"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { filterDrills, mockStudentDrills, type StudentDrill } from "@/features/student/lib/mock-drills"
import { Switch } from "@/components/ui/switch"
import { Clock, HelpCircle, Target } from "lucide-react"

function chip(active: boolean) {
  return active ? "bg-[#0d47a1] text-white border-[#0d47a1]" : "bg-[#f5f9ff] text-[#0d47a1] border-[#dfe1e7]"
}

function DrillRowCard({ drill }: { drill: StudentDrill }) {
  const ring = drill.accent === "mint" ? "text-[#45bda4]" : "text-[#f7994a]"
  return (
    <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <span
              className={`rounded-lg px-2 py-1 text-xs font-semibold text-white ${
                drill.accent === "mint" ? "bg-[#45bda4]" : "bg-[#f7994a]"
              }`}
            >
              {drill.section}
            </span>
            <div className={`relative flex size-20 items-center justify-center rounded-full border-4 border-[#dfe1e7] ${ring}`}>
              <span className="text-sm font-bold text-[#082c6b]">{drill.progressPct}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-[#082c6b]">{drill.title}</h3>
              <span className="rounded-md bg-[#f2e6dc] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#666d80]">Highest</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-[#666d80] sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-[#0d47a1]" />
                <div>
                  <p className="text-xs">Progress</p>
                  <p className="font-semibold text-[#082c6b]">{drill.progressPct}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4 text-[#0d47a1]" />
                <div>
                  <p className="text-xs">Questions</p>
                  <p className="font-semibold text-[#082c6b]">{drill.answered}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#0d47a1]" />
                <div>
                  <p className="text-xs">Time</p>
                  <p className="font-semibold text-[#082c6b]">{drill.timeLabel}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe1e7]">
              <div className="h-full rounded-full bg-[#0d47a1]" style={{ width: `${drill.progressPct}%` }} />
            </div>
            <p className="mt-2 text-right text-xs text-[#666d80]">Last attempt: {drill.lastAttempt}</p>
          </div>
        </div>
        <div className="flex items-end justify-end lg:w-40">
          <Button
            type="button"
            className={`w-full rounded-2xl font-semibold text-white lg:w-auto ${
              drill.accent === "mint" ? "bg-[#45bda4] hover:bg-[#45bda4]/90" : "bg-[#f7994a] hover:bg-[#f7994a]/90"
            }`}
          >
            Continue Drill
          </Button>
        </div>
      </div>
    </article>
  )
}

function PracticeDrillsPage() {
  const [pool, setPool] = useState<"adaptive" | "general">("adaptive")
  const [strictPool, setStrictPool] = useState(false)
  const [tab, setTab] = useState<"in_progress" | "saved" | "recent">("in_progress")
  const [sectionFilter, setSectionFilter] = useState<"all" | "lr" | "rc">("all")
  const drills = filterDrills(mockStudentDrills, sectionFilter)

  return (
    <>
      <StudentSubnavStrip crumbs={[{ label: "Practice", href: "/app/practice/drills" }, { label: "Drills" }]} />
      <StudentMain>
        <section className="mb-6 rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
          <p className="text-sm text-[#666d80]">Build mastery with targeted drills. Switch pool modes to match how you want to study.</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={pool === "adaptive" ? "default" : "outline"}
                size="sm"
                className="rounded-xl"
                onClick={() => setPool("adaptive")}
              >
                Adaptive Pool
              </Button>
              <Button
                type="button"
                variant={pool === "general" ? "default" : "outline"}
                size="sm"
                className="rounded-xl"
                onClick={() => setPool("general")}
              >
                General
              </Button>
              <span className="mx-2 hidden h-4 w-px bg-[#dfe1e7] md:inline" />
              <label className="flex items-center gap-2 text-sm font-medium text-[#082c6b]">
                <Switch checked={strictPool} onChange={(e) => setStrictPool(e.target.checked)} />
                Strict pool
              </label>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#efd2be] bg-[#f2e6dc] p-4">
              <p className="text-xs font-semibold text-[#666d80]">Logical Reasoning</p>
              <p className="mt-2 text-sm font-semibold text-[#082c6b]">Adaptive LR queue</p>
              <p className="mt-1 text-xs text-[#666d80]">Prioritizes missed skills from recent practice.</p>
            </div>
            <div className="rounded-2xl border border-[#b4ddd3] bg-[#d7ebe7] p-4">
              <p className="text-xs font-semibold text-[#666d80]">Reading Comprehension</p>
              <p className="mt-2 text-sm font-semibold text-[#082c6b]">Adaptive RC queue</p>
              <p className="mt-1 text-xs text-[#666d80]">Passage sets aligned to your difficulty band.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-[#082c6b]">Continue Drills</h2>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={tab === "in_progress" ? "default" : "outline"} className="rounded-xl" onClick={() => setTab("in_progress")}>
                In Progress
              </Button>
              <Button type="button" size="sm" variant={tab === "saved" ? "default" : "outline"} className="rounded-xl" onClick={() => setTab("saved")}>
                Saved for later
              </Button>
              <Button type="button" size="sm" variant={tab === "recent" ? "default" : "outline"} className="rounded-xl" onClick={() => setTab("recent")}>
                Recently completed
              </Button>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" className={`rounded-xl border px-3 py-1 text-xs font-semibold ${chip(sectionFilter === "all")}`} onClick={() => setSectionFilter("all")}>
              All Drills
            </button>
            <button type="button" className={`rounded-xl border px-3 py-1 text-xs font-semibold ${chip(sectionFilter === "lr")}`} onClick={() => setSectionFilter("lr")}>
              Logical Reasoning
            </button>
            <button type="button" className={`rounded-xl border px-3 py-1 text-xs font-semibold ${chip(sectionFilter === "rc")}`} onClick={() => setSectionFilter("rc")}>
              Reading Comprehension
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {drills.map((d) => (
              <DrillRowCard key={d.id} drill={d} />
            ))}
          </div>
        </section>
      </StudentMain>
    </>
  )
}

export { PracticeDrillsPage }
