import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { mockSectionModeCards } from "@/features/student/lib/mock-sections"
import { ArrowLeft, Ban, BookOpen } from "lucide-react"

function SectionCard({ card }: { card: (typeof mockSectionModeCards)[0] }) {
  const warm = card.section === "LR"
  return (
    <article
      className={`flex flex-col rounded-2xl border p-4 shadow-sm ${
        warm ? "border-[#efd2be] bg-[#f2e6dc]" : "border-[#b4ddd3] bg-[#d7ebe7]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${warm ? "text-[#f7994a]" : "text-[#45bda4]"}`}>{card.section}</p>
          <h3 className="mt-2 text-lg font-semibold text-[#082c6b]">{card.title}</h3>
          <p className="mt-1 text-sm text-[#666d80]">{card.subtitle}</p>
        </div>
        <BookOpen className="size-6 shrink-0 text-[#082c6b]/40" />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-[#666d80]">Questions</dt>
          <dd className="font-semibold text-[#082c6b]">{card.questionCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#666d80]">Time</dt>
          <dd className="font-semibold text-[#082c6b]">{card.timeMinutes} min</dd>
        </div>
      </dl>
      <Button type="button" className="mt-4 w-full rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90">
        Start section
      </Button>
    </article>
  )
}

function PracticeSectionsPage() {
  return (
    <>
      <StudentSubnavStrip crumbs={[{ label: "Practice", href: "/app/practice/drills" }, { label: "Sections" }]} />
      <StudentMain>
        <section className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-[#666d80]">Take a complete section from an official PrepTest.</p>
              <h1 className="mt-2 text-2xl font-semibold text-[#082c6b] md:text-3xl">Sections</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-xl">
                Practice pool
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-xl">
                Filters
              </Button>
              <span className="rounded-lg border border-[#dfe1e7] px-2 py-1 text-xs font-semibold text-[#666d80]">0</span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {mockSectionModeCards.map((c) => (
              <SectionCard key={c.id} card={c} />
            ))}
          </div>

          <div className="mt-10 border-t border-[#dfe1e7] pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link
                  to="/app/practice/drills"
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-[#dfe1e7] bg-white text-[#082c6b] hover:bg-[#f5f9ff]"
                  aria-label="Back to drills"
                >
                  <ArrowLeft className="size-5" />
                </Link>
                <div>
                  <h2 className="text-xl font-semibold text-[#082c6b]">Reading Comprehension</h2>
                  <p className="text-sm text-[#666d80]">
                    <button type="button" className="font-semibold text-[#0d47a1] hover:underline">
                      Go to your practice pool settings
                    </button>{" "}
                    to change what sections are available.
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" className="rounded-full text-[#666d80]" aria-label="Dismiss">
                <Ban className="size-5" />
              </Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {["Passage A", "Passage B", "Passage C"].map((label) => (
                <article key={label} className="rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] p-4">
                  <p className="text-xs font-semibold uppercase text-[#666d80]">RC</p>
                  <h3 className="mt-2 font-semibold text-[#082c6b]">{label}</h3>
                  <p className="mt-2 text-sm text-[#666d80]">Sample passage set from your pool. Start when you&apos;re ready.</p>
                  <Button type="button" variant="outline" className="mt-4 w-full rounded-xl border-[#0d47a1] text-[#0d47a1]">
                    Configure
                  </Button>
                </article>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-2xl">
                Back
              </Button>
              <Button type="button" className="rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90">
                Continue
              </Button>
            </div>
          </div>
        </section>
      </StudentMain>
    </>
  )
}

export { PracticeSectionsPage }
