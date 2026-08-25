import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"
import { StudentAppSidebar } from "@/features/app-shell/student-app-sidebar"
import {
  GUEST_FREE_PLAN_DASHBOARD_HREF,
} from "@/features/guest/diagnostic/guest-free-plan-nav-config"
import { useEffect, useState } from "react"
import {
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Dumbbell,
  FileQuestion,
  FileText,
  Headphones,
  LayoutDashboard,
  LineChart,
  Lock,
  LogOut,
  Moon,
  RotateCcw,
  Search,
  type LucideIcon,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  GUEST_FREE_PLAN_DASHBOARD_HREF,
  GUEST_FREE_PLAN_NAV_SECTIONS,
  GUEST_FREE_PLAN_RESULTS_HREF,
  isGuestFreePlanAnalyticsActive,
  isGuestFreePlanDashboardActive,
} from "@/features/guest/diagnostic/guest-free-plan-nav-config"
import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { STUDENT_APP_VERSION } from "@/features/app-shell/student-nav-config"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type GuestFreePlanSidebarProps = {
  mobileOpen: boolean
  onMobileClose: () => void
  dashboardHref?: string
}

const GUEST_FREE_PLAN_NAV_ICONS: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Diagnostic: ClipboardCheck,
  "Diagnostic Results": BarChart3,
  "Practice Exams": BookOpenCheck,
  "Question Bank": Search,
  Drills: Dumbbell,
  Schedule: CalendarDays,
  "Wrong Review": RotateCcw,
  Analytics: LineChart,
  "Trend Line": LineChart,
  Skills: Brain,
  Sections: FileText,
  Question: FileQuestion,
}

function GuestFreePlanNavIcon({ label }: { label: string }) {
  const Icon = GUEST_FREE_PLAN_NAV_ICONS[label] ?? FileText
  return (
    <span className="student-sidebar-link-icon" aria-hidden>
      <Icon className="size-4" strokeWidth={1.9} />
    </span>
  )
}

function GuestFreePlanSidebar({
  mobileOpen,
  onMobileClose,
  dashboardHref = GUEST_FREE_PLAN_DASHBOARD_HREF,
}: GuestFreePlanSidebarProps) {
  return (
    <StudentAppSidebar
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
      dashboardHref={dashboardHref}
      lockPremiumNav
      beforeFooter={<FreePlanUpgradeCard />}
    />
  )
}

export { GuestFreePlanSidebar }
