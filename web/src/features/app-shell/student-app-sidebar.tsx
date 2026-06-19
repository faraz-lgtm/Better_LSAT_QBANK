import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, LayoutGrid, LogOut } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  getActiveSectionKey,
  isDashboardActive,
  isNavItemActive,
  STUDENT_APP_VERSION,
  STUDENT_DASHBOARD_HREF,
  STUDENT_NAV_SECTIONS,
  type StudentNavSectionKey,
} from "@/features/app-shell/student-nav-config"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const SIDEBAR_COLLAPSED_KEY = "student-sidebar-collapsed"

function AcademyIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M1.33301 4.66683H14.6663M9.33301 8.00016H11.9997M9.33301 10.6668H11.9997M4.96448 10.8511L6.8071 9.92978C7.29847 9.6841 7.29847 8.98289 6.80711 8.73721L4.96448 7.8159C4.52122 7.59427 3.99967 7.9166 3.99967 8.41219V10.2548C3.99967 10.7504 4.52122 11.0727 4.96448 10.8511ZM3.99967 14.6668H11.9997C13.4724 14.6668 14.6663 13.4729 14.6663 12.0002V4.00016C14.6663 2.5274 13.4724 1.3335 11.9997 1.3335H3.99967C2.52692 1.3335 1.33301 2.5274 1.33301 4.00016V12.0002C1.33301 13.4729 2.52692 14.6668 3.99967 14.6668Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PrepIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="15" viewBox="0 0 14 15" fill="none" className={className} aria-hidden>
      <path
        d="M9.41667 2.00049C9.00245 2.00049 8.66667 2.33627 8.66667 2.75049C8.66667 3.1647 9.00245 3.50049 9.41667 3.50049V2.75049V2.00049ZM4.08333 3.50049C4.49755 3.50049 4.83333 3.1647 4.83333 2.75049C4.83333 2.33627 4.49755 2.00049 4.08333 2.00049V2.75049V3.50049ZM7.5 12.0838C7.5 11.6696 7.16421 11.3338 6.75 11.3338C6.33579 11.3338 6 11.6696 6 12.0838H6.75H7.5ZM4.75 13.3338C4.33579 13.3338 4 13.6696 4 14.0838C4 14.498 4.33579 14.8338 4.75 14.8338V14.0838V13.3338ZM8.75 14.8338C9.16421 14.8338 9.5 14.498 9.5 14.0838C9.5 13.6696 9.16421 13.3338 8.75 13.3338V14.0838V14.8338ZM7.5 1.5421C7.5 1.12789 7.16421 0.792102 6.75 0.792102C6.33579 0.792102 6 1.12789 6 1.5421H6.75H7.5ZM6 5.23632C6 5.65053 6.33579 5.98632 6.75 5.98632C7.16421 5.98632 7.5 5.65053 7.5 5.23632H6.75H6ZM4.61515 0.753411L4.53325 1.49893V1.49893L4.61515 0.753411ZM6.75 1.41715L6.32773 2.03699L6.75 2.32466L7.17227 2.03699L6.75 1.41715ZM4.61515 4.7359L4.53325 5.48142V5.48142L4.61515 4.7359ZM6.75 5.41715L6.32773 6.03699C6.58249 6.21054 6.91751 6.21054 7.17227 6.03699L6.75 5.41715ZM8.88485 0.753411L8.96675 1.49893V1.49893L8.88485 0.753411ZM8.88485 4.7359L8.96675 5.48142V5.48142L8.88485 4.7359ZM12.75 4.08382H12V10.7505H12.75H13.5V4.08382H12.75ZM11.4167 12.0838V11.3338H2.08333V12.0838V12.8338H11.4167V12.0838ZM0.75 10.7505H1.5V4.08382H0.75H0V10.7505H0.75ZM9.41667 2.75049V3.50049H11.4167V2.75049V2.00049H9.41667V2.75049ZM2.08333 2.75049V3.50049H4.08333V2.75049V2.00049H2.08333V2.75049ZM2.08333 12.0838V11.3338C1.76117 11.3338 1.5 11.0727 1.5 10.7505H0.75H0C0 11.9011 0.93274 12.8338 2.08333 12.8338V12.0838ZM12.75 10.7505H12C12 11.0727 11.7388 11.3338 11.4167 11.3338V12.0838V12.8338C12.5673 12.8338 13.5 11.9011 13.5 10.7505H12.75ZM12.75 4.08382H13.5C13.5 2.93323 12.5673 2.00049 11.4167 2.00049V2.75049V3.50049C11.7388 3.50049 12 3.76166 12 4.08382H12.75ZM0.75 4.08382H1.5C1.5 3.76166 1.76117 3.50049 2.08333 3.50049V2.75049V2.00049C0.93274 2.00049 0 2.93323 0 4.08382H0.75ZM6.75 12.0838H6V14.0838H6.75H7.5V12.0838H6.75ZM6.75 14.0838V13.3338H4.75V14.0838V14.8338H6.75V14.0838ZM6.75 14.0838V14.8338H8.75V14.0838V13.3338H6.75V14.0838ZM6.75 1.5421H6V5.23632H6.75H7.5V1.5421H6.75ZM4.61515 0.753411L4.53325 1.49893C4.79099 1.52724 5.14229 1.58929 5.48867 1.68687C5.84508 1.78729 6.14178 1.9103 6.32773 2.03699L6.75 1.41715L7.17227 0.797324C6.7919 0.538198 6.31696 0.361836 5.89543 0.243077C5.46385 0.121488 5.03088 0.0445703 4.69706 0.00789601L4.61515 0.753411ZM4.61515 4.7359L4.53325 5.48142C4.78495 5.50907 5.13394 5.57423 5.48117 5.67597C5.83725 5.78029 6.13787 5.90764 6.32773 6.03699L6.75 5.41715L7.17227 4.79732C6.79581 4.54086 6.32479 4.36008 5.90292 4.23648C5.4722 4.11028 5.03693 4.02773 4.69706 3.99039L4.61515 4.7359ZM4.08333 1.2522H3.33333V4.1727H4.08333H4.83333V1.2522H4.08333ZM4.61515 4.7359L4.69706 3.99039C4.72696 3.99368 4.75572 4.00707 4.77985 4.03214C4.80599 4.05931 4.83333 4.10878 4.83333 4.1727H4.08333H3.33333C3.33333 4.89526 3.90863 5.4128 4.53325 5.48142L4.61515 4.7359ZM4.61515 0.753411L4.69706 0.00789601C3.91348 -0.0781875 3.33333 0.560781 3.33333 1.2522H4.08333H4.83333C4.83333 1.31093 4.80894 1.37396 4.75755 1.42306C4.70289 1.47528 4.61934 1.50838 4.53325 1.49893L4.61515 0.753411ZM8.88485 0.753411L8.80294 0.00789601C8.46912 0.0445703 8.03615 0.121488 7.60458 0.243077C7.18304 0.361836 6.7081 0.538198 6.32773 0.797324L6.75 1.41715L7.17227 2.03699C7.35822 1.9103 7.65492 1.78729 8.01133 1.68687C8.35771 1.58929 8.70901 1.52724 8.96675 1.49893L8.88485 0.753411ZM8.88485 4.7359L8.80294 3.99039C8.46307 4.02773 8.0278 4.11028 7.59708 4.23648C7.17521 4.36008 6.70419 4.54086 6.32773 4.79732L6.75 5.41715L7.17227 6.03699C7.36213 5.90764 7.66275 5.78029 8.01883 5.67597C8.36606 5.57423 8.71505 5.50907 8.96675 5.48142L8.88485 4.7359ZM9.41667 1.2522H8.66667V4.1727H9.41667H10.1667V1.2522H9.41667ZM8.88485 4.7359L8.96675 5.48142C9.59137 5.4128 10.1667 4.89526 10.1667 4.1727H9.41667H8.66667C8.66667 4.10878 8.69401 4.05931 8.72015 4.03214C8.74428 4.00707 8.77304 3.99368 8.80294 3.99039L8.88485 4.7359ZM8.88485 0.753411L8.96675 1.49893C8.88066 1.50838 8.79711 1.47528 8.74245 1.42306C8.69106 1.37396 8.66667 1.31093 8.66667 1.2522H9.41667H10.1667C10.1667 0.560781 9.58652 -0.0781875 8.80294 0.00789601L8.88485 0.753411Z"
        fill="currentColor"
      />
    </svg>
  )
}

function InsightsIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M7.99967 4.66683V11.3335M11.333 6.00016V10.0002M4.66634 6.00016V10.0002M3.99967 14.6668H11.9997C13.4724 14.6668 14.6663 13.4729 14.6663 12.0002V4.00016C14.6663 2.5274 13.4724 1.3335 11.9997 1.3335H3.99967C2.52692 1.3335 1.33301 2.5274 1.33301 4.00016V12.0002C1.33301 13.4729 2.52692 14.6668 3.99967 14.6668Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function sectionIcon(key: StudentNavSectionKey, className?: string) {
  if (key === "academy") return <AcademyIcon className={className} />
  if (key === "prep") return <PrepIcon className={className} />
  return <InsightsIcon className={className} />
}

type StudentAppSidebarProps = {
  mobileOpen: boolean
  onMobileClose: () => void
}

function StudentAppSidebar({ mobileOpen, onMobileClose }: StudentAppSidebarProps) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const activeSectionKey = getActiveSectionKey(pathname)
  const dashboardActive = isDashboardActive(pathname)

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1"
  })

  const [expandedSection, setExpandedSection] = useState<StudentNavSectionKey | null>(
    () => activeSectionKey,
  )

  useEffect(() => {
    setExpandedSection(activeSectionKey)
  }, [activeSectionKey])

  useEffect(() => {
    onMobileClose()
  }, [onMobileClose, pathname, search])

  const sidebarWidthClass = useMemo(() => (collapsed ? "w-[72px]" : "w-[272px]"), [collapsed])

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0")
      return next
    })
  }

  function toggleSection(key: StudentNavSectionKey) {
    setExpandedSection((current) => (current === key ? null : key))
  }

  function openSection(key: StudentNavSectionKey) {
    if (collapsed) {
      setCollapsed(false)
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "0")
    }
    setExpandedSection(key)
  }

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={cn(
          "student-sidebar fixed inset-y-0 left-0 z-50 flex h-svh shrink-0 flex-col border-r border-[color:var(--greyscale-100)] bg-[var(--primary-0)] transition-[width,transform] duration-200 lg:static lg:translate-x-0",
          sidebarWidthClass,
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Main navigation"
      >
        <div className="student-shell-top-row flex items-center border-b border-[color:var(--greyscale-100)] p-2">
          <div
            className={cn(
              "flex w-full items-center",
              collapsed ? "justify-center" : "justify-between px-3",
            )}
          >
            {!collapsed ? (
              <Link to={STUDENT_DASHBOARD_HREF} className="flex min-w-0 flex-1 items-center" aria-label="betterLSAT home">
                <img src="/betterLSAT_LOGO.png" alt="betterLSAT" className="h-[18px] w-[144px] object-contain" />
              </Link>
            ) : null}
            <button
              type="button"
              className="hidden size-6 shrink-0 items-center justify-center rounded-lg border border-[color:var(--greyscale-100)] bg-[var(--primary-25)] text-[#0d47a1] lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleCollapsed}
            >
              <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
            </button>
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-2">
          {!collapsed ? (
            <p className="px-3 py-1 text-sm font-medium tracking-[0.28px] text-[#666d80]">Main</p>
          ) : null}

          <div className="mt-1 flex flex-col gap-2">
            <Link
              to={STUDENT_DASHBOARD_HREF}
              aria-label="Dashboard"
              className={cn(
                "student-sidebar-section-btn",
                dashboardActive && "student-sidebar-section-btn--active student-sidebar-section-btn--solo-active",
                collapsed && "justify-center px-3",
              )}
            >
              <span className="flex items-center gap-1">
                <LayoutGrid
                  className={cn("size-4 shrink-0", dashboardActive ? "text-[#f3f7ff]" : "text-[#0d47a1]")}
                  aria-hidden
                />
                {!collapsed ? (
                  <span
                    className={cn(
                      "text-sm font-semibold tracking-[0.28px]",
                      dashboardActive ? "text-[#f3f7ff]" : "text-[#0d47a1]",
                    )}
                  >
                    Dashboard
                  </span>
                ) : null}
              </span>
            </Link>

            {STUDENT_NAV_SECTIONS.map((section) => {
              const expanded = expandedSection === section.key
              const siblingHrefs = section.items.map((entry) => entry.href)

              const sectionButton = (
                <button
                  type="button"
                  className={cn(
                    "student-sidebar-section-btn",
                    expanded && "student-sidebar-section-btn--active",
                    collapsed && "justify-center px-3",
                  )}
                  aria-expanded={expanded}
                  onClick={() => {
                    if (collapsed) {
                      openSection(section.key)
                      return
                    }
                    toggleSection(section.key)
                  }}
                >
                  <span className="flex items-center gap-1">
                    {sectionIcon(
                      section.key,
                      cn(
                        "shrink-0",
                        section.key === "prep" ? "h-[15px] w-[14px]" : "size-4",
                        expanded ? "text-[#f3f7ff]" : "text-[#0d47a1]",
                      ),
                    )}
                    {!collapsed ? (
                      <span
                        className={cn(
                          "text-sm font-semibold tracking-[0.28px]",
                          expanded ? "text-[#f3f7ff]" : "text-[#0d47a1]",
                        )}
                      >
                        {section.label}
                      </span>
                    ) : null}
                  </span>
                  {!collapsed ? (
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 transition-transform",
                        expanded ? "text-[#f3f7ff]" : "text-[#0d47a1]",
                        expanded ? "rotate-180" : "",
                      )}
                    />
                  ) : null}
                </button>
              )

              if (collapsed) {
                return <div key={section.key}>{sectionButton}</div>
              }

              if (!expanded) {
                return <div key={section.key}>{sectionButton}</div>
              }

              return (
                <div key={section.key} className="student-sidebar-dropdown">
                  {sectionButton}
                  <div className="flex flex-col gap-2">
                    {section.items.map((item) => {
                      const active = isNavItemActive(pathname, item.href, search, siblingHrefs)
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn("student-sidebar-item", active && "student-sidebar-item--active")}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </nav>

        <div className={cn("mt-auto shrink-0 border-t border-transparent px-4 py-2", collapsed && "px-2")}>
          <button
            type="button"
            className={cn(
              "flex h-[42px] w-full items-center gap-1 rounded-[10px] px-3 text-sm font-semibold tracking-[0.28px] text-[#0d47a1] hover:bg-[#edf3ff]",
              collapsed && "justify-center px-0",
            )}
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            {!collapsed ? <span>Logout</span> : null}
            {!collapsed ? (
              <span className="ml-auto text-[8px] font-semibold tracking-[0.16px] text-[#0d47a1]">
                Version {STUDENT_APP_VERSION}
              </span>
            ) : null}
          </button>
        </div>
      </aside>
    </>
  )
}

export { StudentAppSidebar }
