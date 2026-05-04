import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { FigmaIcon } from "@/components/icons/figma-icons"
import { Button } from "@/components/ui/button"
import { SystemIcon } from "@/components/icons"

type NavMenuKey = "learn" | "practice" | "analytics"

const navMenus: Array<{ key: NavMenuKey; label: string; items: Array<{ label: string; href?: string }> }> = [
  { key: "learn", label: "Learn", items: [{ label: "Prep Course", href: "/app/prep-course" }, { label: "Explanations" }] },
  { key: "practice", label: "Practice", items: [{ label: "Drills" }, { label: "Sections" }, { label: "PrepTest" }, { label: "Blind Review" }] },
  { key: "analytics", label: "Analytics", items: [{ label: "Overview" }, { label: "Drills" }, { label: "Sections" }, { label: "PrepTest" }] },
]

function AuthHeader({
  ctaLabel,
  ctaHref,
  variant = "auth",
}: {
  ctaLabel: string
  ctaHref: "/login" | "/signup"
  variant?: "auth" | "app"
}) {
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

  return (
    <header className="sticky top-0 z-20 border-b border-[#dfe1e7] bg-[#f5f9ff]/95 backdrop-blur">
      <div className="figma-container auth-header-inner relative mx-auto flex h-[60px] w-full items-center justify-between figma-gap-12 lg:figma-gap-24">
        <div className="flex min-w-0 flex-1 items-center figma-gap-12 md:figma-gap-24">
          <Link
            to="/login"
            className="figma-text-base shrink-0 font-semibold tracking-normal text-[#062357] sm:figma-text-lg"
          >
            <span className="font-extrabold">Better</span> LSAT
          </Link>
          <nav ref={navRef} className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex lg:gap-2">
            {navMenus.map((menu) => {
              const isOpen = openMenu === menu.key
              return (
                <div key={menu.key} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={isOpen ? "text-[#ff6f00]" : "text-[#062357]"}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    onClick={() => setOpenMenu((current) => (current === menu.key ? null : menu.key))}
                  >
                    {menu.label}
                    <SystemIcon name="nav" size="xs" className={isOpen ? "rotate-90 text-[#ff6f00]" : "text-[#062357]"} />
                  </Button>

                  {isOpen ? (
                    <div className="absolute top-[44px] left-1/2 z-40 min-w-[132px] -translate-x-1/2 rounded-b-2xl border-x border-b border-[#dfe1e7] bg-[#f3f7ff] p-6 shadow-[0px_24px_48px_0px_rgba(13,13,18,0.12)]">
                      <div className="flex flex-col items-start gap-2">
                        {menu.items.map((item) =>
                          item.href ? (
                            <Link
                              key={item.label}
                              to={item.href}
                              className="h-6 text-left text-sm font-semibold tracking-[0.28px] text-[#082c6b]"
                              onClick={() => setOpenMenu(null)}
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <button
                              key={item.label}
                              type="button"
                              className="h-6 text-left text-sm font-semibold tracking-[0.28px] text-[#082c6b]"
                              onClick={() => setOpenMenu(null)}
                            >
                              {item.label}
                            </button>
                          ),
                        )}
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
          {variant === "app" ? (
            <div className="hidden items-center gap-3 md:flex">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-2 border-[#0d47a1] figma-px-16 text-[#0d47a1] hover:bg-[#0d47a1]/5"
              >
                Get more
                <SystemIcon name="nav" size="xs" className="text-[#0d47a1]" />
              </Button>
              <div className="inline-flex items-center gap-1 text-sm font-semibold text-[#666d80]">
                <FigmaIcon name="link-02" className="size-5 text-[#666d80]" />
                <span>0</span>
              </div>
              <FigmaIcon name="bell-05" className="size-5 text-[#666d80]" />
              <FigmaIcon name="user-circle" className="size-5 text-[#666d80]" />
            </div>
          ) : (
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
          )}
        </div>

        {mobileNavOpen ? (
          <nav
            id="auth-mobile-nav"
            className="absolute top-full right-4 left-4 z-30 mt-1 flex flex-col gap-1 rounded-2xl border border-[#dfe1e7] bg-white p-2 shadow-md md:hidden"
          >
            {["Learn", "Practice", "Analytics"].map((label) => (
              <Button
                key={label}
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start text-[#062357]"
                onClick={() => setMobileNavOpen(false)}
              >
                {label}
                <SystemIcon name="nav" size="xs" />
              </Button>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  )
}

export { AuthHeader }
