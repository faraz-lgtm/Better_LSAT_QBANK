import { useCallback, useState } from "react"
import { Outlet } from "react-router-dom"

import { StudentAppHeader } from "@/features/app-shell/student-app-header"
import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"
import {
  StudentPageHeaderSlotProvider,
  useStudentPageHeaderSlotState,
} from "@/features/app-shell/student-page-header-slot"

function StudentAppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const { headerActions, setHeaderActions } = useStudentPageHeaderSlotState()

  return (
    <StudentPageHeaderSlotProvider setHeaderActions={setHeaderActions}>
      <div className="flex h-svh bg-[#f3f7ff]">
        <StudentAppSidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <StudentAppHeader onOpenMobileNav={() => setMobileNavOpen(true)} headerActions={headerActions} />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </StudentPageHeaderSlotProvider>
  )
}

export { StudentAppShell }
