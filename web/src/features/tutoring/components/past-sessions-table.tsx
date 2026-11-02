import { Link } from "react-router-dom"

import {
  STUDENT_TUTORING_SESSIONS_HREF,
  studentTutoringSessionTranscriptHref,
} from "@/features/app-shell/student-nav-config"
import type { PastSessionRow } from "@/features/tutoring/lib/types"
import { cn } from "@/lib/utils"

type PastSessionsTableProps = {
  sessions: PastSessionRow[]
  showViewAllLink?: boolean
  viewAllHref?: string
  onTranscriptClick?: (sessionId: string) => void
  activeSessionId?: string
}

function PastSessionsTable({
  sessions,
  showViewAllLink = false,
  viewAllHref = STUDENT_TUTORING_SESSIONS_HREF,
  onTranscriptClick,
  activeSessionId,
}: PastSessionsTableProps) {
  return (
    <section className="rounded-[16px] border border-[#e4e9f2] bg-[var(--greyscale-0)] p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">Past Sessions</h2>
        {showViewAllLink ? (
          <Link
            to={viewAllHref}
            className="text-[13px] font-semibold text-[var(--primary)] hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#e4e9f2] text-[var(--greyscale-500)]">
              <th className="w-[133px] px-2 py-2.5 font-medium">Date</th>
              <th className="w-[235px] px-2 py-2.5 font-medium">Tutor</th>
              <th className="px-2 py-2.5 font-medium">Focus</th>
              <th className="w-[202px] px-2 py-2.5 font-bold">Transcript</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => {
              const active = session.id === activeSessionId
              const isLast = index === sessions.length - 1
              return (
                <tr
                  key={session.id}
                  className={cn(!isLast && "border-b border-[#f0f3f8]")}
                >
                  <td className="px-2 py-3.5 text-[var(--color-student-heading)]">{session.dateLabel}</td>
                  <td className="px-2 py-3.5 font-semibold text-[var(--color-student-heading)]">
                    {session.tutorName}
                  </td>
                  <td className="px-2 py-3.5 text-[var(--color-student-heading)]">{session.focus}</td>
                  <td className="px-2 py-3.5">
                    {onTranscriptClick ? (
                      <button
                        type="button"
                        onClick={() => onTranscriptClick(session.id)}
                        className={cn(
                          "text-xs tracking-[0.02em] hover:underline",
                          active
                            ? "font-semibold text-[var(--primary)]"
                            : "font-normal text-[var(--primary)]",
                        )}
                      >
                        {active ? "Viewing Transcript" : "Transcript"}
                      </button>
                    ) : (
                      <Link
                        to={studentTutoringSessionTranscriptHref(session.id)}
                        className="text-xs tracking-[0.02em] text-[var(--primary)] hover:underline"
                      >
                        Transcript
                      </Link>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export { PastSessionsTable }
