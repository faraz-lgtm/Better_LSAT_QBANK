import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"

import { FigmaIcon } from "@/components/icons/figma-icons"
import { Button } from "@/components/ui/button"
import { SystemIcon } from "@/components/icons"

type NavMenuKey = "learn" | "practice" | "analytics"

const navMenus: Array<{ key: NavMenuKey; label: string; items: Array<{ label: string; href: string }> }> = [
  {
    key: "learn",
    label: "Learn",
    items: [
      { label: "Prep Course", href: "/app/prep-course" },
      { label: "Explanations", href: "/app/learn/explanations" },
    ],
  },
  {
    key: "practice",
    label: "Practice",
    items: [
      { label: "Drills", href: "/app/practice/drills" },
      { label: "Sections", href: "/app/practice/sections" },
      { label: "PrepTest", href: "/app/practice/preptest" },
      { label: "Blind Review", href: "/app/practice/blind-review" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    items: [
      { label: "Overview", href: "/app/analytics" },
      { label: "Drills", href: "/app/analytics?tab=drills" },
      { label: "Sections", href: "/app/analytics?tab=sections" },
      { label: "PrepTest", href: "/app/analytics?tab=preptest" },
    ],
  },
]

function menuGroupActive(pathname: string, key: NavMenuKey): boolean {
  if (key === "learn") return pathname.startsWith("/app/prep-course") || pathname.startsWith("/app/learn")
  if (key === "practice") return pathname.startsWith("/app/practice")
  if (key === "analytics") return pathname.startsWith("/app/analytics")
  return false
}

function AuthHeader({
  ctaLabel,
  ctaHref,
  variant = "auth",
}: {
  ctaLabel: string
  ctaHref: "/login" | "/signup"
  variant?: "auth" | "app"
}) {
  if (variant === "app") {
    return (
      <header className="sticky top-0 z-20 border-b border-[#dfe1e7] bg-[#f5f9ff]/95 backdrop-blur">
        <div className="figma-container auth-header-inner relative mx-auto flex h-[60px] w-full items-center justify-end">
          <div className="flex size-9 items-center justify-center rounded-full border border-[#dfe1e7] bg-white text-[#666d80]">
            <FigmaIcon name="user-circle" className="size-5 text-[#666d80]" />
          </div>
        </div>
      </header>
    )
  }

  const location = useLocation()
  const pathname = location.pathname
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<NavMenuKey | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 768px)").matches) setMobileNavOpen(false)
      if (!window.matchMedia("(min-width: 1024px)").matches) setOpenMenu(null)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!navRef.current) return
      if (event.target instanceof Node && !navRef.current.contains(event.target)) {
        setOpenMenu(null)
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onEscape)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onEscape)
    }
  }, [])

  const brandHref = variant === "app" ? "/app" : "/login"

  return (
    <header className="sticky top-0 z-20 border-b border-[#dfe1e7] bg-[#f5f9ff]/95 backdrop-blur">
      <div className="figma-container auth-header-inner relative mx-auto flex h-[60px] w-full items-center justify-between figma-gap-12 lg:figma-gap-24">
        <div className="flex min-w-0 flex-1 items-center figma-gap-12 md:figma-gap-24">
          <Link
            to={brandHref}
            className="figma-text-base shrink-0 font-semibold tracking-normal text-[#062357] sm:figma-text-lg"
          >
            <span className="font-extrabold">Better</span> LSAT
          </Link>
          <nav ref={navRef} className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex lg:gap-2">
            {navMenus.map((menu) => {
              const isOpen = openMenu === menu.key
              const groupActive = menuGroupActive(pathname, menu.key)
              const highlight = isOpen || groupActive
              return (
                <div key={menu.key} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={highlight ? "text-[#ff6f00]" : "text-[#062357]"}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    onClick={() => setOpenMenu((current) => (current === menu.key ? null : menu.key))}
                  >
                    {menu.label}
                    <SystemIcon name="nav" size="xs" className={highlight ? "rotate-90 text-[#ff6f00]" : "text-[#062357]"} />
                  </Button>

                  {isOpen ? (
                    <div className="absolute top-[44px] left-1/2 z-40 min-w-[132px] -translate-x-1/2 rounded-b-2xl border-x border-b border-[#dfe1e7] bg-[#f3f7ff] p-6 shadow-[0px_24px_48px_0px_rgba(13,13,18,0.12)]">
                      <div className="flex flex-col items-start gap-2">
                        {menu.items.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            className="h-6 text-left text-sm font-semibold tracking-[0.28px] text-[#082c6b] hover:text-[#ff6f00]"
                            onClick={() => setOpenMenu(null)}
                          >
                            {item.label}
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
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-expanded={mobileNavOpen}
            aria-controls="auth-mobile-nav"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <SystemIcon name="grid" size="xs" className="text-[#062357]" />
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-2xl bg-[#0d47a1] figma-px-16 text-white hover:bg-[#0d47a1]/90 [&_svg]:text-white"
          >
            <Link to={ctaHref} className="inline-flex items-center gap-1.5">
              <span>{ctaLabel}</span>
              <SystemIcon name="nav" size="xs" className="shrink-0 text-white" />
            </Link>
          </Button>
        </div>

        {mobileNavOpen ? (
          <nav
            id="auth-mobile-nav"
            className="absolute top-full right-4 left-4 z-30 mt-1 max-h-[min(70vh,520px)] overflow-y-auto rounded-2xl border border-[#dfe1e7] bg-white p-2 shadow-md md:hidden"
          >
            {navMenus.map((menu) => (
              <div key={menu.key} className="border-b border-[#dfe1e7] py-2 last:border-b-0">
                <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#666d80]">{menu.label}</p>
                <div className="flex flex-col">
                  {menu.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-[#082c6b] hover:bg-[#f5f9ff]"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  )
}

export { AuthHeader }
