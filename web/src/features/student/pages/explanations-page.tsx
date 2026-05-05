import { useState } from "react"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { mockExplanationRows } from "@/features/student/lib/mock-explanations"
import { BookOpen, PlayCircle, Video } from "lucide-react"

function ExplanationsPage() {
  const [filter, setFilter] = useState<"all" | "lr" | "rc">("all")
  const rows = mockExplanationRows.filter((r) => (filter === "all" ? true : r.section === filter.toUpperCase()))

  return (
    <>
      <StudentSubnavStrip
        crumbs={[
          { label: "Learn", href: "/app/prep-course" },
          { label: "Explanations" },
        ]}
      />
      <StudentMain>
        <div className="mb-6 flex flex-col gap-4 border-b border-[#dfe1e7] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#082c6b] md:text-3xl">LSAT Question Explanations</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#666d80]">
              Video and written explanations for questions you&apos;ve attempted. Filter by section or jump to a PrepTest.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant={filter === "all" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setFilter("all")}>
              All
            </Button>
            <Button type="button" variant={filter === "lr" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setFilter("lr")}>
              LR
            </Button>
            <Button type="button" variant={filter === "rc" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setFilter("rc")}>
              RC
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-xl border-[#0d47a1] text-[#0d47a1]">
              PrepTest
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
          <div className="grid grid-cols-[1fr_100px_120px_140px] gap-2 border-b border-[#dfe1e7] bg-[#f3f7ff] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#666d80] md:grid-cols-[1fr_120px_140px_160px]">
            <span>Question</span>
            <span className="hidden sm:inline">Section</span>
            <span>Topic</span>
            <span className="text-right">Media</span>
          </div>
          <ul className="divide-y divide-[#dfe1e7]">
            {rows.map((row) => (
              <li key={row.id} className="grid grid-cols-1 gap-2 px-4 py-4 sm:grid-cols-[1fr_120px_140px_160px] sm:items-center">
                <div className="flex min-w-0 flex-col">
                  <span className="font-semibold text-[#082c6b]">
                    {row.prepTest} · {row.section} · {row.question}
                  </span>
                  <span className="text-sm text-[#666d80] sm:hidden">{row.topic}</span>
                </div>
                <span className="hidden text-sm font-medium text-[#082c6b] sm:inline">{row.section}</span>
                <span className="hidden text-sm text-[#666d80] sm:inline">{row.topic}</span>
                <div className="flex justify-end gap-2">
                  {row.hasVideo ? (
                    <Button type="button" size="sm" variant="outline" className="rounded-xl border-[#0d47a1] text-[#0d47a1]">
                      <Video className="size-4" />
                      <span className="ml-1 hidden md:inline">Watch</span>
                    </Button>
                  ) : null}
                  <Button type="button" size="sm" className="rounded-xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90">
                    <BookOpen className="size-4" />
                    <span className="ml-1 hidden md:inline">Read</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs text-[#666d80]">
          <PlayCircle className="size-4 shrink-0 text-[#0d47a1]" />
          Explanations unlock as you work questions in drills and PrepTests. This list uses sample data until your history syncs.
        </p>
      </StudentMain>
    </>
  )
}

export { ExplanationsPage }
