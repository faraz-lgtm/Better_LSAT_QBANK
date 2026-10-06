import { Outlet } from "react-router-dom"

import "@/features/admin/admin-theme.css"
import { AdminSidebar } from "@/features/admin/layout/admin-sidebar"
import { AdminTopbar } from "@/features/admin/layout/admin-topbar"

function AdminShell() {
  return (
    <div className="admin-page flex h-svh">
      <AdminSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">
          <div className="mx-auto flex w-full max-w-[1168px] flex-1 flex-col p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export { AdminShell }
