import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, Clock, Loader2, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  formatLawSchoolCycle,
  formatPlannedLsatHeadline,
} from "@/features/dashboard/lib/map-dashboard-preferences"
import { mapOverviewToDashboardStats } from "@/features/dashboard/lib/map-dashboard-stats"
import { useAnalyticsApi } from "@/features/student/analytics/hooks/use-analytics-api"
import { ContinueDrillCard, continueDrillToCardDrill } from "@/features/student/components/continue-drill-card"
import { StudentMain } from "@/features/student/components/student-main"
import {
  type ContinueDrill,
  fetchAllSessionsForStudyHours,
  mapPriorityToSuggestedDrill,
  mapSessionToContinueDrill,
  sumSessionStudyHours,
  type SuggestedDrill,
} from "@/features/student/drills/drill-dashboard-mappers"
import type { AnalyticsOverview } from "@/lib/api/analytics"
import type { OfficialLsatScore, StudentStudyContext, UserProfile } from "@/lib/api/users"
import { createUsersApi } from "@/lib/api/users"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function chipStyles(active: boolean) {
  if (active) return "bg-[#0d47a1] text-white border-[#0d47a1]"
  return "bg-[#f5f9ff] text-[#0d47a1] border-[#dfe1e7]"
}

function adaptiveDrillPath(filter: "all" | "lr" | "rc"): string {
  if (filter === "rc") return "/app/practice/drills/rc/new"
  return "/app/practice/drills/lr/new"
}

type DashboardDrill = ContinueDrill | (SuggestedDrill & { isSuggested: true })

function isSuggestedDrill(drill: DashboardDrill): drill is SuggestedDrill & { isSuggested: true } {
  return "isSuggested" in drill && drill.isSuggested === true
}

function parseOfficialScaledScoreDraft(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number.parseInt(trimmed, 10)
  if (!Number.isInteger(n) || n < 120 || n > 180) return null
  return n
}

function canSubmitOfficialScore(label: string, scoreRaw: string): boolean {
  if (!label.trim()) return false
  const trimmed = scoreRaw.trim()
  if (!trimmed) return true
  return parseOfficialScaledScoreDraft(scoreRaw) != null
}

function DashboardPage() {
  const navigate = useNavigate()
  const analyticsApi = useAnalyticsApi()
  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [studyHours, setStudyHours] = useState(0)
  const [continueDrills, setContinueDrills] = useState<ContinueDrill[]>([])
  const [suggestedDrills, setSuggestedDrills] = useState<SuggestedDrill[]>([])
  const [studyContext, setStudyContext] = useState<StudentStudyContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "lr" | "rc">("all")

  const [editingCycle, setEditingCycle] = useState(false)
  const [cycleDraft, setCycleDraft] = useState("")
  const [plannedDateDraft, setPlannedDateDraft] = useState("")
  const [savingCycle, setSavingCycle] = useState(false)

  const [addingScore, setAddingScore] = useState(false)
  const [scoreLabelDraft, setScoreLabelDraft] = useState("")
  const [scoreValueDraft, setScoreValueDraft] = useState("")
  const [savingScore, setSavingScore] = useState(false)

  const loadDashboard = useCallback(async () => {
    if (!analyticsApi || !usersApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [profileData, overviewData, allSessions, drillSessions, priorities, context] = await Promise.all([
        usersApi.getMyProfile(),
        analyticsApi.getOverview(),
        fetchAllSessionsForStudyHours((input) => analyticsApi.getSessions(input)),
        analyticsApi.getSessions({ kind: "DRILL", limit: 50 }),
        analyticsApi.getPriorities(),
        usersApi.getStudyContext(),
      ])

      setProfile(profileData)
      setOverview(overviewData)
      setStudyHours(sumSessionStudyHours(allSessions))
      setStudyContext(context)

      const inProgress = drillSessions.sessions
        .filter((s) => !s.completedAt)
        .map(mapSessionToContinueDrill)
        .filter((d): d is ContinueDrill => d != null)
      setContinueDrills(inProgress)

      setSuggestedDrills(
        priorities
          .filter((p) => p.sectionType === "LR" || p.sectionType === "RC" || p.sectionType === null)
          .map(mapPriorityToSuggestedDrill)
          .filter((d): d is SuggestedDrill => d != null)
          .slice(0, 4),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [analyticsApi, usersApi])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const statCards = useMemo(
    () => (overview ? mapOverviewToDashboardStats(overview, studyHours) : []),
    [overview, studyHours],
  )

  const filteredContinue = useMemo(() => {
    if (activeFilter === "all") return continueDrills
    return continueDrills.filter((d) => (activeFilter === "lr" ? d.section === "LR" : d.section === "RC"))
  }, [activeFilter, continueDrills])

  const filteredSuggested = useMemo(() => {
    if (activeFilter === "all") return suggestedDrills
    return suggestedDrills.filter((d) => (activeFilter === "lr" ? d.section === "LR" : d.section === "RC"))
  }, [activeFilter, suggestedDrills])

  const displayDrills: DashboardDrill[] = useMemo(() => {
    if (filteredContinue.length > 0) return filteredContinue
    return filteredSuggested.map((d) => ({ ...d, isSuggested: true as const }))
  }, [filteredContinue, filteredSuggested])

  const preferences = studyContext?.preferences ?? null
  const officialScores = studyContext?.officialScores ?? []

  async function handleSaveCycle() {
    if (!usersApi) return
    setSavingCycle(true)
    try {
      const preferences = await usersApi.updateStudyPreferences({
        lawSchoolCycle: cycleDraft.trim() || null,
        plannedLsatDate: plannedDateDraft.trim() || null,
      })
      setStudyContext((prev) => (prev ? { ...prev, preferences } : { preferences, officialScores: [] }))
      setEditingCycle(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update preferences")
    } finally {
      setSavingCycle(false)
    }
  }

  async function handleAddScore() {
    if (!usersApi || !canSubmitOfficialScore(scoreLabelDraft, scoreValueDraft)) return
    setSavingScore(true)
    try {
      const scaledScore = parseOfficialScaledScoreDraft(scoreValueDraft)
      const score = await usersApi.upsertOfficialScore({
        testLabel: scoreLabelDraft.trim(),
        scaledScore,
        sortOrder: officialScores.length,
      })
      setStudyContext((prev) => ({
        preferences: prev?.preferences ?? null,
        officialScores: [...(prev?.officialScores ?? []), score],
      }))
      setAddingScore(false)
      setScoreLabelDraft("")
      setScoreValueDraft("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save score")
    } finally {
      setSavingScore(false)
    }
  }

  function openCycleEditor() {
    setCycleDraft(preferences?.lawSchoolCycle ?? "")
    setPlannedDateDraft(preferences?.plannedLsatDate ?? "")
    setEditingCycle(true)
  }

  return (
    <>
      <StudentMain>
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit shrink-0"
            onClick={() => navigate(adaptiveDrillPath(activeFilter))}
          >
            Adaptive Drill
          </Button>
        </div>

        {loading ? (
          <div className="mb-6 flex items-center gap-2 text-sm text-[#666d80]">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading dashboard…
          </div>
        ) : null}

        {error ? <p className="mb-4 text-sm text-[#95122b]">{error}</p> : null}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {statCards.map((card) => (
            <article
              key={card.id}
              className="rounded-2xl border border-[#dfe1e7] bg-white px-6 py-4 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
            >
              <div className="mb-[10px] flex h-10 items-start justify-between">
                <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#eceff3] text-[#62748e]">
                  {card.id === "study-time" ? <Clock className="size-5" /> : null}
                  {card.id === "drill-accuracy" ? <Target className="size-5" /> : null}
                  {card.id === "questions-answered" ? <Brain className="size-5" /> : null}
                </span>
                {card.badge ? (
                  <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-xs font-medium leading-4 text-[#62748e]">
                    {card.badge}
                  </span>
                ) : null}
              </div>
              <p className="text-2xl font-bold leading-8 text-[#0f172b]">{card.value}</p>
              <p className="mt-[10px] text-[13px] font-normal leading-[18.571px] text-[#62748e]">{card.label}</p>
            </article>
          ))}
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

            {!loading && displayDrills.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#dfe1e7] bg-[#f9fbfc] px-4 py-6 text-sm text-[#666d80]">
                No drills in progress. Start a new drill from{" "}
                <button
                  type="button"
                  className="font-semibold text-[#0d47a1] hover:underline"
                  onClick={() => navigate("/app/practice/drills")}
                >
                  Practice → Drills
                </button>
                .
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {displayDrills.map((drill) => {
                  const suggested = isSuggestedDrill(drill)
                  const cardDrill = continueDrillToCardDrill(
                    suggested ? { ...drill, continuePath: drill.configPath } : drill,
                  )

                  return (
                    <ContinueDrillCard
                      key={drill.id}
                      drill={cardDrill}
                      continueLabel={suggested ? "Start" : "Continue"}
                      lastAttemptPrefix={suggested ? "Suggested · " : "Last attempt: "}
                      onContinue={() =>
                        navigate(suggested ? drill.configPath : drill.continuePath)
                      }
                    />
                  )
                })}
              </div>
            )}
          </section>

          <div className="flex flex-col gap-4">
            <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
              <p className="text-xs font-semibold text-[#666d80]">Next LSAT</p>
              <h3 className="mt-2 text-3xl font-semibold leading-tight text-[#082c6b]">
                {formatPlannedLsatHeadline(preferences)}
              </h3>
              {preferences?.goalScore != null ? (
                <p className="mt-2 text-xs text-[#666d80]">
                  Goal score: <span className="font-semibold text-[#082c6b]">{preferences.goalScore}</span>
                </p>
              ) : null}
              <div className="mt-3 space-y-2 text-xs">
                {officialScores.length === 0 ? (
                  <p className="text-[#666d80]">No official scores recorded yet.</p>
                ) : (
                  officialScores.map((row: OfficialLsatScore) => (
                    <div key={row.id} className="flex justify-between border-b border-[#dfe1e7] pb-1">
                      <span>{row.testLabel}</span>
                      <span className="font-semibold text-[#082c6b]">
                        {row.scaledScore != null ? row.scaledScore : "—"}
                      </span>
                    </div>
                  ))
                )}
                {addingScore ? (
                  <div className="space-y-2 pt-2">
                    <Input
                      value={scoreLabelDraft}
                      onChange={(e) => setScoreLabelDraft(e.target.value)}
                      placeholder="Test label (e.g. June 2025)"
                      className="h-9 rounded-xl text-xs"
                    />
                    <Input
                      value={scoreValueDraft}
                      onChange={(e) => setScoreValueDraft(e.target.value)}
                      placeholder="Score (120–180)"
                      className="h-9 rounded-xl text-xs"
                      aria-invalid={
                        scoreValueDraft.trim() !== "" &&
                        parseOfficialScaledScoreDraft(scoreValueDraft) == null
                      }
                    />
                    {scoreValueDraft.trim() !== "" &&
                    parseOfficialScaledScoreDraft(scoreValueDraft) == null ? (
                      <p className="text-xs text-destructive">Score must be a whole number from 120 to 180.</p>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setAddingScore(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="ds-btn-sm"
                        disabled={
                          savingScore || !canSubmitOfficialScore(scoreLabelDraft, scoreValueDraft)
                        }
                        onClick={() => void handleAddScore()}
                      >
                        {savingScore ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="font-semibold text-[#0d47a1]"
                    onClick={() => setAddingScore(true)}
                  >
                    Add Score
                  </button>
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
              <p className="text-xs font-semibold text-[#666d80]">Law school cycle</p>
              <p className="mt-3 text-2xl font-semibold text-[#0d47a1]">{formatLawSchoolCycle(preferences)}</p>
              {profile ? (
                <p className="mt-3 text-xs text-[#666d80]">
                  Signed in as{" "}
                  <span className="font-semibold text-[#082c6b]">
                    {profile.full_name?.trim() || profile.email || "unknown"}
                  </span>
                </p>
              ) : null}
              {editingCycle ? (
                <div className="mt-4 space-y-2">
                  <Input
                    value={cycleDraft}
                    onChange={(e) => setCycleDraft(e.target.value)}
                    placeholder="Admission cycle (e.g. 2027)"
                    className="h-9 rounded-xl text-xs"
                  />
                  <Input
                    type="date"
                    value={plannedDateDraft}
                    onChange={(e) => setPlannedDateDraft(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setEditingCycle(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="ds-btn-sm"
                      disabled={savingCycle}
                      onClick={() => void handleSaveCycle()}
                    >
                      {savingCycle ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={openCycleEditor}>
                    Edit cycle
                  </Button>
                </div>
              )}
            </article>
          </div>
        </div>
      </StudentMain>
    </>
  )
}

export { DashboardPage }
