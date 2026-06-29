import { useCallback, useLayoutEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { StudentAppHeader } from "@/features/app-shell/student-app-header"
import { isPracticeImmersiveRoute } from "@/features/app-shell/practice-immersive-route"
import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"
import {
  StudentPageHeaderSlotProvider,
  useStudentPageHeaderSlotState,
} from "@/features/app-shell/student-page-header-slot"
import { cn } from "@/lib/utils"
import { useLawHubSessionLoginLog } from "@/lib/auth/use-lawhub-session-login-log"

function StudentAppShell() {
  useLawHubSessionLoginLog()
  const location = useLocation()
  const immersive = isPracticeImmersiveRoute(location.pathname)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const { headerActions, breadcrumbTail, setHeaderActions, setBreadcrumbTail } = useStudentPageHeaderSlotState()

  useLayoutEffect(() => {
    document.documentElement.classList.add("student-shell-active")
    return () => {
      document.documentElement.classList.remove("student-shell-active")
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("student-shell-immersive", immersive)
    return () => {
      document.documentElement.classList.remove("student-shell-immersive")
    }
  }, [immersive])

  return (
    <StudentPageHeaderSlotProvider setHeaderActions={setHeaderActions} setBreadcrumbTail={setBreadcrumbTail}>
      <div
        className={cn(
          "flex h-svh min-h-0 overflow-hidden",
          "flex h-svh min-h-0 overflow-hidden bg-[var(--primary-0)]",
        )}
      >
        {immersive ? null : (
          <StudentAppSidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
        )}
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {immersive ? null : (
            <StudentAppHeader
              breadcrumbTail={breadcrumbTail}
              onOpenMobileNav={() => setMobileNavOpen(true)}
              headerActions={headerActions}
            />
          )}
          <div className="flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </StudentPageHeaderSlotProvider>
  )
}

export { StudentAppShell }
