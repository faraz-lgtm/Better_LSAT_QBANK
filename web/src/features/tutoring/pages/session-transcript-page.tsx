import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { STUDENT_TUTORING_SESSIONS_HREF } from "@/features/app-shell/student-nav-config"
import { SessionTranscriptViewer } from "@/features/tutoring/components/session-transcript-viewer"
import type { SessionTranscript } from "@/features/tutoring/lib/types"
import { StudentMain } from "@/features/student/components/student-main"
import { createTutoringApi } from "@/lib/api/tutoring"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/** My Sessions → View all Sessions → Session Transcript. */
function SessionTranscriptPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>()
  const api = useMemo(() => createTutoringApi(getSupabaseBrowserClient()), [])
  const [transcript, setTranscript] = useState<SessionTranscript | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setTranscript(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void api
      .getTranscript(sessionId)
      .then((data) => {
        if (cancelled) return
        setTranscript(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load transcript")
        setTranscript(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, sessionId])

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

        {loading ? (
          <p className="text-sm text-[var(--greyscale-500)]">Loading transcript…</p>
        ) : error ? (
          <p className="rounded-[14px] border border-dashed border-[#e4e9f2] px-4 py-10 text-center text-sm text-[var(--greyscale-500)]">
            {error}
          </p>
        ) : transcript && (transcript.lines.length > 0 || transcript.recordingUrl) ? (
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
