import { Navigate, useParams, useSearchParams } from "react-router-dom"

function PracticePrepTestSectionPage() {
  const { testId } = useParams<{ testId: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("sessionId")

  if (sessionId) {
    return <Navigate to={`/app/practice/sections/session/${encodeURIComponent(sessionId)}`} replace />
  }

  if (testId) {
    return <Navigate to={`/app/practice/preptest/${encodeURIComponent(testId)}`} replace />
  }

  return <Navigate to="/app/practice/preptest" replace />
}

export { PracticePrepTestSectionPage }
