import { Navigate, useParams, useSearchParams } from "react-router-dom"

import {
  isRetakePrepTestAttempt,
  prepTestHubHref,
  PREPTEST_LIST_HREF,
  sectionSessionHref,
} from "@/features/student/preptests/preptest-hub-navigation"

function PracticePrepTestSectionPage() {
  const { testId } = useParams<{ testId: string; sectionId: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("sessionId")
  const isRetakeAttempt = isRetakePrepTestAttempt(searchParams)

  if (!testId) {
    return <Navigate to={PREPTEST_LIST_HREF} replace />
  }

  if (!sessionId) {
    return <Navigate to={prepTestHubHref(testId)} replace />
  }

  return (
    <Navigate
      to={sectionSessionHref(sessionId, { prepTestId: testId, retake: isRetakeAttempt })}
      replace
    />
  )
}

export { PracticePrepTestSectionPage }
