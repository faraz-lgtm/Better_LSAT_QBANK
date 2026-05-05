import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { filterDrills, mockStudentDrills } from "@/features/student/lib/mock-drills"
import type { UserProfile } from "@/lib/api/users"
import { createUsersApi } from "@/lib/api/users"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Clock, HelpCircle, Target } from "lucide-react"

function chipStyles(active: boolean) {
  if (active) return "bg-[#0d47a1] text-white border-[#0d47a1]"
  return "bg-[#f5f9ff] text-[#0d47a1] border-[#dfe1e7]"
}

function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"all" | "lr" | "rc">("all")
  const [drillTab, setDrillTab] = useState<"in_progress" | "saved" | "recent">("in_progress")

  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let alive = true
    async function loadProfile() {
      if (!usersApi) {
        if (alive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setLoadingProfile(false)
        }
        return
      }
      try {
        const data = await usersApi.getMyProfile()
        if (!alive) return
        if (data?.is_first_time_login) {
          const updated = await usersApi.completeFirstLogin()
          if (!alive) return
          setProfile(updated)
        } else {
          setProfile(data)
        }
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to load dashboard")
      } finally {
        if (alive) setLoadingProfile(false)
      }
    }
    void loadProfile()
    return () => {
      alive = false
    }
  }, [usersApi])

  const filteredDrills = filterDrills(mockStudentDrills, activeFilter)

  return (
    <>
      <StudentSubnavStrip crumbs={[{ label: "Dashboard" }]} />
      <StudentMain>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold text-[#082c6b]">Dashboard</h1>
          <Button type="button" variant="outline" size="sm" className="w-fit rounded-xl border-[#0d47a1] text-[#0d47a1]">
            Customize
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#666d80]">All time</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#082c6b]">142h</p>
            <p className="mt-1 text-sm text-[#666d80]">Total study time</p>
          </article>
          <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
            <span className="text-xs font-semibold text-[#666d80]">+3% this week</span>
            <p className="mt-3 text-3xl font-semibold text-[#082c6b]">78%</p>
            <p className="mt-1 text-sm text-[#666d80]">Overall accuracy</p>
          </article>
          <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
            <span className="text-xs font-semibold text-[#666d80]">Practice + Tests</span>
            <p className="mt-3 text-3xl font-semibold text-[#082c6b]">1,847</p>
            <p className="mt-1 text-sm text-[#666d80]">Questions answered</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <section className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
            <div className="mb-4 flex flex-col gap-3 border-b border-[#dfe1e7] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={drillTab === "in_progress" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setDrillTab("in_progress")}
                >
                  In progress
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={drillTab === "saved" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setDrillTab("saved")}
                >
                  Saved for later
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={drillTab === "recent" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setDrillTab("recent")}
                >
                  Recently completed
                </Button>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-xl border px-3 py-1 text-xs font-semibold tracking-[0.24px] ${chipStyles(activeFilter === "all")}`}
                onClick={() => setActiveFilter("all")}
              >
                All Drills
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-1 text-xs font-semibold tracking-[0.24px] ${chipStyles(activeFilter === "lr")}`}
                onClick={() => setActiveFilter("lr")}
              >
                Logical Reasoning
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-1 text-xs font-semibold tracking-[0.24px] ${chipStyles(activeFilter === "rc")}`}
                onClick={() => setActiveFilter("rc")}
              >
                Reading Comprehension
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {filteredDrills.map((drill) => (
                <article key={drill.id} className="rounded-2xl border border-[#dfe1e7] bg-[#f9fbfc] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold text-white ${
                            drill.accent === "mint" ? "bg-[#45bda4]" : "bg-[#f7994a]"
                          }`}
                        >
                          {drill.section}
                        </span>
                        <div className="flex size-16 items-center justify-center rounded-full border-4 border-[#dfe1e7] text-sm font-bold text-[#082c6b]">
                          {drill.progressPct}%
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[#082c6b]">{drill.title}</h3>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[#666d80]">
                          <div className="flex items-center gap-1">
                            <Target className="size-3.5 text-[#0d47a1]" />
                            <div>
                              <p>Progress</p>
                              <p className="font-semibold text-[#082c6b]">{drill.progressPct}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <HelpCircle className="size-3.5 text-[#0d47a1]" />
                            <div>
                              <p>Questions</p>
                              <p className="font-semibold text-[#082c6b]">{drill.answered}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="size-3.5 text-[#0d47a1]" />
                            <div>
                              <p>Time</p>
                              <p className="font-semibold text-[#082c6b]">{drill.timeLabel}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-[#dfe1e7]">
                          <div className="h-2 rounded-full bg-[#0d47a1]" style={{ width: `${drill.progressPct}%` }} />
                        </div>
                        <p className="mt-2 text-right text-[10px] text-[#666d80]">Last attempt: {drill.lastAttempt}</p>
                      </div>
                    </div>
                    <div className="flex items-end lg:ml-auto">
                      <button
                        type="button"
                        className={`w-full rounded-2xl px-6 py-2 text-xs font-semibold text-white lg:w-auto ${
                          drill.accent === "mint" ? "bg-[#45bda4]" : "bg-[#f7994a]"
                        }`}
                      >
                        Continue Drill
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-4">
            <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
              <p className="text-xs font-semibold text-[#666d80]">Next LSAT</p>
              <h3 className="mt-2 text-3xl font-semibold leading-tight text-[#082c6b]">April 2027</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#dfe1e7] pb-1">
                  <span>June 2025</span>
                  <span className="font-semibold text-[#082c6b]">159</span>
                </div>
                <div className="flex justify-between border-b border-[#dfe1e7] pb-1">
                  <span>September 2025</span>
                  <span className="font-semibold text-[#082c6b]">160</span>
                </div>
                <div className="flex justify-between">
                  <span>October 2025</span>
                  <button type="button" className="font-semibold text-[#0d47a1]">
                    Add Score
                  </button>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
              <p className="text-xs font-semibold text-[#666d80]">Law school cycle</p>
              <p className="mt-3 text-2xl font-semibold text-[#0d47a1]">2027</p>
              {loadingProfile ? (
                <p className="mt-3 text-xs text-[#666d80]">Loading profile...</p>
              ) : profile ? (
                <p className="mt-3 text-xs text-[#666d80]">
                  Signed in as <span className="font-semibold text-[#082c6b]">{profile.email ?? "unknown email"}</span>
                </p>
              ) : (
                <p className="mt-3 text-xs text-[#666d80]">No profile found yet.</p>
              )}
              {error && <p className="mt-2 text-xs text-[#95122b]">{error}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="rounded-xl">
                  Edit cycle
                </Button>
              </div>
            </article>
          </div>
        </div>
      </StudentMain>
    </>
  )
}

export { DashboardPage }
