import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { filterDrills, mockStudentDrills } from "@/features/student/lib/mock-drills"
import type { UserProfile } from "@/lib/api/users"
import { createUsersApi } from "@/lib/api/users"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Brain, ChevronRight, Clock, HelpCircle, Target } from "lucide-react"

function chipStyles(active: boolean) {
  if (active) return "bg-[#0d47a1] text-white border-[#0d47a1]"
  return "bg-[#f5f9ff] text-[#0d47a1] border-[#dfe1e7]"
}

function difficultyLabel(level: "hardest"): string {
  if (level === "hardest") return "Hardest"
  return "Hardest"
}

function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"all" | "lr" | "rc">("all")

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
      <StudentMain>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold text-[#082c6b]">Dashboard</h1>
          <Button type="button" variant="outline" size="sm" className="w-fit rounded-xl border-[#0d47a1] text-[#0d47a1]">
            Customize
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#dfe1e7] bg-white px-6 py-4 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
            <div className="mb-[10px] flex h-10 items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#eceff3] text-[#62748e]">
                <Clock className="size-5" />
              </span>
              <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-xs font-medium leading-4 text-[#62748e]">All time</span>
            </div>
            <p className="text-2xl font-bold leading-8 text-[#0f172b]">142h</p>
            <p className="mt-[10px] text-[13px] font-normal leading-[18.571px] text-[#62748e]">Total Study Time</p>
          </article>
          <article className="rounded-2xl border border-[#dfe1e7] bg-white px-6 py-4 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
            <div className="mb-[10px] flex h-10 items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#eceff3] text-[#62748e]">
                <Target className="size-5" />
              </span>
              <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-xs font-medium leading-4 text-[#62748e]">
                +3% this week
              </span>
            </div>
            <p className="text-2xl font-bold leading-8 text-[#0f172b]">78%</p>
            <p className="mt-[10px] text-[13px] font-normal leading-[18.571px] text-[#62748e]">Overall Accuracy</p>
          </article>
          <article className="rounded-2xl border border-[#dfe1e7] bg-white px-6 py-4 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
            <div className="mb-[10px] flex h-10 items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#eceff3] text-[#62748e]">
                <Brain className="size-5" />
              </span>
              <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-xs font-medium leading-4 text-[#62748e]">
                Practice + Tests
              </span>
            </div>
            <p className="text-2xl font-bold leading-8 text-[#0f172b]">1,847</p>
            <p className="mt-[10px] text-[13px] font-normal leading-[18.571px] text-[#62748e]">Questions Answered</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <section className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
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
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-xl font-bold leading-[1.35] text-[#062357]">{drill.title}</h3>
                          <div className="flex h-10 items-center gap-[10px] rounded-[10px] bg-white px-[10px]">
                            <div className="flex items-center gap-1.5">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <span key={index} className="h-4 w-1.5 rounded-full bg-[#df1c41]" aria-hidden />
                              ))}
                            </div>
                            <span className="text-xs font-semibold tracking-[0.24px] text-[#df1c41]">
                              {difficultyLabel(drill.difficulty)}
                            </span>
                          </div>
                        </div>
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
                      </div>
                    </div>
                    <div className="flex flex-col items-stretch gap-2 lg:ml-auto lg:items-end">
                      <button
                        type="button"
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] px-4 py-2 text-base font-semibold tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[#0d47a1]/90 lg:w-auto"
                      >
                        <span>Continue</span>
                        <ChevronRight className="size-5" />
                      </button>
                      <p className="text-right text-xs tracking-[0.24px] text-[#6a7282]">Last attempt: {drill.lastAttempt}</p>
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
