import { Navigate, useParams, useSearchParams } from "react-router-dom"

/** @deprecated Use `/app/practice/results/:sessionId` — kept for old links. */
function AnalyticsDrillResultsPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const q = searchParams.toString()
  const suffix = q ? `?${q}` : ""
  return <Navigate to={`/app/practice/results/${encodeURIComponent(sessionId)}${suffix}`} replace />
}

export { AnalyticsDrillResultsPage }
