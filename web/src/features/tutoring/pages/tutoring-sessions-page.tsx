import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PastSessionsTable } from "@/features/tutoring/components/past-sessions-table"
import { RescheduleSessionDialog } from "@/features/tutoring/components/reschedule-session-dialog"
import { UpcomingSessionsList } from "@/features/tutoring/components/upcoming-sessions-list"
import { STUDENT_TUTORING_BOOK_HREF } from "@/features/app-shell/student-nav-config"
import type { PastSessionRow, TutoringSessionSummary } from "@/features/tutoring/lib/types"
import { StudentMain } from "@/features/student/components/student-main"
import { createTutoringApi } from "@/lib/api/tutoring"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/** View all Sessions screen (`/app/tutoring/sessions/all`). */
function TutoringSessionsPage() {
  const api = useMemo(() => createTutoringApi(getSupabaseBrowserClient()), [])
  const [sessions, setSessions] = useState<PastSessionRow[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<TutoringSessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rescheduleSession, setRescheduleSession] = useState<TutoringSessionSummary | null>(null)

  const refreshSessions = useCallback(async () => {
    const data = await api.listSessions()
    setUpcomingSessions(
      data.upcomingSessions.map((session) => ({
        id: session.id,
        month: session.month,
        day: session.day,
        title: session.title,
        whenLabel: session.whenLabel,
        tutorName: session.tutorName,
        tutorInitials: session.tutorInitials,
        focus: session.focus,
        action: session.action,
        joinUrl: session.joinUrl,
      })),
    )
    setSessions(
      data.pastSessions.map((s) => ({
        id: s.id,
        dateLabel: s.dateLabel,
        tutorName: s.tutorName,
        focus: s.focus,
        transcriptStatus: s.transcriptStatus,
        recordingStatus: s.recordingStatus,
      })),
    )
  }, [api])

  useEffect(() => {
    let cancelled = false
    void refreshSessions()
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load sessions")
        setSessions([])
        setUpcomingSessions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshSessions])

  return (
    <StudentMain
      className="bg-[var(--primary-0)]"
      contentClassName="flex flex-col gap-6 bg-[var(--primary-0)] pb-12"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="student-page-heading text-[18px] font-bold leading-[1.35]">View all Sessions</h1>
          <p className="mt-2 text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
            Join, reschedule and review your tutoring sessions.
          </p>
        </div>
        <Button asChild size="lg" className="h-12 shrink-0 rounded-[10px] px-4">
          <Link to={STUDENT_TUTORING_BOOK_HREF}>Book More Sessions</Link>
        </Button>
      </header>

      {loading ? (
        <p className="text-sm text-[var(--greyscale-500)]">Loading sessions…</p>
      ) : error ? (
        <p className="rounded-[14px] border border-dashed border-[#e4e9f2] px-4 py-10 text-center text-sm text-[var(--greyscale-500)]">
          {error}
        </p>
      ) : sessions.length === 0 && upcomingSessions.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-[#e4e9f2] px-4 py-10 text-center text-sm text-[var(--greyscale-500)]">
          No sessions yet. Book a tutoring session to get started.
        </p>
      ) : (
        <div className="space-y-6">
          {upcomingSessions.length > 0 ? (
            <UpcomingSessionsList
              sessions={upcomingSessions}
              showViewAllLink={false}
              onReschedule={(session) => setRescheduleSession(session)}
            />
          ) : null}
          {sessions.length > 0 ? <PastSessionsTable sessions={sessions} /> : null}
        </div>
      )}

      <RescheduleSessionDialog
        open={rescheduleSession != null}
        onOpenChange={(open) => {
          if (!open) setRescheduleSession(null)
        }}
        session={rescheduleSession}
        api={api}
        onRescheduled={async () => {
          await refreshSessions()
        }}
      />
    </StudentMain>
  )
}

export { TutoringSessionsPage }
