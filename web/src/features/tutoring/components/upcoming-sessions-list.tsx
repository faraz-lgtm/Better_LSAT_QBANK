import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { STUDENT_TUTORING_SESSIONS_HREF } from "@/features/app-shell/student-nav-config"
import type { TutoringSessionSummary } from "@/features/tutoring/lib/types"

type UpcomingSessionsListProps = {
  sessions: TutoringSessionSummary[]
}

function UpcomingSessionsList({ sessions }: UpcomingSessionsListProps) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
          Upcoming Sessions List
        </h3>
        <Link
          to={STUDENT_TUTORING_SESSIONS_HREF}
          className="text-xs font-semibold tracking-[0.02em] text-[var(--primary)] hover:underline"
        >
          See all sessions →
        </Link>
      </div>

      <ul className="mt-4 space-y-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex flex-col gap-3 rounded-[12px] border border-[#e4e9f2] px-4 py-3 sm:flex-row sm:items-center"
          >
            <div className="flex size-[54px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-[var(--primary-25)] text-[var(--primary)]">
              <span className="text-[11px] font-bold tracking-[0.08em]">{session.month}</span>
              <span className="text-[18px] font-bold leading-none">{session.day}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-[0.02em] text-[var(--color-student-heading)]">
                {session.title}
              </p>
              <p className="mt-1 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">{session.whenLabel}</p>
            </div>
            {session.action === "join" ? (
              <Button type="button" size="sm" className="h-10 rounded-[10px] px-4">
                Join
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" className="h-10 rounded-[10px] px-4">
                Reschedule
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export { UpcomingSessionsList }
