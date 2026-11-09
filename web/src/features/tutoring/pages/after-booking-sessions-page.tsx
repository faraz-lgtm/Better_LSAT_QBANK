import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { NextSessionCard } from "@/features/tutoring/components/next-session-card"
import { PackageStatusCard } from "@/features/tutoring/components/package-status-card"
import { PastSessionsPanel } from "@/features/tutoring/components/past-sessions-panel"
import { TodoListSection } from "@/features/tutoring/components/todo-list-section"
import { TutoringPackagesSection } from "@/features/tutoring/components/tutoring-packages-section"
import { UpcomingSessionsList } from "@/features/tutoring/components/upcoming-sessions-list"
import {
  STUDENT_TUTORING_BOOK_HREF,
  STUDENT_TUTORING_SESSIONS_HREF,
} from "@/features/app-shell/student-nav-config"
import { MOCK_TUTORING_SESSIONS, TUTORING_PACKAGES } from "@/features/tutoring/lib/mock-sessions-data"
import type {
  PastSessionRow,
  SessionTranscript,
  TutoringPackageId,
  TutoringSessionSummary,
} from "@/features/tutoring/lib/types"
import { StudentMain } from "@/features/student/components/student-main"
import { createTutoringApi } from "@/lib/api/tutoring"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function AfterBookingSessionsPage() {
  const navigate = useNavigate()
  const api = useMemo(() => createTutoringApi(getSupabaseBrowserClient()), [])
  const [selectedPackageId, setSelectedPackageId] = useState<TutoringPackageId>("pack-5")
  const [nextSession, setNextSession] = useState<TutoringSessionSummary | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<TutoringSessionSummary[]>([])
  const [pastSessions, setPastSessions] = useState<PastSessionRow[]>([])
  const [transcript, setTranscript] = useState<SessionTranscript | null>(null)
  const [activePackage, setActivePackage] = useState(MOCK_TUTORING_SESSIONS.activePackage)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void api
      .listSessions()
      .then(async (data) => {
        if (cancelled) return
        const next = data.nextSession
          ? {
              id: data.nextSession.id,
              month: data.nextSession.month,
              day: data.nextSession.day,
              title: data.nextSession.title,
              whenLabel: data.nextSession.whenLabel,
              tutorName: data.nextSession.tutorName,
              tutorInitials: data.nextSession.tutorInitials,
              focus: data.nextSession.focus,
              action: data.nextSession.action,
              joinUrl: data.nextSession.joinUrl,
            }
          : null
        setNextSession(next)
        setUpcomingSessions(
          data.upcomingSessions.map((s) => ({
            id: s.id,
            month: s.month,
            day: s.day,
            title: s.title,
            whenLabel: s.whenLabel,
            tutorName: s.tutorName,
            tutorInitials: s.tutorInitials,
            focus: s.focus,
            action: s.action,
            joinUrl: s.joinUrl,
          })),
        )
        setPastSessions(
          data.pastSessions.map((s) => ({
            id: s.id,
            dateLabel: s.dateLabel,
            tutorName: s.tutorName,
            focus: s.focus,
            transcriptStatus: s.transcriptStatus,
            recordingStatus: s.recordingStatus,
          })),
        )
        if (data.activePackage) setActivePackage(data.activePackage)

        const firstPastWithTranscript = data.pastSessions.find((s) => s.transcriptStatus === "ready")
        if (firstPastWithTranscript) {
          try {
            const t = await api.getTranscript(firstPastWithTranscript.id)
            if (!cancelled) setTranscript(t)
          } catch {
            if (!cancelled) setTranscript(null)
          }
        } else if (!cancelled) {
          setTranscript(null)
        }
      })
      .catch(() => {
        if (cancelled) return
        setNextSession(null)
        setUpcomingSessions([])
        setPastSessions([])
        setTranscript(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api])

  return (
    <StudentMain
      className="bg-[var(--primary-0)]"
      contentClassName="flex flex-col gap-6 bg-[var(--primary-0)] pb-12"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="student-page-heading text-[18px] font-bold leading-[1.35]">My Sessions</h1>
          <p className="mt-2 text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
            Start with a strategy call, then choose the level of support that fits your prep.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="h-10 rounded-[10px]">
            <Link to={STUDENT_TUTORING_BOOK_HREF}>View booking screen</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10 rounded-[10px]">
            <Link to={STUDENT_TUTORING_SESSIONS_HREF}>View all Sessions</Link>
          </Button>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-[var(--greyscale-500)]">Loading sessions…</p>
      ) : (
        <>
          <div className="flex flex-col gap-6 lg:flex-row">
            {nextSession ? (
              <NextSessionCard
                session={nextSession}
                onJoin={() => {
                  if (nextSession.joinUrl) window.open(nextSession.joinUrl, "_blank", "noopener,noreferrer")
                }}
              />
            ) : (
              <section className="flex min-h-[231px] flex-1 flex-col justify-center rounded-[16px] border border-[var(--primary-25)] bg-[var(--greyscale-0)] p-6">
                <p className="text-sm text-[var(--greyscale-500)]">No upcoming session scheduled.</p>
                <Button asChild className="mt-4 h-12 w-fit rounded-[10px]">
                  <Link to={STUDENT_TUTORING_BOOK_HREF}>Book a session</Link>
                </Button>
              </section>
            )}
            {activePackage ? <PackageStatusCard packageSummary={activePackage} /> : null}
          </div>

          <PastSessionsPanel sessions={pastSessions} transcript={transcript} />

          <div>
            <TodoListSection todos={MOCK_TUTORING_SESSIONS.todos} />
            <UpcomingSessionsList sessions={upcomingSessions} />
          </div>
        </>
      )}

      <TutoringPackagesSection
        packages={TUTORING_PACKAGES}
        title="Book your next Sessions"
        ctaLabel="Book More Sessions"
        helperLinkLabel="Talk to Us →"
        selectedPackageId={selectedPackageId}
        onSelectPackage={setSelectedPackageId}
        onCtaClick={() => navigate(STUDENT_TUTORING_BOOK_HREF)}
        onHelperClick={() => navigate(STUDENT_TUTORING_BOOK_HREF)}
      />
    </StudentMain>
  )
}

export { AfterBookingSessionsPage }
