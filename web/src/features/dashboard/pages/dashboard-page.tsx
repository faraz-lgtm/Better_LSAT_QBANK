import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, Clock, PlusCircle, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStudentPageHeaderActions } from "@/features/app-shell/student-page-header-slot"
import {
  formatLawSchoolCycle,
  formatPlannedLsatHeadline,
} from "@/features/dashboard/lib/map-dashboard-preferences"
import { mapOverviewToDashboardStats } from "@/features/dashboard/lib/map-dashboard-stats"
import { useAnalyticsApi } from "@/features/student/analytics/hooks/use-analytics-api"
import { ContinueDrillCard, continueDrillToCardDrill } from "@/features/student/components/continue-drill-card"
import { DASHBOARD_ADAPTIVE_DRILL_QUERY } from "@/features/student/drills/drill-blind-review-policy"
import { drillFilterPillClass } from "@/features/student/components/drill-filter-pill"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import {
  type ContinueDrill,
  fetchAllSessionsForStudyHours,
  mapPriorityToSuggestedDrill,
  mapSessionToContinueDrill,
  sumSessionStudyHours,
  type SuggestedDrill,
} from "@/features/student/drills/drill-dashboard-mappers"
import type { AnalyticsOverview } from "@/lib/api/analytics"
import type { OfficialLsatScore, StudentStudyContext } from "@/lib/api/users"
import { createUsersApi } from "@/lib/api/users"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function filterChipStyles(active: boolean): string {
  return drillFilterPillClass(active)
}

function adaptiveDrillSectionType(filter: "all" | "lr" | "rc"): "LR" | "RC" {
  return filter === "rc" ? "RC" : "LR"
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
  const practiceApi = useMemo(() => {
    try {
      return createPracticeApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [studyHours, setStudyHours] = useState(0)
  const [continueDrills, setContinueDrills] = useState<ContinueDrill[]>([])
  const [suggestedDrills, setSuggestedDrills] = useState<SuggestedDrill[]>([])
  const [studyContext, setStudyContext] = useState<StudentStudyContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "lr" | "rc">("all")

  const [editingLsat, setEditingLsat] = useState(false)
  const [cycleDraft, setCycleDraft] = useState("")
  const [plannedDateDraft, setPlannedDateDraft] = useState("")
  const [savingCycle, setSavingCycle] = useState(false)

  const [addingScore, setAddingScore] = useState(false)
  const [scoreLabelDraft, setScoreLabelDraft] = useState("")
  const [scoreValueDraft, setScoreValueDraft] = useState("")
  const [savingScore, setSavingScore] = useState(false)
  const [startingAdaptiveDrill, setStartingAdaptiveDrill] = useState(false)

  const loadDashboard = useCallback(async () => {
    if (!analyticsApi || !usersApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [overviewData, allSessions, drillSessions, priorities, context] = await Promise.all([
        analyticsApi.getOverview(),
        fetchAllSessionsForStudyHours((input) => analyticsApi.getSessions(input)),
        analyticsApi.getSessions({ kind: "DRILL", limit: 50 }),
        analyticsApi.getPriorities(),
        usersApi.getStudyContext(),
      ])

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

  const handleStartAdaptiveDrill = useCallback(async () => {
    if (!practiceApi || startingAdaptiveDrill) return
    setStartingAdaptiveDrill(true)
    setError(null)
    try {
      const out = await practiceApi.startDrill({
        sectionType: adaptiveDrillSectionType(activeFilter),
        questionCount: 5,
        timing: "unlimited",
        showAnswers: "end",
        selection: "auto",
        difficulty: "adaptive",
        status: "fresh",
        source: "dashboard_adaptive_drill",
      })
      navigate(`/app/practice/drills/session/${out.session.id}?${DASHBOARD_ADAPTIVE_DRILL_QUERY}=1`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start adaptive drill")
    } finally {
      setStartingAdaptiveDrill(false)
    }
  }, [activeFilter, navigate, practiceApi, startingAdaptiveDrill])

  const adaptiveDrillButton = useMemo(
    () => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit shrink-0"
        disabled={startingAdaptiveDrill || !practiceApi}
        onClick={() => void handleStartAdaptiveDrill()}
      >
        {startingAdaptiveDrill ? "Starting…" : "Adaptive Drill"}
      </Button>
    ),
    [handleStartAdaptiveDrill, practiceApi, startingAdaptiveDrill],
  )

  useStudentPageHeaderActions(adaptiveDrillButton)

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
      setEditingLsat(false)
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

  function openLsatEditor() {
    setCycleDraft(preferences?.lawSchoolCycle ?? "")
    setPlannedDateDraft(preferences?.plannedLsatDate ?? "")
    setEditingLsat(true)
    setAddingScore(false)
  }

  if (loading) {
    return (
      <StudentMain>
        <StudentPageLoader centered label="Loading dashboard…" />
      </StudentMain>
    )
  }

  return (
    <>
      <StudentMain>
        {error ? <p className="mb-4 text-sm text-[#95122b]">{error}</p> : null}

        <div className="dashboard-page flex flex-col gap-6">
          <div className="dashboard-page__stats">
            {statCards.map((card) => (
              <article
                key={card.id}
                className="flex min-h-[142px] min-w-0 flex-col gap-2.5 rounded-2xl border border-[#dfe1e7] bg-white px-6 py-4 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
              >
                <div className="flex h-10 items-start justify-between">
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
                <p className="text-[13px] font-normal leading-[18.571px] text-[#62748e]">{card.label}</p>
              </article>
            ))}
          </div>

          <div className="dashboard-page__body">
            <section className="min-w-0 rounded-[24px] border border-[#dfe1e7] bg-white p-4 sm:p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={filterChipStyles(activeFilter === "all")}
                  onClick={() => setActiveFilter("all")}
                >
                  All Drills
                </button>
                <button
                  type="button"
                  className={filterChipStyles(activeFilter === "lr")}
                  onClick={() => setActiveFilter("lr")}
                >
                  Logical Reasoning
                </button>
                <button
                  type="button"
                  className={filterChipStyles(activeFilter === "rc")}
                  onClick={() => setActiveFilter("rc")}
                >
                  Reading Comprehension
                </button>
              </div>

              {displayDrills.length === 0 ? (
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
                <div className="flex flex-col gap-6">
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

            <div className="flex min-w-0 flex-col gap-6">
              <article className="min-w-0 rounded-[24px] border border-[#dfe1e7] bg-white p-4 sm:p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-semibold tracking-[0.24px] text-[#666d80]">Next LSAT</p>
                  <h3 className="text-2xl font-bold leading-[1.3] text-[#062357]">
                    {formatPlannedLsatHeadline(preferences)}
                  </h3>

                  <div className="space-y-0 text-xs">
                    {officialScores.map((row: OfficialLsatScore) => (
                      <div
                        key={row.id}
                        className="flex h-8 items-center justify-between border-b border-[#dfe1e7] pb-px"
                      >
                        <span className="font-semibold tracking-[0.24px] text-[#062357]">{row.testLabel}</span>
                        <span className="font-semibold tracking-[0.24px] text-[#062357]">
                          {row.scaledScore != null ? row.scaledScore : "—"}
                        </span>
                      </div>
                    ))}
                    {!addingScore ? (
                      <div className="flex h-8 items-center justify-between border-b border-[#dfe1e7] pb-px">
                        <span className="font-semibold tracking-[0.24px] text-[#062357]">
                          {officialScores.length === 0 ? "Official score" : "Add score"}
                        </span>
                        <button
                          type="button"
                          className="font-bold tracking-[0.24px] text-[#0d47a1]"
                          onClick={() => setAddingScore(true)}
                        >
                          Add Score
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {addingScore ? (
                    <div className="space-y-2 pt-1">
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
                  ) : null}

                  {!editingLsat ? (
                    <button
                      type="button"
                      className="py-2 text-left text-xs font-bold tracking-[0.24px] text-[#0d47a1]"
                      onClick={openLsatEditor}
                    >
                      Edit LSAT &amp; Scores
                    </button>
                  ) : (
                    <div className="space-y-2 pt-1">
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
                          onClick={() => setEditingLsat(false)}
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
                  )}
                </div>
              </article>

              <article className="min-w-0 rounded-[24px] border border-[#dfe1e7] bg-white p-4 sm:p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-semibold tracking-[0.24px] text-[#666d80]">Law school cycle</p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 py-2 text-xl font-bold leading-[1.35] text-[#0d47a1]"
                    onClick={openLsatEditor}
                  >
                    {formatLawSchoolCycle(preferences)}
                    <PlusCircle className="size-5" aria-hidden />
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </StudentMain>
    </>
  )
}

export { DashboardPage }
