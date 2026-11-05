import { useState } from "react"
import { Link } from "react-router-dom"

import { STUDENT_TUTORING_SESSIONS_HREF } from "@/features/app-shell/student-nav-config"
import { SessionTranscriptViewer } from "@/features/tutoring/components/session-transcript-viewer"
import type { PastSessionRow, SessionTranscript } from "@/features/tutoring/lib/types"
import { cn } from "@/lib/utils"

type PastSessionsPanelProps = {
  sessions: PastSessionRow[]
  transcript: SessionTranscript | null
}

function PastSessionsPanel({ sessions, transcript }: PastSessionsPanelProps) {
  const [activeSessionId, setActiveSessionId] = useState(transcript?.sessionId ?? sessions[0]?.id ?? "")

  return (
    <section className="rounded-[16px] border border-[#e4e9f2] bg-[var(--greyscale-0)] p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">Past Sessions</h2>
        <Link
          to={STUDENT_TUTORING_SESSIONS_HREF}
          className="text-[13px] font-semibold text-[var(--primary)] hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#e4e9f2] text-[var(--greyscale-500)]">
              <th className="px-2 py-2.5 font-medium">Date</th>
              <th className="px-2 py-2.5 font-medium">Tutor</th>
              <th className="px-2 py-2.5 font-medium">Focus</th>
              <th className="px-2 py-2.5 font-bold">Transcript</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const active = session.id === activeSessionId
              return (
                <tr key={session.id} className="border-b border-[#f0f3f8] last:border-b-0">
                  <td className="px-2 py-3.5 text-[var(--color-student-heading)]">{session.dateLabel}</td>
                  <td className="px-2 py-3.5 font-semibold text-[var(--color-student-heading)]">
                    {session.tutorName}
                  </td>
                  <td className="px-2 py-3.5 text-[var(--color-student-heading)]">{session.focus}</td>
                  <td className="px-2 py-3.5">
                    <button
                      type="button"
                      onClick={() => setActiveSessionId(session.id)}
                      className={cn(
                        "text-xs tracking-[0.02em] hover:underline",
                        active
                          ? "font-semibold text-[var(--primary)]"
                          : "font-normal text-[var(--color-student-heading)]",
                      )}
                    >
                      {active ? "Viewing Transcript" : "Transcript"}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {transcript && activeSessionId === transcript.sessionId ? (
        <SessionTranscriptViewer transcript={transcript} className="mt-4" />
      ) : (
        <p className="mt-4 rounded-[14px] border border-dashed border-[#e4e9f2] px-4 py-8 text-center text-sm text-[var(--greyscale-500)]">
          Select a past session to view its transcript.
        </p>
      )}
    </section>
  )
}

export { PastSessionsPanel }
