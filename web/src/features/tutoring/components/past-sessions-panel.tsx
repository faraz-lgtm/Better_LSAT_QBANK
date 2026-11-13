import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { STUDENT_TUTORING_SESSIONS_ALL_HREF } from "@/features/app-shell/student-nav-config"
import { SessionTranscriptViewer } from "@/features/tutoring/components/session-transcript-viewer"
import type { PastSessionRow, SessionTranscript } from "@/features/tutoring/lib/types"
import { cn } from "@/lib/utils"

type PastSessionsPanelProps = {
  sessions: PastSessionRow[]
  transcript: SessionTranscript | null
  transcriptLoading?: boolean
  onSelectSession?: (sessionId: string) => void
}

function sessionHasArtifacts(session: PastSessionRow): boolean {
  return session.transcriptStatus === "ready" || session.recordingStatus === "ready"
}

function sessionIsProcessing(session: PastSessionRow): boolean {
  return session.transcriptStatus === "processing" || session.recordingStatus === "processing"
}

function PastSessionsPanel({
  sessions,
  transcript,
  transcriptLoading = false,
  onSelectSession,
}: PastSessionsPanelProps) {
  const defaultId =
    transcript?.sessionId ??
    sessions.find(sessionHasArtifacts)?.id ??
    sessions[0]?.id ??
    ""
  const [activeSessionId, setActiveSessionId] = useState(defaultId)

  useEffect(() => {
    if (transcript?.sessionId) {
      setActiveSessionId(transcript.sessionId)
    }
  }, [transcript?.sessionId])

  function selectSession(session: PastSessionRow) {
    if (!sessionHasArtifacts(session)) return
    setActiveSessionId(session.id)
    onSelectSession?.(session.id)
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const showViewer =
    Boolean(transcript) &&
    activeSessionId === transcript?.sessionId &&
    (Boolean(transcript?.recordingUrl) ||
      Boolean(transcript?.zoomShareUrl) ||
      (transcript?.lines.length ?? 0) > 0)

  return (
    <section className="rounded-[16px] border border-[#e4e9f2] bg-[var(--greyscale-0)] p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">Past Sessions</h2>
        <Link
          to={STUDENT_TUTORING_SESSIONS_ALL_HREF}
          className="text-[13px] font-semibold text-[var(--primary)] hover:underline"
        >
          View all
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="mt-4 rounded-[14px] border border-dashed border-[#e4e9f2] px-4 py-8 text-center text-sm text-[var(--greyscale-500)]">
          No past sessions yet.
        </p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e4e9f2] text-[var(--greyscale-500)]">
                  <th className="px-2 py-2.5 font-medium">Date</th>
                  <th className="px-2 py-2.5 font-medium">Tutor</th>
                  <th className="px-2 py-2.5 font-medium">Focus</th>
                  <th className="px-2 py-2.5 font-bold">Recording &amp; Transcript</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const active = session.id === activeSessionId
                  const ready = sessionHasArtifacts(session)
                  const processing = sessionIsProcessing(session)
                  return (
                    <tr key={session.id} className="border-b border-[#f0f3f8] last:border-b-0">
                      <td className="px-2 py-3.5 text-[var(--color-student-heading)]">{session.dateLabel}</td>
                      <td className="px-2 py-3.5 font-semibold text-[var(--color-student-heading)]">
                        {session.tutorName}
                      </td>
                      <td className="px-2 py-3.5 text-[var(--color-student-heading)]">{session.focus}</td>
                      <td className="px-2 py-3.5">
                        {ready ? (
                          <button
                            type="button"
                            onClick={() => selectSession(session)}
                            className={cn(
                              "text-xs tracking-[0.02em] hover:underline",
                              active
                                ? "font-semibold text-[var(--primary)]"
                                : "font-normal text-[var(--primary)]",
                            )}
                          >
                            {active && showViewer
                              ? "Viewing"
                              : session.recordingStatus === "ready" && session.transcriptStatus !== "ready"
                                ? "View recording"
                                : session.transcriptStatus === "ready" && session.recordingStatus !== "ready"
                                  ? "View transcript"
                                  : "View recording & transcript"}
                          </button>
                        ) : processing ? (
                          <span className="text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
                            Processing…
                          </span>
                        ) : (
                          <span className="text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
                            Not available
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {transcriptLoading && activeSession && sessionHasArtifacts(activeSession) ? (
            <p className="mt-4 text-sm text-[var(--greyscale-500)]">Loading recording &amp; transcript…</p>
          ) : showViewer && transcript ? (
            <SessionTranscriptViewer transcript={transcript} className="mt-4" />
          ) : activeSession && sessionHasArtifacts(activeSession) ? (
            <p className="mt-4 rounded-[14px] border border-dashed border-[#e4e9f2] px-4 py-8 text-center text-sm text-[var(--greyscale-500)]">
              Could not load recording or transcript for this session.
            </p>
          ) : (
            <p className="mt-4 rounded-[14px] border border-dashed border-[#e4e9f2] px-4 py-8 text-center text-sm text-[var(--greyscale-500)]">
              Select a past session with a ready recording or transcript to view it here.
            </p>
          )}
        </>
      )}
    </section>
  )
}

export { PastSessionsPanel }
