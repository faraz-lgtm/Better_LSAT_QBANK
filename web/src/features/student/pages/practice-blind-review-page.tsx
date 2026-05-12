import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"

function PracticeBlindReviewPage() {
  return (
    <>
      <StudentSubnavStrip crumbs={[{ label: "Practice", href: "/app/practice/drills" }, { label: "Blind Review" }]} />
      <StudentMain>
        <section className="rounded-2xl border border-[#dfe1e7] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-[color:var(--color-student-heading)]">Blind Review</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#666d80]">
            Revisit missed questions without seeing correct answers first. Queue will populate from completed PrepTests and timed
            sections once backend sync is available.
          </p>
          <Button type="button" className="mt-6 rounded-2xl bg-[color:var(--color-student-accent)] text-white hover:opacity-90">
            Start blind review (sample)
          </Button>
        </section>
      </StudentMain>
    </>
  )
}

export { PracticeBlindReviewPage }
