import { useCallback, useEffect, useMemo, useState } from "react"

import { RescheduleSessionDialog } from "@/features/tutoring/components/reschedule-session-dialog"
import { SessionTranscriptViewer } from "@/features/tutoring/components/session-transcript-viewer"
import { StrategyCallHero } from "@/features/tutoring/components/strategy-call-hero"
import { StrategyCallScheduler } from "@/features/tutoring/components/strategy-call-scheduler"
import { StrategyCallStatusCard } from "@/features/tutoring/components/strategy-call-status-card"
import { TutoringTestimonials } from "@/features/tutoring/components/tutoring-testimonials"
import { MOCK_TUTORING_SESSIONS } from "@/features/tutoring/lib/mock-sessions-data"
import type { SessionTranscript, TutoringSessionSummary } from "@/features/tutoring/lib/types"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import {
  createTutoringApi,
  type FreeStrategyCallDto,
} from "@/lib/api/tutoring"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function toRescheduleSummary(session: FreeStrategyCallDto): TutoringSessionSummary {
  return {
    id: session.id,
    month: "",
    day: "",
    title: session.title,
    whenLabel: `${session.dateLabel} · ${session.timeLabel}`,
    tutorName: session.tutorName,
    tutorInitials: session.tutorName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join(""),
    focus: session.focus,
    action: "reschedule",
    joinUrl: session.joinUrl,
  }
}

function FreeStrategyCallPage() {
  const api = useMemo(() => createTutoringApi(getSupabaseBrowserClient()), [])
  const [freeStrategyCall, setFreeStrategyCall] = useState<FreeStrategyCallDto | null>(null)
  const [loadingBookingStatus, setLoadingBookingStatus] = useState(true)
  const [transcript, setTranscript] = useState<SessionTranscript | null>(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [rescheduleSession, setRescheduleSession] = useState<TutoringSessionSummary | null>(null)

  const refreshBooking = useCallback(
    async (cancelled?: () => boolean) => {
      const data = await api.listSessions()
      if (cancelled?.()) return null
      const session = data.freeStrategyCall ?? null
      setFreeStrategyCall(session)
      return session
    },
    [api],
  )

  useEffect(() => {
    let cancelled = false
    setLoadingBookingStatus(true)
    void refreshBooking(() => cancelled)
      .then(async (session) => {
        if (cancelled || !session?.isCompleted) {
          setTranscript(null)
          return
        }
        setTranscriptLoading(true)
        try {
          const t = await api.getTranscript(session.id)
          if (!cancelled) setTranscript(t)
        } catch {
          if (!cancelled) setTranscript(null)
        } finally {
          if (!cancelled) setTranscriptLoading(false)
        }
      })
      .catch(() => {
        if (cancelled) return
        setFreeStrategyCall(null)
        setTranscript(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingBookingStatus(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, refreshBooking])

  function scrollToScheduler() {
    window.requestAnimationFrame(() => {
      document.getElementById("strategy-call-scheduler")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const alreadyBooked = Boolean(freeStrategyCall)

  return (
    <StudentMain
      className="bg-[var(--primary-0)]"
      contentClassName="flex flex-col gap-6 bg-[var(--primary-0)] pb-12"
    >
      <header>
        <h1 className="student-page-heading text-[18px] font-bold leading-[1.35]">
          Free 15-Minute Strategy Call
        </h1>
        <p className="mt-2 max-w-[920px] text-sm leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
          Talk to a 175+ LSAT scorer about your score, your test date, and what to fix first. It&apos;s free, and
          there&apos;s no pressure to buy anything.
        </p>
      </header>

      {loadingBookingStatus ? (
        <StudentPageLoader centered label="Loading your strategy call…" />
      ) : null}

      {!loadingBookingStatus && freeStrategyCall ? (
        <>
          <StrategyCallStatusCard
            session={freeStrategyCall}
            onReschedule={() => setRescheduleSession(toRescheduleSummary(freeStrategyCall))}
            onJoin={() => {
              if (freeStrategyCall.joinUrl) {
                window.open(freeStrategyCall.joinUrl, "_blank", "noopener,noreferrer")
              }
            }}
          />
          {freeStrategyCall.isCompleted && transcript ? (
            <SessionTranscriptViewer transcript={transcript} />
          ) : null}
          {freeStrategyCall.isCompleted && transcriptLoading ? (
            <StudentPageLoader label="Loading transcript…" />
          ) : null}
        </>
      ) : null}

      {!loadingBookingStatus && !alreadyBooked ? (
        <>
          <StrategyCallHero onBookClick={scrollToScheduler} />
          <StrategyCallScheduler alwaysOpen />
        </>
      ) : null}

      <TutoringTestimonials testimonials={MOCK_TUTORING_SESSIONS.testimonials} />

      <RescheduleSessionDialog
        open={Boolean(rescheduleSession)}
        onOpenChange={(open) => {
          if (!open) setRescheduleSession(null)
        }}
        session={rescheduleSession}
        api={api}
        timeZone={freeStrategyCall?.timezone ?? undefined}
        onRescheduled={async () => {
          await refreshBooking()
        }}
      />
    </StudentMain>
  )
}

export { FreeStrategyCallPage }
