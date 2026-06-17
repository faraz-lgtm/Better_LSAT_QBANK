import { useEffect, useMemo, useState } from "react"
import { Navigate, useParams, useSearchParams } from "react-router-dom"

import { StudentMain } from "@/features/student/components/student-main"
import { buildExplanationQuestionDetailView } from "@/features/student/explanation-detail/build-explanation-detail-view"
import { ExplanationAnalyticsTabPanel } from "@/features/student/explanation-detail/explanation-analytics-tab-panel"
import { ExplanationDetailTabBar } from "@/features/student/explanation-detail/explanation-detail-tab-bar"
import { ExplanationExplainTabPanel } from "@/features/student/explanation-detail/explanation-explain-tab-panel"
import { ExplanationQuestionTabPanel } from "@/features/student/explanation-detail/explanation-question-tab-panel"
import {
  cacheExplanationPrepTestTree,
  getCachedExplanationPrepTestTree,
} from "@/features/student/explanation-detail/explanation-tree-cache"
import { locateExplanationQuestion } from "@/features/student/explanation-detail/explanation-question-index"
import type { ExplanationDetailTabId } from "@/features/student/explanation-detail/types"
import { createExplanationsApi, type ExplanationDetailPayload } from "@/lib/api/explanations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"

function parseTab(raw: string | null): ExplanationDetailTabId {
  if (raw === "explanation" || raw === "analytics") return raw
  return "question"
}

function neighborHref(questionId: string | null, tab: ExplanationDetailTabId): string | null {
  if (!questionId) return null
  const q = tab === "question" ? "" : `?tab=${tab}`
  return `/app/learn/explanations/q/${encodeURIComponent(questionId)}${q}`
}

function ExplanationQuestionDetailPage() {
  const { questionId: questionIdParam } = useParams<{ questionId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const questionId = questionIdParam ? decodeURIComponent(questionIdParam) : ""

  const [detail, setDetail] = useState<ExplanationDetailPayload | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [bootstrapLoading, setBootstrapLoading] = useState(false)

  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams])

  const explanationsApi = useMemo(() => {
    try {
      return createExplanationsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const setTab = (t: ExplanationDetailTabId) => {
    if (t === "question") setSearchParams({}, { replace: true })
    else setSearchParams({ tab: t }, { replace: true })
  }

  const loc = locateExplanationQuestion(questionId)

  useEffect(() => {
    if (!questionId || !explanationsApi) return
    if (loc) return
    if (getCachedExplanationPrepTestTree(detail?.prepTestId ?? "")) return

    let alive = true
    setBootstrapLoading(true)
    void explanationsApi
      .getExplanationDetail(questionId)
      .then(async (d) => {
        if (!alive) return
        setDetail(d)
        if (getCachedExplanationPrepTestTree(d.prepTestId)) return
        const tree = await explanationsApi.getPrepTestTree(d.prepTestId)
        if (!alive) return
        cacheExplanationPrepTestTree(tree)
      })
      .catch(() => {
        /* detail fetch may fail separately */
      })
      .finally(() => {
        if (alive) setBootstrapLoading(false)
      })
    return () => {
      alive = false
    }
  }, [questionId, explanationsApi, loc, detail?.prepTestId])

  useEffect(() => {
    if (!explanationsApi || !questionId) return

    let alive = true
    setDetailLoading(true)
    setDetailError(null)
    void explanationsApi
      .getExplanationDetail(questionId)
      .then((d) => {
        if (!alive) return
        setDetail(d)
        if (!getCachedExplanationPrepTestTree(d.prepTestId)) {
          return explanationsApi.getPrepTestTree(d.prepTestId).then((tree) => {
            if (!alive) return
            cacheExplanationPrepTestTree(tree)
          })
        }
      })
      .catch((e) => {
        if (!alive) return
        setDetailError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to load question")
      })
      .finally(() => {
        if (alive) setDetailLoading(false)
      })
    return () => {
      alive = false
    }
  }, [explanationsApi, questionId])

  useEffect(() => {
    if (tab === "explanation" && detail && !detail.explanationHtml && !detail.videoUrl) {
      setSearchParams({}, { replace: true })
    }
  }, [tab, detail, setSearchParams])

  const resolvedLoc = locateExplanationQuestion(questionId)
  const view = resolvedLoc ? buildExplanationQuestionDetailView(resolvedLoc, detail) : null

  const initialExpandedChoiceId = useMemo(() => {
    const raw = searchParams.get("choice")?.trim().toUpperCase()
    if (!raw || !view) return null
    const match = view.choices.find((c) => c.id.toUpperCase() === raw)
    return match?.id ?? null
  }, [searchParams, view])

  if (!questionId) return <Navigate to="/app/learn/explanations" replace />

  if (!explanationsApi) {
    return (
      <StudentMain className="py-10">
        <p className="text-sm text-[#95122b]">Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
      </StudentMain>
    )
  }

  if (detailError && !resolvedLoc) {
    return <Navigate to="/app/learn/explanations" replace />
  }

  if (!resolvedLoc && (bootstrapLoading || detailLoading)) {
    return (
      <StudentMain className="py-10">
        <StudentPageLoader centered label="Loading question…" />
      </StudentMain>
    )
  }

  if (!resolvedLoc || !view) {
    return <Navigate to="/app/learn/explanations" replace />
  }

  return (
    <StudentMain className="bg-[var(--greyscale-25)] py-4 pb-10 md:py-4">
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
            hasExplanationTab={view.hasExplanationTab}
          />
        </div>
      </div>

      {detailError ? <p className="mt-4 text-sm text-[#95122b]">{detailError}</p> : null}

      <div className="mt-6">
        {detailLoading && tab === "question" ? (
          <StudentPageLoader label="Loading question…" />
        ) : null}
        {tab === "question" && !detailLoading ? (
          <ExplanationQuestionTabPanel view={view} initialExpandedChoiceId={initialExpandedChoiceId} />
        ) : null}
        {tab === "explanation" ? <ExplanationExplainTabPanel videos={view.videos} /> : null}
        {tab === "analytics" && detailError ? (
          <p className="text-sm text-[#95122b]">{detailError}</p>
        ) : null}
        {tab === "analytics" && !detailError && (detailLoading || !detail) ? (
          <StudentPageLoader label="Loading analytics…" />
        ) : null}
        {tab === "analytics" && !detailError && !detailLoading && detail ? (
          <ExplanationAnalyticsTabPanel analytics={view.analytics} />
        ) : null}
      </div>
    </StudentMain>
  )
}

export { ExplanationQuestionDetailPage }
