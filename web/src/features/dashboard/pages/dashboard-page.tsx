import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStudentEntitlement } from "@/features/app-shell/student-entitlement-context"
import { DashboardAccessSetupCard } from "@/features/dashboard/components/dashboard-access-setup-card"
import { DashboardQuickStats } from "@/features/dashboard/components/dashboard-quick-stats"
import { PerformanceOverviewCard } from "@/features/dashboard/components/performance-overview-card"
import { PrepTestsScoreProgressCard } from "@/features/dashboard/components/preptests-score-progress-card"
import { TestDayCountdownCard } from "@/features/dashboard/components/test-day-countdown-card"
import {
  formatLawSchoolCycle,
  formatPlannedLsatHeadline,
} from "@/features/dashboard/lib/map-dashboard-preferences"
import {
  daysUntilDate,
  formatLsacTestMeta,
  formatTestDateInputValue,
  mapOverviewToDashboardStats,
  mapOverviewToPerformance,
} from "@/features/dashboard/lib/map-dashboard-stats"
import { mapTrajectoryToScoreProgress } from "@/features/student/analytics/map-analytics"
import { useAnalyticsApi } from "@/features/student/analytics/hooks/use-analytics-api"
import { ContinueDrillCard, continueDrillToCardDrill } from "@/features/student/components/continue-drill-card"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { takeLastByTimeRange } from "@/features/student/components/time-range-filter"
import { DASHBOARD_ADAPTIVE_DRILL_QUESTION_COUNT } from "@/features/student/drills/adaptive-drill-config"
import { DASHBOARD_ADAPTIVE_DRILL_QUERY } from "@/features/student/drills/drill-blind-review-policy"
import {
  type ContinueDrill,
  mapPriorityToSuggestedDrill,
  mapSessionToContinueDrill,
  type SuggestedDrill,
} from "@/features/student/drills/drill-dashboard-mappers"
import type { AnalyticsOverview, TrajectoryPoint } from "@/lib/api/analytics"
import type { OfficialLsatScore, StudentStudyContext } from "@/lib/api/users"
import { createUsersApi } from "@/lib/api/users"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function filterChipStyles(active: boolean): string {
  if (active) {
    return "inline-flex h-8 items-center rounded-xl border border-[#0b4e6e] bg-[#0d47a1] px-4 text-xs font-semibold tracking-[0.24px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
  }
  return "inline-flex h-8 items-center rounded-xl border border-[#dfe1e7] bg-white px-4 text-xs font-semibold tracking-[0.24px] text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)]"
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

function firstNameFromFullName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim() ?? ""
  if (!trimmed) return ""
  return trimmed.split(/\s+/)[0] ?? ""
}

function DashboardPage() {
  const navigate = useNavigate()
  const { canAccessLsacContent, loading: entitlementLoading } = useStudentEntitlement()
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
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([])
  const [continueDrills, setContinueDrills] = useState<ContinueDrill[]>([])
  const [suggestedDrills, setSuggestedDrills] = useState<SuggestedDrill[]>([])
  const [studyContext, setStudyContext] = useState<StudentStudyContext | null>(null)
  const [firstName, setFirstName] = useState("")
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
    if (!canAccessLsacContent) {
      setOverview(null)
      setTrajectory([])
      setContinueDrills([])
      setSuggestedDrills([])
      setLoading(false)
      return
    }

    if (!analyticsApi || !usersApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [overviewData, drillSessions, priorities, context, trajectoryPoints, profile] =
        await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getSessions({ kind: "DRILL", limit: 50 }),
          analyticsApi.getPriorities(),
          usersApi.getStudyContext(),
          analyticsApi.getTrajectory(),
          usersApi.getMyProfile(),
        ])

      setOverview(overviewData)
      setStudyContext(context)
      setTrajectory(trajectoryPoints)
      setFirstName(firstNameFromFullName(profile?.full_name))

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
  }, [analyticsApi, canAccessLsacContent, usersApi])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const statCards = useMemo(
    () => (overview ? mapOverviewToDashboardStats(overview) : []),
    [overview],
  )

  const performance = useMemo(
    () => (overview ? mapOverviewToPerformance(overview) : null),
    [overview],
  )

  const scoreProgressPoints = useMemo(() => {
    const recent = takeLastByTimeRange(trajectory, "all")
    return mapTrajectoryToScoreProgress(recent)
  }, [trajectory])

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
        questionCount: DASHBOARD_ADAPTIVE_DRILL_QUESTION_COUNT,
        timing: "unlimited",
        showAnswers: "end",
        selection: "auto",
        difficulty: "adaptive",
        // Backend prefers unanswered first, then tops up from the full pool to reach 5.
        status: "all",
        source: "dashboard_adaptive_drill",
      })
      navigate(`/app/practice/drills/session/${out.session.id}?${DASHBOARD_ADAPTIVE_DRILL_QUERY}=1`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start Smart Drill")
    } finally {
      setStartingAdaptiveDrill(false)
    }
  }, [activeFilter, navigate, practiceApi, startingAdaptiveDrill])

  const preferences = studyContext?.preferences ?? null
  const officialScores = studyContext?.officialScores ?? []
  const daysRemaining = daysUntilDate(preferences?.plannedLsatDate)

  async function handleSaveCycle() {
    if (!usersApi) return
    setSavingCycle(true)
    try {
      const nextPreferences = await usersApi.updateStudyPreferences({
        lawSchoolCycle: cycleDraft.trim() || null,
        plannedLsatDate: plannedDateDraft.trim() || null,
      })
      setStudyContext((prev) =>
        prev ? { ...prev, preferences: nextPreferences } : { preferences: nextPreferences, officialScores: [] },
      )
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

  if (entitlementLoading || loading) {
    return (
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading dashboard…" />
      </StudentMain>
    )
  }

  if (!canAccessLsacContent) {
    return (
      <StudentMain>
        <div className="dashboard-page flex flex-col gap-6">
          <DashboardAccessSetupCard />
        </div>
      </StudentMain>
    )
  }

  return (
    <StudentMain>
      {error ? <p className="mb-4 text-sm text-[#95122b]">{error}</p> : null}

      <div className="dashboard-page flex flex-col gap-6">
        <div className="dashboard-page__top">
          <TestDayCountdownCard
            daysRemaining={daysRemaining}
            firstName={firstName}
            testMeta={formatLsacTestMeta(preferences?.plannedLsatDate)}
            testDateLabel={formatTestDateInputValue(preferences?.plannedLsatDate)}
            adaptiveLoading={startingAdaptiveDrill}
            adaptiveDisabled={!practiceApi}
            onEditTestDate={openLsatEditor}
            onStartAdaptiveDrill={() => void handleStartAdaptiveDrill()}
          />

          <DashboardQuickStats cards={statCards} />

          <article className="min-w-0 rounded-[24px] border border-[#dfe1e7] bg-white p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
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
                      scoreValueDraft.trim() !== "" && parseOfficialScaledScoreDraft(scoreValueDraft) == null
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
                      disabled={savingScore || !canSubmitOfficialScore(scoreLabelDraft, scoreValueDraft)}
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
        </div>

        <div className="dashboard-page__mid">
          {performance ? <PerformanceOverviewCard overview={performance} /> : null}

          <article className="min-w-0 rounded-[24px] border border-[#dfe1e7] bg-white p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold tracking-[0.24px] text-[#666d80]">Law school cycle</p>
              <button
                type="button"
                className="inline-flex items-center gap-2 py-2 text-xl font-bold leading-[1.35] text-[#0d47a1]"
                onClick={openLsatEditor}
              >
                {formatLawSchoolCycle(preferences)}
                <span className="size-5 shrink-0 overflow-hidden">
                  <img src="/dashboard/cycle-edit.svg" alt="" className="size-full" width={20} height={20} />
                </span>
              </button>
            </div>
          </article>
        </div>

        <div className="dashboard-page__bottom">
          <section className="min-w-0 rounded-[24px] border border-[#dfe1e7] bg-white p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-[0.36px] text-[#062357]">Active Drills</h2>
                <p className="text-xs tracking-[0.24px] text-[#666d80]">Pick up where you left off</p>
              </div>
              <div className="flex flex-wrap gap-2">
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
                      onContinue={() => navigate(suggested ? drill.configPath : drill.continuePath)}
                    />
                  )
                })}
              </div>
            )}
          </section>

          <PrepTestsScoreProgressCard points={scoreProgressPoints} />
        </div>
      </div>
    </StudentMain>
  )
}

export { DashboardPage }
