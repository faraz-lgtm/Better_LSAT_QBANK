import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { StudentMain } from "@/features/student/components/student-main"
import {
  TimeRangeSegmented,
  filterByTimeRange,
  type TimeRangeValue,
} from "@/features/student/components/time-range-filter"
import {
  SectionAttemptArchive,
  SectionInsightStatsRow,
  SectionKindSwitcher,
  SectionTrajectoryPanel,
  type SectionArchiveSort,
  type SectionTrajectoryTab,
} from "@/features/student/analytics/components/section-insights-ui"
import {
  buildSectionInsightAttempts,
  buildSectionTrajectoryPoints,
  computeSectionInsightStats,
  filterSectionSessions,
  sortSectionInsightAttempts,
  type SectionInsightKind,
} from "@/features/student/analytics/section-insights"
import { practiceSessionResultsPath } from "@/features/student/analytics/analytics-results-paths"
import {
  persistSessionBookmark,
  sessionBookmarkState,
  withSessionBookmark,
} from "@/features/student/analytics/session-bookmarks"
import { parseAnalyticsSectionParam } from "@/features/student/analytics/section-filter"
import { useAnalyticsApi, usePracticeApi } from "@/features/student/analytics/hooks/use-analytics-api"
import type { PracticeSessionSummary } from "@/lib/api/analytics"

function resolveActiveKind(param: string | null): SectionInsightKind {
  const parsed = parseAnalyticsSectionParam(param)
  return parsed === "RC" ? "RC" : "LR"
}

function AnalyticsSectionsPage() {
  const navigate = useNavigate()
  const analyticsApi = useAnalyticsApi()
  const practiceApi = usePracticeApi()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeKind = resolveActiveKind(searchParams.get("section"))
  const [loading, setLoading] = useState(true)
  const [sectionSessions, setSectionSessions] = useState<PracticeSessionSummary[]>([])
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("all")
  const [trajectoryTab, setTrajectoryTab] = useState<SectionTrajectoryTab>("correct")
  const [archiveSort, setArchiveSort] = useState<SectionArchiveSort>("recent")

  useEffect(() => {
    if (!analyticsApi) {
      setLoading(false)
      return
    }
    setLoading(true)
    void analyticsApi
      .getSessions({ kind: "SECTION", completedOnly: true, limit: 500 })
      .then((sections) => setSectionSessions(sections.sessions))
      .finally(() => setLoading(false))
  }, [analyticsApi])

  const handleSelectKind = useCallback(
    (next: SectionInsightKind) => {
      const params = new URLSearchParams(searchParams)
      params.set("section", next.toLowerCase())
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const rangedSessions = useMemo(
    () =>
      filterByTimeRange(sectionSessions, timeRange, (session) => session.completedAt, {
        keepNewestIfEmpty: false,
      }),
    [sectionSessions, timeRange],
  )

  const lrCount = useMemo(() => filterSectionSessions(rangedSessions, "LR").length, [rangedSessions])
  const rcCount = useMemo(() => filterSectionSessions(rangedSessions, "RC").length, [rangedSessions])

  const stats = useMemo(
    () => computeSectionInsightStats(rangedSessions, activeKind),
    [activeKind, rangedSessions],
  )
  const trajectoryPoints = useMemo(
    () => buildSectionTrajectoryPoints(rangedSessions, activeKind),
    [activeKind, rangedSessions],
  )
  const archiveAttempts = useMemo(() => {
    const rows = buildSectionInsightAttempts(rangedSessions, activeKind)
    return sortSectionInsightAttempts(rows, archiveSort)
  }, [activeKind, archiveSort, rangedSessions])

  const handleToggleBookmark = useCallback(
    (id: string) => {
      const previous = sessionBookmarkState(sectionSessions, id)
      const next = !previous
      setSectionSessions((current) => withSessionBookmark(current, id, next))
      void persistSessionBookmark({
        sessionId: id,
        bookmarked: next,
        practiceApi,
        onFailure: () => setSectionSessions((current) => withSessionBookmark(current, id, previous)),
      })
    },
    [practiceApi, sectionSessions],
  )

  const handleSelectAttempt = useCallback(
    (id: string) => {
      navigate(practiceSessionResultsPath(id, { source: "section" }))
    },
    [navigate],
  )

  if (loading) {
    return (
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading section analytics…" />
      </StudentMain>
    )
  }

  return (
    <StudentMain>
      <div className="flex flex-col gap-6">
        <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3">
          <h1 className="!m-0 !text-lg !font-semibold !leading-[1.4] tracking-[0.36px] text-[var(--color-student-heading)]">
            Section Insights
          </h1>
          <TimeRangeSegmented value={timeRange} onChange={setTimeRange} className="shrink-0" />
        </div>

        <SectionKindSwitcher
          active={activeKind}
          lrCount={lrCount}
          rcCount={rcCount}
          onChange={handleSelectKind}
        />

        {stats ? (
          <>
            <SectionInsightStatsRow stats={stats} kind={activeKind} />
            <SectionTrajectoryPanel
              kind={activeKind}
              points={trajectoryPoints}
              tab={trajectoryTab}
              onTabChange={setTrajectoryTab}
            />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-8 text-center text-sm text-[var(--greyscale-500)]">
            No {activeKind} sections recorded in this range. Try widening the time range.
          </p>
        )}

        <SectionAttemptArchive
          attempts={archiveAttempts}
          sort={archiveSort}
          onSortChange={setArchiveSort}
          onSelect={handleSelectAttempt}
          onToggleBookmark={handleToggleBookmark}
        />
      </div>
    </StudentMain>
  )
}

export { AnalyticsSectionsPage }
