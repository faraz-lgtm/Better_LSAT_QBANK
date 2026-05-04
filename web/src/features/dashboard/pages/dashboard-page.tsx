import { useEffect, useMemo, useState } from "react"

import { AuthHeader } from "@/features/auth/components/auth-header"
import type { UserProfile } from "@/lib/api/users"
import { createUsersApi } from "@/lib/api/users"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Drill = {
  id: string
  section: "LR" | "RC"
  title: string
  progress: number
  answered: string
  time: string
  accent: "orange" | "mint"
}

const drills: Drill[] = [
  { id: "d1", section: "LR", title: "Causal reasoning drill", progress: 45, answered: "45/100", time: "15 min", accent: "orange" },
  { id: "d2", section: "LR", title: "Comparative drill", progress: 45, answered: "45/100", time: "15 min", accent: "mint" },
  { id: "d3", section: "LR", title: "Conditional reasoning drill", progress: 45, answered: "45/100", time: "15 min", accent: "orange" },
  { id: "d4", section: "LR", title: "Flaw or descriptive drill", progress: 45, answered: "45/100", time: "15 min", accent: "orange" },
]

function chipStyles(active: boolean) {
  if (active) return "bg-[#0d47a1] text-white border-[#0d47a1]"
  return "bg-[#f5f9ff] text-[#0d47a1] border-[#dfe1e7]"
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

  const filteredDrills = drills.filter((d) => {
    if (activeFilter === "all") return true
    if (activeFilter === "lr") return d.section === "LR"
    return d.section === "RC"
  })

  return (
    <div className="auth-page flex min-h-svh flex-col bg-[#f5f9ff]">
      <AuthHeader ctaLabel="Log In" ctaHref="/login" variant="app" />
      <main className="mx-auto flex w-full max-w-[1126px] flex-1 flex-col gap-4 px-4 py-6 md:px-8">
        <p className="text-[36px] font-semibold leading-tight text-[#082c6b]">Dashboard</p>

        <section className="rounded-3xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04),0px_4px_8px_0px_rgba(13,13,18,0.02)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[30px] font-semibold text-[#082c6b]">Continue Drills</p>
            <div className="flex items-center gap-2">
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
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {filteredDrills.map((drill) => (
              <article
                key={drill.id}
                className={`rounded-3xl border p-3 ${
                  drill.accent === "mint" ? "border-[#b4ddd3] bg-[#d7ebe7]" : "border-[#efd2be] bg-[#f2e6dc]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${drill.accent === "mint" ? "bg-[#45bda4] text-white" : "bg-[#f7994a] text-white"}`}>
                    {drill.section}
                  </span>
                  <span className="text-[10px] font-semibold text-[#666d80]">HIGHEST</span>
                </div>
                <h3 className="mb-3 text-sm font-semibold text-[#082c6b]">{drill.title}</h3>
                <div className="space-y-1 text-xs text-[#666d80]">
                  <div className="flex justify-between"><span>Progress</span><span className="font-semibold text-[#082c6b]">{drill.progress}%</span></div>
                  <div className="flex justify-between"><span>Questions Answered</span><span className="font-semibold text-[#082c6b]">{drill.answered}</span></div>
                  <div className="flex justify-between"><span>Time</span><span className="font-semibold text-[#082c6b]">{drill.time}</span></div>
                </div>
                <button
                  type="button"
                  className={`mt-3 w-full rounded-2xl py-2 text-xs font-semibold text-white ${
                    drill.accent === "mint" ? "bg-[#45bda4]" : "bg-[#f7994a]"
                  }`}
                >
                  Continue Drill
                </button>
                <p className="mt-2 text-center text-[10px] text-[#666d80]">Last attempt: 2 days ago</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-[1fr_1.8fr]">
          <article className="rounded-3xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04),0px_4px_8px_0px_rgba(13,13,18,0.02)]">
            <p className="text-xs font-semibold text-[#666d80]">Next LSAT</p>
            <h3 className="mt-2 text-[40px] font-semibold leading-tight text-[#082c6b]">April 2027</h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between border-b border-[#dfe1e7] pb-1"><span>June 2025</span><span className="font-semibold text-[#082c6b]">159</span></div>
              <div className="flex justify-between border-b border-[#dfe1e7] pb-1"><span>September 2025</span><span className="font-semibold text-[#082c6b]">160</span></div>
              <div className="flex justify-between"><span>October 2025</span><button className="font-semibold text-[#0d47a1]">Add Score</button></div>
            </div>
          </article>

          <article className="rounded-3xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04),0px_4px_8px_0px_rgba(13,13,18,0.02)]">
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
          </article>
        </section>
      </main>
    </div>
  )
}

export { DashboardPage }
