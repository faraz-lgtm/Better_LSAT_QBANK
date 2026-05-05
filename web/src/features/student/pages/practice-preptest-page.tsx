import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { mockPrepTestDetail, mockPrepTestSections } from "@/features/student/lib/mock-preptest"
import { Ban, ChevronRight } from "lucide-react"

function PracticePrepTestPage() {
  const d = mockPrepTestDetail

  return (
    <>
      <StudentSubnavStrip crumbs={[{ label: "Practice", href: "/app/practice/drills" }, { label: "PrepTest" }]} />
      <StudentMain>
        <div className="mb-2 flex items-center justify-between">
          <button type="button" className="text-sm font-semibold text-[#0d47a1] hover:underline">
            {d.parentLabel}
          </button>
          <Button type="button" variant="ghost" size="icon" className="text-[#666d80]" aria-label="Close">
            <Ban className="size-5" />
          </Button>
        </div>

        <section className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#082c6b] md:text-3xl">{d.headline}</h1>
              <p className="mt-6 text-3xl font-bold text-[#082c6b]">{d.label}</p>
              <div className="mt-6 grid max-w-md grid-cols-2 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[#efd2be] bg-[#f2e6dc] p-4">
                  <p className="text-xs text-[#666d80]">LR preview</p>
                  <p className="mt-2 text-sm font-semibold text-[#082c6b]">Section 1</p>
                </div>
                <div className="rounded-xl border border-[#b4ddd3] bg-[#d7ebe7] p-4">
                  <p className="text-xs text-[#666d80]">RC preview</p>
                  <p className="mt-2 text-sm font-semibold text-[#082c6b]">Section 2</p>
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <dt className="text-xs text-[#666d80]">Questions</dt>
                <dd className="text-lg font-semibold text-[#082c6b]">{d.questionCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#666d80]">Total Time</dt>
                <dd className="text-lg font-semibold text-[#082c6b]">{d.totalMinutes} min</dd>
              </div>
              <div>
                <dt className="text-xs text-[#666d80]">Sections</dt>
                <dd className="text-lg font-semibold text-[#082c6b]">{d.sectionCount}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-xl font-semibold text-[#082c6b]">Test Section</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {mockPrepTestSections.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dfe1e7] bg-[#f6f8fa] px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-[#082c6b]">{row.label}</p>
                  <p className="text-xs text-[#666d80]">
                    {row.questions} questions · {row.minutes} minutes
                  </p>
                </div>
                <Button type="button" className="rounded-xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90">
                  Begin
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </StudentMain>
    </>
  )
}

export { PracticePrepTestPage }
