import { Link, useLocation } from "react-router-dom"

import {
  STUDENT_DIAGNOSTIC_RESULTS_ICON,
  STUDENT_NAV_ITEM_ICON_SRC,
} from "@/features/app-shell/student-nav-config"
import {
  DIAGNOSTIC_RESULTS_ROOT,
  isDiagnosticResultsPath,
} from "@/features/student/diagnostic/diagnostic-results-routes"
import { cn } from "@/lib/utils"

type DiagnosticResultsNavItemProps = {
  showIcon?: boolean
}

function DiagnosticResultsNavItem({ showIcon = false }: DiagnosticResultsNavItemProps) {
  const { pathname } = useLocation()
  const onResultsRoute = isDiagnosticResultsPath(pathname)

  return (
    <Link
      to={DIAGNOSTIC_RESULTS_ROOT}
      className={cn("student-sidebar-link", onResultsRoute && "student-sidebar-link--active")}
      aria-label="Diagnostic Results"
      title="Diagnostic Results"
    >
      {showIcon ? (
        <span className="student-sidebar-link-icon" aria-hidden>
          <img
            src={STUDENT_NAV_ITEM_ICON_SRC[STUDENT_DIAGNOSTIC_RESULTS_ICON]}
            alt=""
            width={16}
            height={16}
          />
        </span>
      ) : null}
      <span className="student-sidebar-label truncate">Diagnostic Results</span>
    </Link>
  )
}

export { DiagnosticResultsNavItem }
