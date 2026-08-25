import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  STUDENT_DIAGNOSTIC_ICON,
  STUDENT_NAV_ITEM_ICON_SRC,
} from "@/features/app-shell/student-nav-config"
import {
  DIAGNOSTIC_RESULTS_FULL_HREF,
  DIAGNOSTIC_RESULTS_MINI_HREF,
  isDiagnosticResultsPath,
  isDiagnosticResultsSectionPath,
} from "@/features/student/diagnostic/diagnostic-results-routes"
import { cn } from "@/lib/utils"

type DiagnosticResultsNavItemProps = {
  showIcon?: boolean
}

function DiagnosticResultsNavItem({ showIcon = false }: DiagnosticResultsNavItemProps) {
  const { pathname } = useLocation()
  const onResultsRoute = isDiagnosticResultsPath(pathname)
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null)
  const expanded = manualExpanded ?? onResultsRoute

  useEffect(() => {
    if (onResultsRoute) setManualExpanded(null)
  }, [onResultsRoute])

  return (
    <div className="student-sidebar-expandable">
      <button
        type="button"
        className={cn(
          "student-sidebar-link w-full justify-between pr-3",
          onResultsRoute && "student-sidebar-link--active",
        )}
        aria-expanded={expanded}
        onClick={() => setManualExpanded(!expanded)}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {showIcon ? (
            <span className="student-sidebar-link-icon" aria-hidden>
              <img src={STUDENT_NAV_ITEM_ICON_SRC[STUDENT_DIAGNOSTIC_ICON]} alt="" width={16} height={16} />
            </span>
          ) : null}
          <span className="truncate">Diagnostic Results</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#666d80] transition-transform duration-150",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="student-sidebar-subnav" role="group" aria-label="Diagnostic result history">
          <Link
            to={DIAGNOSTIC_RESULTS_MINI_HREF}
            className={cn(
              "student-sidebar-link student-sidebar-sublink",
              isDiagnosticResultsSectionPath(pathname, "mini") && "student-sidebar-link--active",
            )}
          >
            Mini
          </Link>
          <Link
            to={DIAGNOSTIC_RESULTS_FULL_HREF}
            className={cn(
              "student-sidebar-link student-sidebar-sublink",
              isDiagnosticResultsSectionPath(pathname, "full") && "student-sidebar-link--active",
            )}
          >
            Full
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export { DiagnosticResultsNavItem }
