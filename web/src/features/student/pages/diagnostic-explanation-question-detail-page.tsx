import { useEffect, useMemo, useState } from "react"
import { Navigate, useParams, useSearchParams } from "react-router-dom"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { canShowDiagnosticExplanationForQuestionId } from "@/features/guest/diagnostic/diagnostic-explanation-access"
import { listDiagnosticHistory } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { useDiagnosticSubscription } from "@/features/guest/diagnostic/use-diagnostic-subscription"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { readDiagnosticExplanationProgressMap } from "@/features/student/diagnostic/diagnostic-explanation-progress"
import {
  DIAGNOSTIC_EXPLANATIONS_HREF,
  diagnosticExplanationQuestionDetailHref,
} from "@/features/student/diagnostic/diagnostic-explanations-routes"
import {
  collectMiniDiagnosticVideoAspectRatios,
  collectMiniDiagnosticVideoUrls,
} from "@/features/student/diagnostic/mini-diagnostic-video-urls"
import { createDiagnosticApi } from "@/lib/api/diagnostic"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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
  const { hasActiveCore, loading: subscriptionLoading } = useDiagnosticSubscription()
  const { openPricingModal } = useGuestPricingModal()
  const attempts = useMemo(() => listDiagnosticHistory(), [])
  const progress = useMemo(() => readDiagnosticExplanationProgressMap(), [])
  const [videoUrlByQuestionId, setVideoUrlByQuestionId] = useState<Map<string, string>>(() => new Map())
  const [videoAspectRatioByQuestionId, setVideoAspectRatioByQuestionId] = useState<Map<string, string>>(
    () => new Map(),
  )
  const explanationsUnlocked =
    !subscriptionLoading &&
    canShowDiagnosticExplanationForQuestionId({ questionId, hasActiveCore })

  useEffect(() => {
    let cancelled = false
    const diagnosticApi = createDiagnosticApi(getSupabaseBrowserClient())
    void diagnosticApi
      .getMiniDiagnosticExplanations()
      .then((res) => {
        if (cancelled) return
        // Video URLs are returned even when written explanations are locked.
        const explanations = res.explanations ?? []
        const videoUrls = res.videoUrls ?? []
        setVideoUrlByQuestionId(collectMiniDiagnosticVideoUrls(explanations, videoUrls))
        setVideoAspectRatioByQuestionId(
          collectMiniDiagnosticVideoAspectRatios(explanations, videoUrls),
        )
      })
      .catch(() => {
        /* keep static detail without video tab */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loc = useMemo(
    () => (questionId ? buildDiagnosticExplanationLocation(questionId, progress) : null),
    [questionId, progress],
  )
  const videoUrl = questionId ? (videoUrlByQuestionId.get(questionId) ?? null) : null
  const videoAspectRatio = questionId
    ? (videoAspectRatioByQuestionId.get(questionId) ?? null)
    : null
  const view = useMemo(
    () =>
      questionId
        ? buildDiagnosticExplanationQuestionDetailView(
            questionId,
            progress,
            attempts,
            videoUrl,
            videoAspectRatio,
            hasActiveCore && !subscriptionLoading,
          )
        : null,
    [questionId, progress, attempts, videoUrl, videoAspectRatio, hasActiveCore, subscriptionLoading],
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

        {!explanationsUnlocked && !subscriptionLoading ? (
          <div
            className="flex flex-col items-start gap-3 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-5"
            data-testid="diagnostic-explanation-locked-banner"
          >
            <div className="flex items-center gap-2 text-[var(--color-student-heading)]">
              <Lock className="size-4 shrink-0 text-[var(--primary)]" aria-hidden />
              <p className="m-0 text-sm font-semibold">Explanation locked on the free plan</p>
            </div>
            <p className="m-0 text-sm text-[var(--greyscale-500)]">
              Free accounts can open the first 5 Mini Diagnostic explanations and the first 10 Full
              Section / Full Diagnostic explanations. Upgrade to unlock every written explanation and
              video.
            </p>
            <Button type="button" onClick={openPricingModal}>
              See plans
            </Button>
          </div>
        ) : null}

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
