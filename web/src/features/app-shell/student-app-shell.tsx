import { Outlet } from "react-router-dom"

import { StudentAppHeader } from "@/features/app-shell/student-app-header"

function StudentAppShell() {
  return (
    <div className="auth-page flex min-h-svh flex-col bg-[#f5f9ff]">
      <StudentAppHeader />
      <Outlet />
    </div>
  )
}

export { StudentAppShell }
