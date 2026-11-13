import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { NextSessionCard } from "@/features/tutoring/components/next-session-card"
import { PackageStatusCard } from "@/features/tutoring/components/package-status-card"
import { PastSessionsPanel } from "@/features/tutoring/components/past-sessions-panel"
import { RescheduleSessionDialog } from "@/features/tutoring/components/reschedule-session-dialog"
import { TodoListSection } from "@/features/tutoring/components/todo-list-section"
import { TutoringPackagesSection } from "@/features/tutoring/components/tutoring-packages-section"
import { UpcomingSessionsList } from "@/features/tutoring/components/upcoming-sessions-list"
import { STUDENT_TUTORING_BOOK_HREF } from "@/features/app-shell/student-nav-config"
import { TUTORING_PACKAGES } from "@/features/tutoring/lib/mock-sessions-data"
import type {
  ActivePackageSummary,
  PastSessionRow,
  SessionTranscript,
  TodoTag,
  TutoringPackageId,
  TutoringSessionSummary,
  TutoringTodo,
} from "@/features/tutoring/lib/types"
import { StudentMain } from "@/features/student/components/student-main"
import { createTutoringApi, type TutoringSessionDto } from "@/lib/api/tutoring"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function mapSessionDto(session: TutoringSessionDto): TutoringSessionSummary {
  return {
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
  }
}

/** My Sessions — next booked session, package status, past sessions (Figma 21594:37515). */
function AfterBookingSessionsPage() {
  const navigate = useNavigate()
  const api = useMemo(() => createTutoringApi(getSupabaseBrowserClient()), [])
  const [selectedPackageId, setSelectedPackageId] = useState<TutoringPackageId>("pack-5")
  const [nextSession, setNextSession] = useState<TutoringSessionSummary | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<TutoringSessionSummary[]>([])
  const [pastSessions, setPastSessions] = useState<PastSessionRow[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<SessionTranscript | null>(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [todos, setTodos] = useState<TutoringTodo[]>([])
  const [todosLoading, setTodosLoading] = useState(false)
  const [activePackage, setActivePackage] = useState<ActivePackageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [rescheduleSession, setRescheduleSession] = useState<TutoringSessionSummary | null>(null)

  const loadSessionArtifacts = useCallback(
    async (sessionId: string, cancelled?: () => boolean) => {
      setSelectedSessionId(sessionId)
      setTranscriptLoading(true)
      setTodosLoading(true)
      try {
        // Transcript first so Zoom summary backfill can finish before listing todos.
        const t = await api.getTranscript(sessionId)
        if (cancelled?.()) return
        setTranscript(t)
        setTranscriptLoading(false)
        const todoResult = await api
          .listTodos(sessionId)
          .catch(() => ({ sessionId, todos: [] as TutoringTodo[] }))
        if (cancelled?.()) return
        setTodos(todoResult.todos)
      } catch {
        if (cancelled?.()) return
        setTranscript(null)
        setTodos([])
        setTranscriptLoading(false)
      } finally {
        if (!cancelled?.()) setTodosLoading(false)
      }
    },
    [api],
  )

  const refreshSessions = useCallback(
    async (cancelled?: () => boolean) => {
      const data = await api.listSessions()
      if (cancelled?.()) return
      const next = data.nextSession ? mapSessionDto(data.nextSession) : null
      setNextSession(next)
      setUpcomingSessions(data.upcomingSessions.map(mapSessionDto))
      const past = data.pastSessions.map((s) => ({
        id: s.id,
        dateLabel: s.dateLabel,
        tutorName: s.tutorName,
        focus: s.focus,
        transcriptStatus: s.transcriptStatus,
        recordingStatus: s.recordingStatus,
      }))
      setPastSessions(past)
      setActivePackage(data.activePackage)
      return past
    },
    [api],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void refreshSessions(() => cancelled)
      .then(async (past) => {
        if (cancelled || !past) return
        const firstWithArtifacts = past.find(
          (s) => s.transcriptStatus === "ready" || s.recordingStatus === "ready",
        )
        if (firstWithArtifacts) {
          await loadSessionArtifacts(firstWithArtifacts.id, () => cancelled)
        } else {
          setSelectedSessionId(null)
          setTranscript(null)
          setTodos([])
          setTranscriptLoading(false)
          setTodosLoading(false)
        }
      })
      .catch(() => {
        if (cancelled) return
        setNextSession(null)
        setUpcomingSessions([])
        setPastSessions([])
        setActivePackage(null)
        setSelectedSessionId(null)
        setTranscript(null)
        setTodos([])
        setTranscriptLoading(false)
        setTodosLoading(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loadSessionArtifacts, refreshSessions])

  async function handleToggleTodo(todoId: string, done: boolean) {
    const previous = todos
    setTodos((current) =>
      current.map((todo) => (todo.id === todoId ? { ...todo, done } : todo)),
    )
    try {
      const updated = await api.updateTodo({ todoId, done })
      if (!updated?.id) throw new Error("Invalid update response")
      setTodos((current) => current.map((todo) => (todo.id === todoId ? updated : todo)))
    } catch {
      setTodos(previous)
    }
  }

  async function handleAddTodo(input: {
    title: string
    tag: TodoTag
    dueAt?: string | null
  }) {
    if (!selectedSessionId) return
    const created = await api.createTodo({
      sessionId: selectedSessionId,
      title: input.title,
      tag: input.tag,
      dueAt: input.dueAt,
    })
    setTodos((current) => [...current, created])
  }

  async function handleEditTodo(
    todoId: string,
    input: { title: string; tag: TodoTag; dueAt?: string | null },
  ) {
    const previous = todos
    const dueAt = input.dueAt ?? null
    const dueLabel = dueAt
      ? `Due ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(dueAt))}`
      : "No due date"
    setTodos((current) =>
      current.map((todo) =>
        todo.id === todoId
          ? { ...todo, title: input.title, tag: input.tag, dueAt, dueLabel }
          : todo,
      ),
    )
    try {
      const updated = await api.updateTodo({
        todoId,
        title: input.title,
        tag: input.tag,
        dueAt,
      })
      if (!updated?.id) throw new Error("Invalid update response")
      setTodos((current) => current.map((todo) => (todo.id === todoId ? updated : todo)))
    } catch {
      setTodos(previous)
    }
  }

  return (
    <StudentMain
      className="bg-[var(--primary-0)]"
      contentClassName="flex flex-col gap-6 bg-[var(--primary-0)] pb-12"
    >
      <header>
        <h1 className="student-page-heading text-[18px] font-bold leading-[1.35]">My Sessions</h1>
        <p className="mt-2 text-sm tracking-[0.02em] text-[var(--greyscale-500)]">
          Join, reschedule and review your tutoring sessions.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-[var(--greyscale-500)]">Loading sessions…</p>
      ) : (
        <>
          <div className="flex flex-col gap-6 lg:flex-row">
            {nextSession ? (
              <NextSessionCard
                session={nextSession}
                onReschedule={() => setRescheduleSession(nextSession)}
                onJoin={() => {
                  if (nextSession.joinUrl) {
                    window.open(nextSession.joinUrl, "_blank", "noopener,noreferrer")
                  }
                }}
              />
            ) : (
              <section className="flex min-h-[231px] flex-1 flex-col justify-center rounded-[16px] border border-[var(--primary-25)] bg-[var(--greyscale-0)] p-6">
                <p className="text-xs font-bold tracking-[0.02em] text-[var(--primary)]">NEXT SESSION</p>
                <p className="mt-2.5 text-sm text-[var(--greyscale-500)]">
                  No upcoming session scheduled.
                </p>
                <Button asChild className="mt-4 h-12 w-fit rounded-[10px]">
                  <Link to={STUDENT_TUTORING_BOOK_HREF}>Book a session</Link>
                </Button>
              </section>
            )}
            {activePackage ? <PackageStatusCard packageSummary={activePackage} /> : null}
          </div>

          <PastSessionsPanel
            sessions={pastSessions}
            transcript={transcript}
            transcriptLoading={transcriptLoading}
            onSelectSession={(sessionId) => {
              void loadSessionArtifacts(sessionId)
            }}
          />

          <div>
            <TodoListSection
              todos={todos}
              sessionId={selectedSessionId}
              loading={todosLoading}
              onToggle={handleToggleTodo}
              onAdd={handleAddTodo}
              onEdit={handleEditTodo}
            />
            <UpcomingSessionsList
              sessions={upcomingSessions}
              onReschedule={(session) => setRescheduleSession(session)}
            />
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

export { AfterBookingSessionsPage }
