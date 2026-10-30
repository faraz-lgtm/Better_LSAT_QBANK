import { StudentMain } from "@/features/student/components/student-main"

/** Placeholder — tutoring booking UI lands in a follow-up. */
function TutoringSessionsPage() {
  return (
    <StudentMain contentClassName="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">Tutoring</p>
      <h1 className="student-page-heading mt-2">Book 1 on 1 Sessions</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--greyscale-500)]">
        One-on-one tutoring booking is coming soon. Check back shortly to schedule a session with a betterLSAT tutor.
      </p>
    </StudentMain>
  )
}

export { TutoringSessionsPage }
