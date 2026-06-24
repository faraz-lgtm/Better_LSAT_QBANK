import { Navigate, useLocation } from "react-router-dom"

import { PREPTEST_LIST_HREF, rewriteLegacyPrepTestPath } from "@/features/student/preptests/preptest-routes"

function LegacyPrepTestPathRedirect() {
  const { pathname, search } = useLocation()
  return <Navigate to={rewriteLegacyPrepTestPath(pathname, search)} replace />
}

export { LegacyPrepTestPathRedirect, PREPTEST_LIST_HREF }
