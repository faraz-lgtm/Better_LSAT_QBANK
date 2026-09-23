import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Menu } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { FigmaIcon } from "@/components/icons/figma-icons"
import { PREP_TEST_POOLS_HREF } from "@/features/account/prep-test-pool-types"
import { useStudentEntitlementOptional } from "@/features/app-shell/student-entitlement-context"
import { resolveStudentShellVariant } from "@/features/app-shell/student-shell-plan-variant"
import { useGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"
import {
  STUDENT_PAGE_CONTAINER_CLASS,
  STUDENT_SHELL_GUTTER_CLASS,
} from "@/features/student/components/student-page-container"
import { ThemeToggleButton } from "@/features/theme/theme-toggle"
import { createUsersApi } from "@/lib/api/users"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PROFILE_MENU_FIGMA = "/figma/profile-menu"

const PROFILE_MENU_ITEM_CLASS =
  "flex w-full items-center gap-2 rounded-[14px] p-2 text-left text-sm font-medium leading-[1.5] tracking-[0.28px] text-[color:var(--primary-800)] hover:bg-[color:var(--primary-25)]/80"

function ProfileMenuIcon({ src }: { src: string }) {
  return (
    <span className="relative inline-flex size-4 shrink-0 overflow-hidden" aria-hidden>
      <img src={src} alt="" width={16} height={16} className="size-4 max-w-none object-contain" />
    </span>
  )
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
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
}

function firstToken(value: string | null | undefined): string {
  return value?.trim().split(/\s+/)[0] ?? ""
}

function formatHeaderProfileName({
  firstName,
  lastName,
  fullName,
  email,
}: {
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  email?: string | null
}): string {
  const first = firstToken(firstName) || firstToken(fullName)
  const lastFromFull = (fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(1)
    .at(-1)
  const last = firstToken(lastName) || lastFromFull || ""
  if (first && last) return `${first} ${last[0]!.toUpperCase()}.`
  if (first) return first
  return getDisplayName(email ?? null)
}

type StudentAppHeaderProps = {
  onOpenMobileNav: () => void
  headerActions?: ReactNode
}

function StudentAppHeader({ onOpenMobileNav, headerActions }: StudentAppHeaderProps) {
  const { pathname, search } = useLocation()
  const entitlement = useStudentEntitlementOptional()?.entitlement ?? null
  const premiumAccount = useGuestPremiumAccount()
  const isPremium =
    resolveStudentShellVariant({
      accessState: entitlement?.accessState ?? null,
      hasGuestPremiumAccount: Boolean(premiumAccount),
    }) === "premium"
  const planLabel = isPremium ? "Premium" : "Free"
  const [email, setEmail] = useState<string | null>(null)
  const [profileFirstName, setProfileFirstName] = useState("")
  const [profileLastName, setProfileLastName] = useState("")
  const [profileFullName, setProfileFullName] = useState("")
  const [openProfileMenu, setOpenProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    try {
      const supabase = getSupabaseBrowserClient()
      void supabase.auth.getUser().then(({ data }) => {
        if (!mounted) return
        setEmail(data.user?.email ?? null)
      })
      void createUsersApi(supabase)
        .getMyProfile()
        .then((profile) => {
          if (!mounted) return
          setProfileFirstName(firstToken(profile?.first_name))
          setProfileLastName(firstToken(profile?.last_name))
          setProfileFullName(profile?.full_name?.trim() ?? "")
        })
        .catch(() => undefined)
    } catch {
      // Missing Supabase env (e.g. isolated guest preview).
    }
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

  const displayName = useMemo(
    () =>
      formatHeaderProfileName({
        firstName: profileFirstName,
        lastName: profileLastName,
        fullName: profileFullName,
        email,
      }),
    [email, profileFirstName, profileFullName, profileLastName],
  )
  const initials = useMemo(() => getInitials(displayName), [displayName])

  return (
    <header className="student-topbar sticky top-0 z-30 w-full shrink-0 border-b border-[color:var(--greyscale-100)] bg-[var(--primary-0)]">
      <div
        className={cn(
          STUDENT_SHELL_GUTTER_CLASS,
          STUDENT_PAGE_CONTAINER_CLASS,
          "student-shell-top-row flex w-full items-center justify-between gap-4",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--greyscale-100)] bg-[var(--primary-25)] text-[color:var(--primary)] lg:hidden"
            aria-label="Open navigation menu"
            onClick={onOpenMobileNav}
          >
            <Menu className="size-5" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {isPremium ? null : headerActions}

          <ThemeToggleButton />

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              className="flex h-[60px] items-center gap-3 overflow-hidden rounded-[20px] px-3 hover:bg-[color:var(--primary-25)]/60"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={openProfileMenu}
              onClick={() => setOpenProfileMenu((current) => !current)}
            >
              <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)] text-[11px] font-semibold leading-none text-white">
                {initials}
              </span>
              <span className="hidden min-w-0 flex-col items-start gap-0 text-left sm:flex">
                <span className="text-xs font-semibold leading-tight tracking-[0.24px] text-[color:var(--primary-800)]">
                  {displayName}
                </span>
                <span className="max-w-[220px] truncate text-xs font-normal leading-tight tracking-[0.24px] text-[color:var(--primary-800)]">
                  {email ?? "student@example.com"}
                </span>
              </span>
              <FigmaIcon
                name="chevron-down"
                className={cn(
                  "hidden size-6 shrink-0 text-[color:var(--primary-800)] sm:block",
                  openProfileMenu && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {openProfileMenu ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-30 flex w-[246px] flex-col items-start rounded-[16px] border border-[color:var(--greyscale-100)] bg-[var(--primary-0)] p-3 shadow-[0px_4px_25px_rgba(0,0,0,0.25)]"
              >
                <Link
                  to="/app/account"
                  role="menuitem"
                  className={PROFILE_MENU_ITEM_CLASS}
                  onClick={() => setOpenProfileMenu(false)}
                >
                  <ProfileMenuIcon src={`${PROFILE_MENU_FIGMA}/shield-key-hole.svg`} />
                  Account
                </Link>
                <Link
                  to={PREP_TEST_POOLS_HREF}
                  role="menuitem"
                  className={PROFILE_MENU_ITEM_CLASS}
                  onClick={() => setOpenProfileMenu(false)}
                >
                  <ProfileMenuIcon src={`${PROFILE_MENU_FIGMA}/gear.svg`} />
                  Settings
                </Link>
                <div className="flex w-full flex-col items-start py-2" aria-hidden>
                  <div className="h-px w-full border-t border-b-2 border-[color:var(--greyscale-50,#eceff3)]" />
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className={PROFILE_MENU_ITEM_CLASS}
                >
                  <ProfileMenuIcon src={`${PROFILE_MENU_FIGMA}/log-out-02.svg`} />
                  Log out
                </button>
              </div>
            ) : null}
          </div>

          <span
            className={cn(
              "inline-flex h-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--primary-25)] px-4 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[color:var(--primary)]",
              !isPremium && "hidden sm:inline-flex",
              isPremium && "w-[97px]",
            )}
            aria-label={`Plan: ${planLabel}`}
          >
            {planLabel}
          </span>

          {isPremium ? headerActions : null}
        </div>
      </div>
    </header>
  )
}

export { formatHeaderProfileName, StudentAppHeader }
