import { Outlet } from "react-router-dom"

import { AuthHeader } from "@/features/auth/components/auth-header"

function StudentAppShell() {
  return (
    <div className="auth-page flex min-h-svh flex-col bg-[#f5f9ff]">
      <AuthHeader ctaLabel="Log In" ctaHref="/login" variant="app" />
      <Outlet />
    </div>
  )
}

export { StudentAppShell }
