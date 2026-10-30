import { StudentMain } from "@/features/student/components/student-main"

/** Placeholder — live class schedule lands in a follow-up. */
function LiveClassesPage() {
  return (
    <StudentMain contentClassName="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">Tutoring</p>
      <h1 className="student-page-heading mt-2">Live Classes</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--greyscale-500)]">
        Live classes are coming soon. We&apos;ll announce the schedule here when sessions open.
      </p>
    </StudentMain>
  )
}

export { LiveClassesPage }
