import { useCallback, useLayoutEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { StudentAppHeader } from '@/features/app-shell/student-app-header'
import { PortalChatWidget } from '@/features/app-shell/portal-chat-widget'
import { isPracticeImmersiveRoute } from '@/features/app-shell/practice-immersive-route'
import { RequireLsacContentAccess } from '@/features/app-shell/require-lsac-content-access'
import { StudentAppSidebar } from '@/features/app-shell/student-app-sidebar'
import { StudentEntitlementProvider } from '@/features/app-shell/student-entitlement-context'
import { GuestFreePlanSidebar } from '@/features/guest/diagnostic/guest-free-plan-sidebar'
import { GuestUpgradeCta } from '@/features/guest/diagnostic/guest-upgrade-cta'
import { useDiagnosticSubscription } from '@/features/guest/diagnostic/use-diagnostic-subscription'
import {
  StudentPageHeaderSlotProvider,
  useStudentPageHeaderSlotState,
} from '@/features/app-shell/student-page-header-slot'
import { cn } from '@/lib/utils'
import { useLawHubSessionLoginLog } from '@/lib/auth/use-lawhub-session-login-log'

function StudentAppShell() {
  useLawHubSessionLoginLog()
  const location = useLocation()
  const immersive = isPracticeImmersiveRoute(location.pathname)
  const { hasActiveCore, loading: subscriptionLoading } = useDiagnosticSubscription()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const { headerActions, breadcrumbTail, setHeaderActions, setBreadcrumbTail } = useStudentPageHeaderSlotState()

  const freePlanShell = !subscriptionLoading && !hasActiveCore

  useLayoutEffect(() => {
    document.documentElement.classList.add('student-shell-active')
    return () => {
      document.documentElement.classList.remove('student-shell-active')
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('student-shell-immersive', immersive)
    return () => {
      document.documentElement.classList.remove('student-shell-immersive')
    }
  }, [immersive])

  return (
    <StudentEntitlementProvider>
      <StudentPageHeaderSlotProvider setHeaderActions={setHeaderActions} setBreadcrumbTail={setBreadcrumbTail}>
        <div
          className={cn(
            'flex h-svh min-h-0 overflow-hidden',
            'flex h-svh min-h-0 overflow-hidden bg-[var(--primary-0)]',
          )}
        >
          {immersive ? null : freePlanShell ? (
            <GuestFreePlanSidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
          ) : (
            <StudentAppSidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
          )}
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {immersive ? null : (
              <StudentAppHeader
                breadcrumbTail={breadcrumbTail}
                onOpenMobileNav={() => setMobileNavOpen(true)}
                headerActions={freePlanShell ? <GuestUpgradeCta /> : headerActions}
              />
            )}
            <div className="flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <RequireLsacContentAccess>
                <Outlet />
              </RequireLsacContentAccess>
            </div>
          </div>
        </div>
        <PortalChatWidget />
      </StudentPageHeaderSlotProvider>
    </StudentEntitlementProvider>
  )
}

export { StudentAppShell }
