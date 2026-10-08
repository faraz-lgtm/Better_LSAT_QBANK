import { useMemo } from "react"
import { Navigate, useParams, useSearchParams } from "react-router-dom"

import { StudentMain } from "@/features/student/components/student-main"
import { buildExplanationQuestionNav } from "@/features/student/explanation-detail/build-explanation-question-nav"
import { ExplanationAnalyticsTabPanel } from "@/features/student/explanation-detail/explanation-analytics-tab-panel"
import { ExplanationDetailTabBar } from "@/features/student/explanation-detail/explanation-detail-tab-bar"
import { ExplanationExplainTabPanel } from "@/features/student/explanation-detail/explanation-explain-tab-panel"
import { ExplanationQuestionTabPanel } from "@/features/student/explanation-detail/explanation-question-tab-panel"
import type { ExplanationDetailTabId } from "@/features/student/explanation-detail/types"
import {
  buildDiagnosticExplanationLocation,
  buildDiagnosticExplanationQuestionDetailView,
} from "@/features/student/diagnostic/build-diagnostic-explanation-detail"
import { listDiagnosticHistory } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { readDiagnosticExplanationProgressMap } from "@/features/student/diagnostic/diagnostic-explanation-progress"
import {
  DIAGNOSTIC_EXPLANATIONS_HREF,
  diagnosticExplanationQuestionDetailHref,
} from "@/features/student/diagnostic/diagnostic-explanations-routes"

function parseTab(raw: string | null, showExplanationTab: boolean): ExplanationDetailTabId {
  if (raw === "analytics") return "analytics"
  if (raw === "explanation" && showExplanationTab) return "explanation"
  return "question"
}

function neighborHref(questionId: string | null, tab: ExplanationDetailTabId): string | null {
  if (!questionId) return null
  const q = tab === "question" ? "" : `?tab=${tab}`
  return `${diagnosticExplanationQuestionDetailHref(questionId)}${q}`
}

function DiagnosticExplanationQuestionDetailPage() {
  const { questionId: questionIdParam } = useParams<{ questionId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const questionId = questionIdParam ? decodeURIComponent(questionIdParam) : ""
  const attempts = useMemo(() => listDiagnosticHistory(), [])
  const progress = useMemo(() => readDiagnosticExplanationProgressMap(), [])

  const loc = useMemo(
    () => (questionId ? buildDiagnosticExplanationLocation(questionId, progress) : null),
    [questionId, progress],
  )
  const view = useMemo(
    () =>
      questionId
        ? buildDiagnosticExplanationQuestionDetailView(questionId, progress, attempts)
        : null,
    [questionId, progress, attempts],
  )

  const setTab = (t: ExplanationDetailTabId) => {
    if (t === "question") setSearchParams({}, { replace: true })
    else setSearchParams({ tab: t }, { replace: true })
  }

  const tab = useMemo(
    () => parseTab(searchParams.get("tab"), view?.hasExplanationTab ?? false),
    [searchParams, view?.hasExplanationTab],
  )

  const initialExpandedChoiceId = useMemo(() => {
    const raw = searchParams.get("choice")?.trim().toUpperCase()
    if (!raw || !view) return null
    const match = view.choices.find((c) => c.id.toUpperCase() === raw)
    return match?.id ?? null
  }, [searchParams, view])

  const questionNav = useMemo(() => (loc ? buildExplanationQuestionNav(loc.pt) : []), [loc])

  if (!questionId) return <Navigate to={DIAGNOSTIC_EXPLANATIONS_HREF} replace />
  if (!loc || !view) return <Navigate to={DIAGNOSTIC_EXPLANATIONS_HREF} replace />

  return (
    <StudentMain layout="scroll" className="bg-[var(--primary-0)]" contentClassName="bg-[var(--primary-0)]">
      <div className="flex flex-col gap-6">
        <ExplanationDetailTabBar
          headingCode={view.headingCode}
          subtitleTrail={view.subtitleTrail}
          questionId={questionId}
          questionNumber={view.questionNumber}
          questionNav={questionNav}
          tab={tab}
          onTabChange={setTab}
          prevHref={neighborHref(view.neighbors.prevRouteKey, tab)}
          nextHref={neighborHref(view.neighbors.nextRouteKey, tab)}
          showExplanationTab={view.hasExplanationTab}
          questionHrefBuilder={diagnosticExplanationQuestionDetailHref}
        />

        <div>
          {tab === "question" ? (
            <ExplanationQuestionTabPanel
              key={questionId}
              view={view}
              initialExpandedChoiceId={initialExpandedChoiceId}
            />
          ) : null}
          {tab === "explanation" ? <ExplanationExplainTabPanel videoOnly videos={view.videos} /> : null}
          {tab === "analytics" ? (
            <ExplanationAnalyticsTabPanel
              analytics={view.analytics}
              correctChoiceLetter={view.correctChoiceLetter}
            />
          ) : null}
        </div>
      </div>
    </StudentMain>
  )
}

export { DiagnosticExplanationQuestionDetailPage }
