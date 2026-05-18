import { useMemo } from "react"
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom"

import { StudentMain } from "@/features/student/components/student-main"
import { buildExplanationQuestionDetailView } from "@/features/student/explanation-detail/build-explanation-detail-view"
import { ExplanationAnalyticsTabPanel } from "@/features/student/explanation-detail/explanation-analytics-tab-panel"
import { ExplanationDetailTabBar } from "@/features/student/explanation-detail/explanation-detail-tab-bar"
import { ExplanationExplainTabPanel } from "@/features/student/explanation-detail/explanation-explain-tab-panel"
import { ExplanationQuestionTabPanel } from "@/features/student/explanation-detail/explanation-question-tab-panel"
import { locateExplanationQuestion } from "@/features/student/explanation-detail/explanation-question-index"
import type { ExplanationDetailTabId } from "@/features/student/explanation-detail/types"

function parseTab(raw: string | null): ExplanationDetailTabId {
  if (raw === "explanation" || raw === "analytics") return raw
  return "question"
}

function neighborHref(routeKey: string | null, tab: ExplanationDetailTabId): string | null {
  if (!routeKey) return null
  const q = tab === "question" ? "" : `?tab=${tab}`
  return `/app/learn/explanations/q/${routeKey}${q}`
}

function ExplanationQuestionDetailPage() {
  const { questionKey } = useParams<{ questionKey: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams])

  const setTab = (t: ExplanationDetailTabId) => {
    if (t === "question") setSearchParams({}, { replace: true })
    else setSearchParams({ tab: t }, { replace: true })
  }

  if (!questionKey) return <Navigate to="/app/learn/explanations" replace />

  const loc = locateExplanationQuestion(questionKey)
  if (!loc) return <Navigate to="/app/learn/explanations" replace />

  const view = buildExplanationQuestionDetailView(loc)

  return (
    <StudentMain className="bg-[var(--greyscale-25)] py-4 pb-10 md:py-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold tracking-tight text-[color:var(--color-student-heading)] md:text-xl">Explanations</h1>
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Breadcrumb">
          <Link to="/app/prep-course" className="font-medium text-[color:var(--text)] hover:underline">
            Learn
          </Link>
          <span className="px-0.5 font-normal text-[color:var(--border)]">/</span>
          <Link to="/app/prep-course" className="font-medium text-[color:var(--text)] hover:underline">
            Foundations
          </Link>
          <span className="px-0.5 font-normal text-[color:var(--border)]">/</span>
          <Link to="/app/learn/explanations" className="font-medium text-[color:var(--text)] hover:underline">
            Explanations
          </Link>
          <span className="px-0.5 font-normal text-[color:var(--border)]">/</span>
          <span
            className="max-w-[200px] truncate font-semibold text-[color:var(--color-student-heading)] md:max-w-none"
            title={view.headingCode}
          >
            {view.headingCode}
          </span>
        </nav>
      </header>

      <div className="h-6 shrink-0" aria-hidden />

      <div
        className="p-5 md:p-6"
        style={{
          borderColor: "var(--greyscale-100)",
          backgroundColor: "color-mix(in srgb, var(--student-expanded-row) 55%, var(--greyscale-25))",
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold tracking-tight text-[color:var(--color-student-heading)] md:text-3xl">
              {view.headingCode}
            </h2>
            <p className="mt-1 text-sm font-medium text-[#6A7282] md:text-[15px]">{view.subtitleTrail}</p>
          </div>
          <ExplanationDetailTabBar
            tab={tab}
            onTabChange={setTab}
            prevHref={neighborHref(view.neighbors.prevRouteKey, tab)}
            nextHref={neighborHref(view.neighbors.nextRouteKey, tab)}
          />
        </div>
      </div>

      <div className="mt-6">
        {tab === "question" ? <ExplanationQuestionTabPanel view={view} /> : null}
        {tab === "explanation" ? <ExplanationExplainTabPanel videos={view.videos} /> : null}
        {tab === "analytics" ? <ExplanationAnalyticsTabPanel analytics={view.analytics} /> : null}
      </div>
    </StudentMain>
  )
}

export { ExplanationQuestionDetailPage }
