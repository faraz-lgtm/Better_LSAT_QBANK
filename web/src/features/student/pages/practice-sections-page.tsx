import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink } from "lucide-react"

import { PracticeLrRcStarterCards } from "@/features/student/components/practice-lr-rc-starter-cards"
import { StudentMain } from "@/features/student/components/student-main"
import { createAnalyticsApi } from "@/lib/api/analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function PracticeSectionsPage() {
  const navigate = useNavigate()
  const analyticsApi = useMemo(() => createAnalyticsApi(getSupabaseBrowserClient()), [])

  const [inProcessCount, setInProcessCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const sessionsResult = await analyticsApi.getSessions({ kind: "SECTION", limit: 50 })
        if (cancelled) return
        setInProcessCount(sessionsResult.sessions.filter((s) => !s.completedAt).length)
      } catch {
        if (!cancelled) setInProcessCount(0)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [analyticsApi])

  return (
    <StudentMain>
        <section className="rounded-2xl border border-[#d8dee8] bg-[#ffffff] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3 mb-3">
            
              <p className="max-w-xl text-[14px] font-semibold leading-snug tracking-[0.1px] text-[#3c527f]">
                Take a complete section from an official PrepTest.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[14px] font-semibold leading-none tracking-[0.1px] text-[#0d47a1]">
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:underline"
                onClick={() => navigate("/app/analytics/sections")}
              >
                Sections History
                <ExternalLink className="size-3.5" />
              </button>
              <span className="mx-1 h-3.5 w-px bg-[#dfe1e7]" />
              <span>In Process</span>
              <span className="inline-flex size-4.5 items-center justify-center rounded-full bg-[#e7ecf4] text-[10px] font-semibold text-[#0d47a1]">
                {inProcessCount}
              </span>
            </div>
          </div>

          <PracticeLrRcStarterCards
            lrButtonLabel="Start Section"
            rcButtonLabel="Start Section"
            lrSubtitle="16–20 Questions"
            rcSubtitle="4 Passages"
            onStartLr={() => navigate("/app/practice/sections/lr/new")}
            onStartRc={() => navigate("/app/practice/sections/rc/new")}
          />
        </section>
      </StudentMain>
  )
}

export { PracticeSectionsPage }
