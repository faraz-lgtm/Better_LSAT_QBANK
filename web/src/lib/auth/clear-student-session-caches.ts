import { getAppStore } from "@/app/store-ref"
import { clearPrepTestDetailCache } from "@/features/student/preptests/prep-test-detail-cache"
import { clearPrepTestPoolCache } from "@/features/student/preptests/prep-test-pool-cache"
import { clearSectionSessionCache } from "@/features/student/sections/section-session-cache"
import { resetEnsureStudentSessionInflight } from "@/features/student-session/ensure-student-session"
import { resetStudentSession } from "@/features/student-session/studentSessionSlice"
import { resetAnalyticsPageBundleCache } from "@/lib/api/analytics"

/** Clear Redux student session + analytics TTL cache (logout / unauthorized). */
export function clearStudentSessionCaches(): void {
  getAppStore().dispatch(resetStudentSession())
  resetEnsureStudentSessionInflight()
  resetAnalyticsPageBundleCache()
  clearPrepTestPoolCache()
  clearPrepTestDetailCache()
  clearSectionSessionCache()
}
