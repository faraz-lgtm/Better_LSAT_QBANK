import { Outlet } from "react-router-dom"

import { StudentAppHeader } from "@/features/app-shell/student-app-header"

function StudentAppShell() {
  return (
    <div className="auth-page flex min-h-svh flex-col bg-[#f5f9ff]">
      <StudentAppHeader />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}

export { StudentAppShell }
