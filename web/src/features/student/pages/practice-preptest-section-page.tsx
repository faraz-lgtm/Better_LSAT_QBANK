import { Navigate, useParams, useSearchParams } from "react-router-dom"

import {
  isRetakePrepTestAttempt,
  sectionSessionHref,
} from "@/features/student/preptests/preptest-hub-navigation"

function PracticePrepTestSectionPage() {
  const { testId } = useParams<{ testId: string; sectionId: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("sessionId")
  const isRetakeAttempt = isRetakePrepTestAttempt(searchParams)

  if (!testId) {
    return <Navigate to="/app/practice/preptest" replace />
  }

  if (!sessionId) {
    return <Navigate to={`/app/practice/preptest/${encodeURIComponent(testId)}`} replace />
  }

  return (
    <Navigate
      to={sectionSessionHref(sessionId, { prepTestId: testId, retake: isRetakeAttempt })}
      replace
    />
  )
}

export { PracticePrepTestSectionPage }
