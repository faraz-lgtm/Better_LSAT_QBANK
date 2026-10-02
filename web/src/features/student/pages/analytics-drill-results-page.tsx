import { Navigate, useParams, useSearchParams } from "react-router-dom"

import { practiceSessionResultsPath } from "@/features/student/analytics/analytics-results-paths"

/** @deprecated Use `/app/practice/results/:sessionId` — kept for old links. */
function AnalyticsDrillResultsPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get("returnTo")?.trim() || undefined
  return (
    <Navigate
      to={practiceSessionResultsPath(sessionId, { source: "drill", returnTo })}
      replace
    />
  )
}

export { AnalyticsDrillResultsPage }
