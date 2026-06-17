import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Bell, ChevronDown, Menu } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { getStudentBreadcrumbs } from "@/features/app-shell/student-nav-config"
import { STUDENT_PAGE_CONTAINER_CLASS, STUDENT_SHELL_GUTTER_CLASS } from "@/features/student/components/student-page-container"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function getDisplayName(email: string | null): string {
  if (!email) return "Student"
  const [local] = email.split("@")
  if (!local) return "Student"
  const normalized = local.replace(/[._-]+/g, " ").trim()
  return normalized
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ")
}

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "S"
  if (parts.length === 1) return parts[0][0]!.toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

type StudentAppHeaderProps = {
  onOpenMobileNav: () => void
  headerActions?: ReactNode
}

function StudentAppHeader({ onOpenMobileNav, headerActions }: StudentAppHeaderProps) {
  const { pathname, search } = useLocation()
  const [email, setEmail] = useState<string | null>(null)
  const [openProfileMenu, setOpenProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  const crumbs = useMemo(() => getStudentBreadcrumbs(pathname, search), [pathname, search])

  useEffect(() => {
    let mounted = true
    const supabase = getSupabaseBrowserClient()
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setEmail(data.user?.email ?? null)
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => setOpenProfileMenu(false))
  }, [pathname, search])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (!profileMenuRef.current?.contains(event.target)) setOpenProfileMenu(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    setOpenProfileMenu(false)
    window.location.assign("/login")
  }

  const displayName = useMemo(() => getDisplayName(email), [email])
  const initials = useMemo(() => getInitials(displayName), [displayName])
  const lastCrumbIndex = crumbs.length - 1

  return (
    <header className="student-topbar sticky top-0 z-30 shrink-0 border-b border-[#dfe1e7] bg-[#f3f7ff]">
      <div className="student-shell-top-row flex items-center">
        <div className={cn(STUDENT_PAGE_CONTAINER_CLASS, STUDENT_SHELL_GUTTER_CLASS, "flex w-full items-center justify-between gap-4")}>
          <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#dfe1e7] bg-[#edf3ff] text-[#0d47a1] lg:hidden"
            aria-label="Open navigation menu"
            onClick={onOpenMobileNav}
          >
            <Menu className="size-5" />
          </button>

          <nav aria-label="Breadcrumb" className="student-topbar-breadcrumbs min-w-0">
            <ol className="flex flex-wrap items-center gap-1">
              {crumbs.map((crumb, index) => {
                const isLast = index === lastCrumbIndex
                return (
                  <Fragment key={`${crumb.label}-${index}`}>
                    {index > 0 ? (
                      <li aria-hidden className="text-xs font-semibold tracking-[0.24px] text-[#666d80]">
                        /
                      </li>
                    ) : null}
                    <li>
                      {isLast || !crumb.href ? (
                        <span
                          aria-current={isLast ? "page" : undefined}
                          className={cn(
                            isLast ? "font-medium text-[#0d47a1]" : "font-normal text-[#666d80]",
                          )}
                        >
                          {crumb.label}
                        </span>
                      ) : (
                        <Link to={crumb.href} className="font-normal text-[#666d80] hover:text-[#0d47a1]">
                          {crumb.label}
                        </Link>
                      )}
                    </li>
                  </Fragment>
                )
              })}
            </ol>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {headerActions ? <div className="flex shrink-0 items-center">{headerActions}</div> : null}
          <button
            type="button"
            className="inline-flex size-[46px] items-center justify-center rounded-[20px] bg-[#edf3ff] text-[#0d47a1]"
            aria-label="Notifications"
          >
            <Bell className="size-6" strokeWidth={1.75} />
          </button>

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              className="flex h-[60px] items-center gap-3 rounded-[20px] px-3 hover:bg-[#edf3ff]/60"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={openProfileMenu}
              onClick={() => setOpenProfileMenu((current) => !current)}
            >
              <span className="flex size-[42px] items-center justify-center rounded-full bg-[#0d47a1] text-sm font-semibold text-white">
                {initials}
              </span>
              <span className="hidden flex-col items-start text-left leading-[1.5] sm:flex">
                <span className="text-base font-semibold tracking-[0.32px] text-[#062357]">{displayName}</span>
                <span className="max-w-[180px] truncate text-xs tracking-[0.24px] text-black/80">
                  {email ?? "student@example.com"}
                </span>
              </span>
              <ChevronDown
                className={cn("hidden size-4 text-[#666d80] sm:block", openProfileMenu && "rotate-180")}
              />
            </button>
            {openProfileMenu ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[180px] rounded-2xl border border-[#dfe1e7] bg-[#edf3ff] p-2 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]">
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-semibold tracking-[0.02em] text-[#062357] hover:bg-white/80"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
        </div>
      </div>
    </header>
  )
}

export { StudentAppHeader }
