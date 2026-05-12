import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { BarChart3, Bell, BookOpen, ChevronDown, CircleDot } from "lucide-react"

import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type AppNavItem = {
  key: "learn" | "practice" | "analytics"
  label: string
  to: string
  icon: typeof BookOpen
  options: Array<{ label: string; to: string }>
}

const appNavItems: AppNavItem[] = [
  {
    key: "learn",
    label: "Learn",
    to: "/app/prep-course",
    icon: BookOpen,
    options: [
      { label: "Prep Course", to: "/app/prep-course" },
      { label: "Explanations", to: "/app/learn/explanations" },
    ],
  },
  {
    key: "practice",
    label: "Practice",
    to: "/app/practice/drills",
    icon: CircleDot,
    options: [
      { label: "Drills", to: "/app/practice/drills" },
      { label: "Sections", to: "/app/practice/sections" },
      { label: "PrepTest", to: "/app/practice/preptest" },
      { label: "Blind Review", to: "/app/practice/blind-review" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    to: "/app/analytics",
    icon: BarChart3,
    options: [
      { label: "Overview", to: "/app/analytics" },
      { label: "Drills", to: "/app/analytics/drills" },
      { label: "Sections", to: "/app/analytics/sections" },
      { label: "PrepTest", to: "/app/analytics/preptests" },
    ],
  },
]

function isActive(pathname: string, key: AppNavItem["key"]): boolean {
  if (key === "learn") return pathname.startsWith("/app/prep-course") || pathname.startsWith("/app/learn")
  if (key === "practice") return pathname.startsWith("/app/practice")
  return pathname.startsWith("/app/analytics")
}

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

function StudentAppHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<AppNavItem["key"] | null>(null)
  const [openProfileMenu, setOpenProfileMenu] = useState(false)
  const navRef = useRef<HTMLElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

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
    queueMicrotask(() => {
      setOpenMenu(null)
      setOpenProfileMenu(false)
    })
  }, [pathname])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      const insideNav = Boolean(navRef.current?.contains(event.target))
      const insideProfile = Boolean(profileMenuRef.current?.contains(event.target))
      if (!insideNav) setOpenMenu(null)
      if (!insideProfile) setOpenProfileMenu(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    setOpenProfileMenu(false)
    navigate("/login", { replace: true })
  }

  const displayName = useMemo(() => getDisplayName(email), [email])
  const initials = useMemo(() => getInitials(displayName), [displayName])

  return (
    <header className="sticky top-0 z-20 bg-[#f5f9ff]/95 backdrop-blur">
      <div className="figma-container auth-header-inner mx-auto flex h-[92px] w-full items-center justify-between">
        <div className="flex h-[60px] items-center gap-8 rounded-[20px] bg-[#edf3ff] px-6">
          <Link
            to="/app"
            className="flex h-10 items-center"
            aria-label="betterLSAT home"
          >
            <img
              src="/brand-logo.png"
              alt="betterLSAT"
              className="h-[22px] w-auto select-none"
              draggable={false}
            />
          </Link>
          <nav ref={navRef} className="flex items-center gap-6">
            {appNavItems.map((item) => {
              const active = isActive(pathname, item.key)
              const Icon = item.icon
              const isOpen = openMenu === item.key
              return (
                <div key={item.key} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenu((current) => (current === item.key ? null : item.key))}
                    className={cn(
                      "flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold tracking-[0.02em] transition-colors",
                      active
                        ? "border border-[#0b4e6e] bg-[#0d47a1] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
                        : "text-[#0d47a1] hover:bg-white/70",
                    )}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-label={`${item.label} menu`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    <ChevronDown className={cn("size-4 transition-transform", isOpen ? "rotate-180" : "")} />
                  </button>

                  {isOpen ? (
                    <div className="absolute left-0 top-[calc(100%+12px)] z-30 rounded-bl-2xl rounded-br-2xl border-x border-b border-[#dfe1e7] bg-[#edf3ff] px-4 py-6 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]">
                      <div className="flex min-w-[130px] flex-col items-start gap-3">
                        {item.options.map((option) => (
                          <Link
                            key={option.label}
                            to={option.to}
                            onClick={() => setOpenMenu(null)}
                            className="h-6 text-sm font-semibold leading-6 tracking-[0.02em] text-[#062357] hover:underline"
                          >
                            {option.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-[60px] items-center rounded-[20px] bg-[#edf3ff] px-3 text-[#666d80]"
            aria-label="Notifications"
          >
            <span className="flex size-9 items-center justify-center rounded-full">
              <Bell className="size-5" />
            </span>
          </button>

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              className="flex h-[60px] items-center gap-3 rounded-[20px] bg-[#edf3ff] px-3"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={openProfileMenu}
              onClick={() => setOpenProfileMenu((current) => !current)}
            >
              <span className="flex size-[42px] items-center justify-center rounded-full bg-[#0d47a1] text-sm font-semibold text-white">
                {initials}
              </span>
              <span className="flex flex-col items-start text-left leading-[1.5] text-[#062357]">
                <span className="text-base font-semibold tracking-[0.02em]">{displayName}</span>
                <span className="max-w-[210px] truncate text-xs font-normal tracking-[0.02em] text-black">
                  {email ?? "student@example.com"}
                </span>
              </span>
              <span className="flex size-9 items-center justify-center rounded-[10px] text-[#666d80]">
                <ChevronDown className={cn("size-5 transition-transform", openProfileMenu ? "rotate-180" : "")} />
              </span>
            </button>
            {openProfileMenu ? (
              <div className="absolute right-0 top-[calc(100%+12px)] z-30 min-w-[180px] rounded-2xl border border-[#dfe1e7] bg-[#edf3ff] p-2 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]">
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
    </header>
  )
}

export { StudentAppHeader }
