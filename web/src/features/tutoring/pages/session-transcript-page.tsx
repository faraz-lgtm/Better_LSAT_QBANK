import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { STUDENT_TUTORING_SESSIONS_HREF } from "@/features/app-shell/student-nav-config"
import { SessionTranscriptViewer } from "@/features/tutoring/components/session-transcript-viewer"
import { getSessionTranscriptById } from "@/features/tutoring/lib/mock-sessions-data"
import { StudentMain } from "@/features/student/components/student-main"

/** My Sessions → View all Sessions → Session Transcript. */
function SessionTranscriptPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>()
  const transcript = getSessionTranscriptById(sessionId)

  return (
    <StudentMain
      className="bg-[var(--primary-0)]"
      contentClassName="flex flex-col gap-6 bg-[var(--primary-0)] pb-12"
    >
      <header>
        <h1 className="student-page-heading text-[18px] font-bold leading-[1.35]">Session Transcript</h1>
        <p className="mt-2 text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
          Join, reschedule and review your tutoring sessions.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-[16px] border border-[#e4e9f2] bg-[var(--greyscale-0)] p-6">
        <Link
          to={STUDENT_TUTORING_SESSIONS_HREF}
          className="inline-flex w-fit items-center gap-1.5 text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)] hover:underline"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Back
        </Link>

        {transcript ? (
          <SessionTranscriptViewer transcript={transcript} />
        ) : (
          <p className="rounded-[14px] border border-dashed border-[#e4e9f2] px-4 py-10 text-center text-sm text-[var(--greyscale-500)]">
            No transcript is available for this session yet.
          </p>
        )}
      </section>
    </StudentMain>
  )
}

export { SessionTranscriptPage }
