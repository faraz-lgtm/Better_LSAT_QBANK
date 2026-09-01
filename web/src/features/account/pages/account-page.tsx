import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Camera, Check, CreditCard, Calendar, Clock, Globe2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  FIGMA_DROPDOWN_CARD_OPEN_CLASS,
  FigmaDropdown,
  type FigmaDropdownOption,
} from "@/components/ui/figma-dropdown"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Select } from "@/components/ui/select"
import northAmericanTimezones from "@/features/account/data/north-american-timezones.json"
import { ONBOARDING_LSAT_DATE_OPTIONS } from "@/features/auth/onboarding/onboarding-lsat-date-options"
import {
  findLsacTestWindow,
  formatLsacTestWindowLabel,
  resolveLsacTestWindowValue,
} from "@/lib/lsac-test-window-options"
import { useStudentEntitlement } from "@/features/app-shell/student-entitlement-context"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { createBillingApi, type BillingPlanId } from "@/lib/api/billing"
import { createUsersApi, type UserProfile } from "@/lib/api/users"
import { resolveAccountLsacLinkState } from "@/lib/auth/needs-lsac-link"
import {
  useAccommodations,
  type ExtraTimeSetting,
} from "@/features/student/accommodations/accommodations-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const ACCOUNT_TIMEZONE_STORAGE_KEY = "betterlsat.account.timezone"

type AccountTimezone = {
  country: "Canada" | "United States"
  label: string
  value: string
}

type EditableAccountField = "name" | "email" | "phone" | "password" | "lsacDate"

const TIMEZONE_OPTIONS = northAmericanTimezones as AccountTimezone[]

const PAYMENT_PLAN_OPTIONS: FigmaDropdownOption[] = [
  { value: "core", label: "Core plan" },
  { value: "live", label: "Live plan" },
]

function getDisplayName(profile: UserProfile | null, email: string | null): string {
  const joinedName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim()
  if (joinedName) return joinedName
  const profileName = profile?.full_name?.trim()
  if (profileName) return profileName
  const [local] = (email ?? "").split("@")
  const normalized = local?.replace(/[._-]+/g, " ").trim()
  return normalized || "Student"
}

function getNameParts(profile: UserProfile | null, email: string | null): { firstName: string; lastName: string } {
  const firstName = profile?.first_name?.trim() ?? ""
  const lastName = profile?.last_name?.trim() ?? ""
  if (firstName || lastName) return { firstName, lastName }
  const fullName = profile?.full_name?.trim() || getDisplayName(profile, email)
  if (!fullName || fullName === "Student") return { firstName: "", lastName: "" }
  const parts = fullName.split(/\s+/).filter(Boolean)
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") }
}

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "S"
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() || "S"
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "S"
}

function findTimezoneOption(value: string): AccountTimezone {
  return TIMEZONE_OPTIONS.find((option) => option.value === value) ?? TIMEZONE_OPTIONS[0]!
}

function getInitialTimezoneValue(): string {
  const saved = window.localStorage.getItem(ACCOUNT_TIMEZONE_STORAGE_KEY)
  if (saved && TIMEZONE_OPTIONS.some((option) => option.value === saved)) return saved
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (TIMEZONE_OPTIONS.some((option) => option.value === browserTimeZone)) return browserTimeZone
  return TIMEZONE_OPTIONS[0]!.value
}

function getTimezoneOffsetLabel(timeZone: string): string {
  const zoneName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "timeZoneName")?.value
  return zoneName && zoneName !== "GMT" ? zoneName.replace("GMT", "GMT ") : "GMT +0"
}

function formatTimezoneOption(option: AccountTimezone): string {
  return `(${getTimezoneOffsetLabel(option.value)}) ${option.label}`
}

type NameRowProps = {
  displayValue: string
  firstNameDraft: string
  lastNameDraft: string
  editing: boolean
  saving?: boolean
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

function NameRow({
  displayValue,
  firstNameDraft,
  lastNameDraft,
  editing,
  saving = false,
  onFirstNameChange,
  onLastNameChange,
  onEdit,
  onCancel,
  onSave,
}: NameRowProps) {
  return (
    <div className="flex items-center gap-4 border-b border-[rgba(44,49,67,0.07)] px-6 py-[18px]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f1f6] text-[#667085]">
        <UserRound className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-end gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs tracking-[0.24px] text-[#666d80]">Name</p>
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={firstNameDraft}
                placeholder="First name"
                autoComplete="given-name"
                onChange={(event) => onFirstNameChange(event.target.value)}
                className="h-10 rounded-lg border-0 bg-[#f6f8fa] px-2.5 text-sm font-medium tracking-[0.28px] text-[#062357] shadow-none focus-visible:ring-0"
              />
              <Input
                value={lastNameDraft}
                placeholder="Last name"
                autoComplete="family-name"
                onChange={(event) => onLastNameChange(event.target.value)}
                className="h-10 rounded-lg border-0 bg-[#f6f8fa] px-2.5 text-sm font-medium tracking-[0.28px] text-[#062357] shadow-none focus-visible:ring-0"
              />
            </div>
          ) : (
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[#062357]">{displayValue}</p>
          )}
        </div>
        {editing ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="xs" disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="xs" variant="ghost" disabled={saving} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-[30px] rounded-lg border-[rgba(44,49,67,0.12)] px-3 text-xs text-[#666d80]"
            onClick={onEdit}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  )
}

function formatLsacDateDisplay(isoDate: string | null, plannedLsatWindow: string | null): string {
  if (!isoDate?.trim()) return "Not set"
  const window = findLsacTestWindow(isoDate)
  if (window) return `${window.label}: ${window.detail}`
  return formatLsacTestWindowLabel(isoDate, plannedLsatWindow)
}

function resolveLsacDateDraft(isoDate: string | null, plannedLsatWindow: string | null): string {
  const resolved = resolveLsacTestWindowValue(isoDate, plannedLsatWindow)
  if (resolved) return resolved
  return ONBOARDING_LSAT_DATE_OPTIONS[0]?.value || ""
}

type LsatDateRowProps = {
  displayValue: string
  draftValue: string
  editing: boolean
  saving?: boolean
  onDraftChange: (value: string) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

function LsatDateRow({
  displayValue,
  draftValue,
  editing,
  saving = false,
  onDraftChange,
  onEdit,
  onCancel,
  onSave,
}: LsatDateRowProps) {
  return (
    <div className="flex items-center gap-4 border-b border-[rgba(44,49,67,0.07)] px-6 py-[18px]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f1f6] text-[#667085]">
        <Calendar className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-end gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs tracking-[0.24px] text-[#666d80]">LSAC Test Date</p>
          {editing ? (
            <Select
              value={draftValue}
              onChange={(event) => onDraftChange(event.target.value)}
              options={[...ONBOARDING_LSAT_DATE_OPTIONS]}
              placeholder="Select a test date"
              className="h-10 rounded-lg border-0 bg-[#f6f8fa] px-2.5 text-sm font-medium tracking-[0.28px] text-[#062357] shadow-none focus-visible:ring-0"
              disabled={saving}
            />
          ) : (
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[#062357]">{displayValue}</p>
          )}
        </div>
        {editing ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="xs" disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="xs" variant="ghost" disabled={saving} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-[30px] rounded-lg border-[rgba(44,49,67,0.12)] px-3 text-xs text-[#666d80]"
            onClick={onEdit}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  )
}

type ProfileRowProps = {
  icon: typeof UserRound
  label: string
  displayValue: string
  draftValue: string
  editing: boolean
  type?: "email" | "password" | "tel" | "text"
  actionLabel?: string
  placeholder?: string
  saving?: boolean
  editable?: boolean
  onDraftChange: (value: string) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

function ProfileRow({
  icon: Icon,
  label,
  displayValue,
  draftValue,
  editing,
  type = "text",
  actionLabel = "Edit",
  placeholder,
  saving = false,
  editable = true,
  onDraftChange,
  onEdit,
  onCancel,
  onSave,
}: ProfileRowProps) {
  const isEditing = editable && editing
  return (
    <div className="flex items-center gap-4 border-b border-[rgba(44,49,67,0.07)] px-6 py-[18px] last:border-b-0">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f1f6] text-[#667085]">
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-end gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs tracking-[0.24px] text-[#666d80]">{label}</p>
          {isEditing ? (
            <Input
              type={type}
              value={draftValue}
              placeholder={placeholder}
              onChange={(event) => onDraftChange(event.target.value)}
              className="h-10 rounded-lg border-0 bg-[#f6f8fa] px-2.5 text-sm font-medium tracking-[0.28px] text-[#062357] shadow-none focus-visible:ring-0"
            />
          ) : (
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[#062357]">{displayValue}</p>
          )}
        </div>
        {!editable ? null : isEditing ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="xs" disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="xs" variant="ghost" disabled={saving} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-[30px] rounded-lg border-[rgba(44,49,67,0.12)] px-3 text-xs text-[#666d80]"
            onClick={onEdit}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

type PasswordRowProps = {
  currentPasswordDraft: string
  newPasswordDraft: string
  editing: boolean
  saving?: boolean
  onCurrentPasswordChange: (value: string) => void
  onNewPasswordChange: (value: string) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

function PasswordRow({
  currentPasswordDraft,
  newPasswordDraft,
  editing,
  saving = false,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onEdit,
  onCancel,
  onSave,
}: PasswordRowProps) {
  return (
    <div className="flex items-center gap-4 border-b border-[rgba(44,49,67,0.07)] px-6 py-[18px]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f1f6] text-[#667085]">
        <LockKeyhole className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-end gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs tracking-[0.24px] text-[#666d80]">Password</p>
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <PasswordInput
                value={currentPasswordDraft}
                placeholder="Current password"
                autoComplete="current-password"
                onChange={(event) => onCurrentPasswordChange(event.target.value)}
                className="h-10 rounded-lg border-0 bg-[#f6f8fa] px-2.5 text-sm font-medium tracking-[0.28px] text-[#062357] shadow-none focus-visible:ring-0"
              />
              <PasswordInput
                value={newPasswordDraft}
                placeholder="New password"
                autoComplete="new-password"
                onChange={(event) => onNewPasswordChange(event.target.value)}
                className="h-10 rounded-lg border-0 bg-[#f6f8fa] px-2.5 text-sm font-medium tracking-[0.28px] text-[#062357] shadow-none focus-visible:ring-0"
              />
            </div>
          ) : (
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[#062357]">••••••••</p>
          )}
        </div>
        {editing ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="xs" disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="xs" variant="ghost" disabled={saving} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-[30px] rounded-lg border-[rgba(44,49,67,0.12)] px-3 text-xs text-[#666d80]"
            onClick={onEdit}
          >
            Change
          </Button>
        )}
      </div>
    </div>
  )
}

type TimezoneRowProps = {
  value: string
  draftValue: string
  editing: boolean
  onDraftChange: (value: string) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

function TimezoneRow({
  value,
  draftValue,
  editing,
  onDraftChange,
  onEdit,
  onCancel,
  onSave,
}: TimezoneRowProps) {
  const selectedOption = findTimezoneOption(value)

  return (
    <div className="flex items-center gap-4 px-6 py-[18px]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f1f6] text-[#667085]">
        <Globe2 className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-end gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs tracking-[0.24px] text-[#666d80]">Timezone</p>
          {editing ? (
            <select
              value={draftValue}
              onChange={(event) => onDraftChange(event.target.value)}
              className="h-10 w-full rounded-lg border-0 bg-[#f6f8fa] px-2.5 text-sm font-medium tracking-[0.28px] text-[#062357] shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1]/20"
            >
              <optgroup label="Canada">
                {TIMEZONE_OPTIONS.filter((option) => option.country === "Canada").map((option) => (
                  <option key={option.value} value={option.value}>
                    {formatTimezoneOption(option)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="United States">
                {TIMEZONE_OPTIONS.filter((option) => option.country === "United States").map((option) => (
                  <option key={option.value} value={option.value}>
                    {formatTimezoneOption(option)}
                  </option>
                ))}
              </optgroup>
            </select>
          ) : (
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[#062357]">
              {formatTimezoneOption(selectedOption)}
            </p>
          )}
        </div>
        {editing ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="xs" onClick={onSave}>
              Save
            </Button>
            <Button type="button" size="xs" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-[30px] rounded-lg border-[rgba(44,49,67,0.12)] px-3 text-xs text-[#666d80]"
            onClick={onEdit}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  )
}

const EXTRA_TIME_PRESETS: {
  value: ExtraTimeSetting
  label: string
  detail: string
  minutesLabel: string | null
}[] = [
  { value: "none", label: "Standard", detail: "Official LSAT timing", minutesLabel: "35 min" },
  { value: "1.5x", label: "Time and a half", detail: "50% more time per section", minutesLabel: "53 min" },
  { value: "2x", label: "Double time", detail: "Twice the standard time", minutesLabel: "70 min" },
  { value: "custom", label: "Custom", detail: "Set your own section length", minutesLabel: null },
]

type AccommodationsRowProps = {
  setting: ExtraTimeSetting
  customMinutes: number | null
  editing: boolean
  saving?: boolean
  draftSetting: ExtraTimeSetting
  draftCustomMinutes: string
  onDraftSettingChange: (value: ExtraTimeSetting) => void
  onDraftCustomMinutesChange: (value: string) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

function formatAccommodationsDisplay(setting: ExtraTimeSetting, customMinutes: number | null): string {
  switch (setting) {
    case "1.5x":
      return "Time and a half (53 min)"
    case "2x":
      return "Double time (70 min)"
    case "custom":
      return customMinutes != null ? `Custom (${customMinutes} min)` : "Custom"
    default:
      return "Standard (35 min)"
  }
}

function AccommodationsRow({
  setting,
  customMinutes,
  editing,
  saving = false,
  draftSetting,
  draftCustomMinutes,
  onDraftSettingChange,
  onDraftCustomMinutesChange,
  onEdit,
  onCancel,
  onSave,
}: AccommodationsRowProps) {
  if (!editing) {
    return (
      <div className="flex items-center gap-4 px-6 py-[18px]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f1f6] text-[#667085]">
          <Clock className="size-3.5" strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-1 items-end gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs tracking-[0.24px] text-[#666d80]">Extra Time</p>
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[#062357]">
              {formatAccommodationsDisplay(setting, customMinutes)}
            </p>
          </div>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-[30px] shrink-0 rounded-lg border-[rgba(44,49,67,0.12)] px-3 text-xs text-[#666d80]"
            onClick={onEdit}
          >
            Edit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f1f6] text-[#667085]">
              <Clock className="size-3.5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[0.28px] text-[#062357]">Extra Time</p>
              <p className="text-xs tracking-[0.24px] text-[#666d80]">
                Applies to PrepTests, sections, and timed drills
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" size="xs" disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button type="button" size="xs" variant="ghost" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {EXTRA_TIME_PRESETS.map((preset) => {
          const selected = draftSetting === preset.value
          return (
            <label
              key={preset.value}
              className={cn(
                "relative flex cursor-pointer flex-col gap-3 rounded-[10px] border p-3.5 transition-colors",
                selected
                  ? "border-[#0d47a1] bg-[#edf3ff] shadow-[0px_1px_2px_0px_rgba(13,71,161,0.12)]"
                  : "border-[rgba(44,49,67,0.08)] bg-white hover:border-[rgba(13,71,161,0.28)] hover:bg-[#f8fafc]",
                saving && "pointer-events-none opacity-60",
              )}
            >
              <input
                type="radio"
                name="extra-time-setting"
                value={preset.value}
                checked={selected}
                disabled={saving}
                onChange={() => onDraftSettingChange(preset.value)}
                className="sr-only"
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold tracking-[0.28px] text-[#062357]">{preset.label}</p>
                  <p className="text-xs tracking-[0.24px] text-[#666d80]">{preset.detail}</p>
                </div>
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-[#0d47a1] bg-[#0d47a1]" : "border-[#c5cad3] bg-white",
                  )}
                  aria-hidden
                >
                  {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
                </span>
              </div>
              {preset.minutesLabel ? (
                <span
                  className={cn(
                    "inline-flex w-fit rounded-md px-2 py-1 text-xs font-semibold tracking-[0.24px]",
                    selected ? "bg-white text-[#0d47a1]" : "bg-[#f0f1f6] text-[#666d80]",
                  )}
                >
                  {preset.minutesLabel}
                </span>
              ) : null}
              {preset.value === "custom" && selected ? (
                <div className="flex items-center gap-2 border-t border-[rgba(13,71,161,0.12)] pt-3">
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={draftCustomMinutes}
                    placeholder="e.g. 45"
                    disabled={saving}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onDraftCustomMinutesChange(e.target.value)}
                    className="h-9 w-[88px] rounded-lg border border-[rgba(44,49,67,0.12)] bg-white px-2.5 text-sm font-medium tracking-[0.28px] text-[#062357] shadow-none focus-visible:ring-1 focus-visible:ring-[#0d47a1]/30"
                  />
                  <span className="text-xs tracking-[0.24px] text-[#666d80]">minutes / section</span>
                </div>
              ) : null}
            </label>
          )
        })}
      </div>
    </div>
  )
}

function AccountSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof UserRound
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[rgba(44,49,67,0.07)] bg-white">
      <div className="flex items-center gap-2 border-b border-[rgba(44,49,67,0.07)] px-6 py-4">
        <Icon className="size-[15px] text-[#667085]" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold tracking-[0.28px] text-[#062357]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function PlanBanner({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-4 overflow-hidden rounded-xl p-4 shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(13,71,161,0.20)_100%),linear-gradient(90deg,#edf3ff_0%,#edf3ff_100%)]",
        className,
      )}
    >
      {children}
    </aside>
  )
}

function CheckListItem({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <li className={cn("flex items-center gap-2 text-xs tracking-[0.24px]", muted ? "text-[#666d80]" : "text-[#062357]")}>
      <Check className="size-[13px] shrink-0 text-[#0d47a1]" strokeWidth={2} />
      <span>{children}</span>
    </li>
  )
}

function AccountPage() {
  const navigate = useNavigate()
  const { openPricingModal } = useGuestPricingModal()
  const { entitlement, loading: entitlementLoading } = useStudentEntitlement()
  const {
    extraTimeSetting,
    extraTimeCustomMinutes,
    updateAccommodations,
  } = useAccommodations()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [lsacDate, setLsacDate] = useState<string | null>(null)
  const [lsacWindow, setLsacWindow] = useState<string | null>(null)
  const [nameValue, setNameValue] = useState("")
  const [editingField, setEditingField] = useState<EditableAccountField | null>(null)
  const [fieldDraft, setFieldDraft] = useState("")
  const [firstNameDraft, setFirstNameDraft] = useState("")
  const [lastNameDraft, setLastNameDraft] = useState("")
  const [currentPasswordDraft, setCurrentPasswordDraft] = useState("")
  const [newPasswordDraft, setNewPasswordDraft] = useState("")
  const [savingField, setSavingField] = useState<EditableAccountField | null>(null)
  const [accountStatus, setAccountStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timezoneValue, setTimezoneValue] = useState(getInitialTimezoneValue)
  const [timezoneDraft, setTimezoneDraft] = useState(timezoneValue)
  const [editingTimezone, setEditingTimezone] = useState(false)
  const [editingAccommodations, setEditingAccommodations] = useState(false)
  const [accommodationDraftSetting, setAccommodationDraftSetting] = useState<ExtraTimeSetting>("none")
  const [accommodationDraftCustomMinutes, setAccommodationDraftCustomMinutes] = useState("")
  const [savingAccommodations, setSavingAccommodations] = useState(false)
  const [addingPayment, setAddingPayment] = useState(false)
  const [paymentPlan, setPaymentPlan] = useState<BillingPlanId>("core")
  const [paymentPlanMenuOpen, setPaymentPlanMenuOpen] = useState(false)
  const [startingPayment, setStartingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function loadAccount() {
      try {
        const supabase = getSupabaseBrowserClient()
        const usersApi = createUsersApi(supabase)
        const [{ data: userData }, nextProfile, studyContext] = await Promise.all([
          supabase.auth.getUser(),
          usersApi.getMyProfile(),
          usersApi.getStudyContext(),
        ])
        if (!alive) return
        const nextEmail = nextProfile?.email ?? userData.user?.email ?? null
        const nextPhone = nextProfile?.phone ?? userData.user?.phone ?? null
        setProfile(nextProfile)
        setEmail(nextEmail)
        setPhone(nextPhone)
        setLsacDate(studyContext.preferences?.plannedLsatDate ?? null)
        setLsacWindow(studyContext.preferences?.plannedLsatWindow ?? null)
        setNameValue(getDisplayName(nextProfile, nextEmail))
        setError(null)
      } catch (loadError) {
        if (!alive) return
        setError(loadError instanceof Error ? loadError.message : "Failed to load account")
      } finally {
        if (alive) setLoading(false)
      }
    }
    void loadAccount()
    return () => {
      alive = false
    }
  }, [])

  const displayName = useMemo(() => nameValue || getDisplayName(profile, email), [email, nameValue, profile])
  const initials = useMemo(() => getInitials(displayName), [displayName])
  const hasProPlan = Boolean(entitlement?.hasActiveCore || entitlement?.accessState === "FULL_ACCESS")
  const planName = hasProPlan ? "Pro" : "Free"
  const lsacLinkState = useMemo(
    () => resolveAccountLsacLinkState(profile, entitlement),
    [entitlement, profile],
  )

  function startFieldEdit(field: EditableAccountField) {
    setAccountStatus(null)
    setEditingField(field)
    if (field === "name") {
      const parts = getNameParts(profile, email)
      setFirstNameDraft(parts.firstName)
      setLastNameDraft(parts.lastName)
    }
    if (field === "email") setFieldDraft(email ?? "")
    if (field === "phone") setFieldDraft(phone ?? "")
    if (field === "lsacDate") setFieldDraft(resolveLsacDateDraft(lsacDate, lsacWindow))
    if (field === "password") {
      setCurrentPasswordDraft("")
      setNewPasswordDraft("")
    }
  }

  function cancelFieldEdit() {
    setEditingField(null)
    setFieldDraft("")
    setFirstNameDraft("")
    setLastNameDraft("")
    setCurrentPasswordDraft("")
    setNewPasswordDraft("")
  }

  async function saveFieldEdit(field: EditableAccountField) {
    if (field === "name") {
      if (!firstNameDraft.trim() || !lastNameDraft.trim()) {
        setError("First and last name are required.")
        return
      }
    } else if (field === "password") {
      if (!currentPasswordDraft.trim() || !newPasswordDraft.trim()) {
        setError("Current and new password are required.")
        return
      }
    } else if (field === "lsacDate") {
      if (!fieldDraft.trim()) {
        setError("LSAC test date is required.")
        return
      }
    } else {
      const value = fieldDraft.trim()
      if (!value) {
        setError(`${field} is required.`)
        return
      }
    }

    setSavingField(field)
    setError(null)
    setAccountStatus(null)
    try {
      const usersApi = createUsersApi(getSupabaseBrowserClient())
      if (field === "name") {
        const nextProfile = await usersApi.updateAccountProfile({
          firstName: firstNameDraft.trim(),
          lastName: lastNameDraft.trim(),
        })
        setProfile(nextProfile)
        setNameValue(getDisplayName(nextProfile, email))
        setAccountStatus("Name updated.")
      } else if (field === "email") {
        const nextProfile = await usersApi.updateAccountEmail(fieldDraft.trim())
        if (nextProfile) setProfile(nextProfile)
        setEmail(fieldDraft.trim())
        setAccountStatus("Email update saved. You may need to confirm the new email address.")
      } else if (field === "phone") {
        const nextProfile = await usersApi.updateAccountPhone(fieldDraft.trim())
        setProfile(nextProfile)
        setPhone(nextProfile.phone)
        setAccountStatus("Phone updated.")
      } else if (field === "lsacDate") {
        const selected = fieldDraft.trim()
        const nextPreferences = await usersApi.updateStudyPreferences({
          plannedLsatDate: selected,
          plannedLsatWindow: null,
        })
        setLsacDate(nextPreferences.plannedLsatDate)
        setLsacWindow(nextPreferences.plannedLsatWindow)
        setAccountStatus("LSAC test date updated.")
      } else {
        await usersApi.updateAccountPassword({
          currentPassword: currentPasswordDraft,
          newPassword: newPasswordDraft,
        })
        setAccountStatus("Password updated.")
      }
      cancelFieldEdit()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update account")
    } finally {
      setSavingField(null)
    }
  }

  function startTimezoneEdit() {
    setTimezoneDraft(timezoneValue)
    setEditingTimezone(true)
  }

  function cancelTimezoneEdit() {
    setTimezoneDraft(timezoneValue)
    setEditingTimezone(false)
  }

  function saveTimezoneEdit() {
    setTimezoneValue(timezoneDraft)
    window.localStorage.setItem(ACCOUNT_TIMEZONE_STORAGE_KEY, timezoneDraft)
    setEditingTimezone(false)
  }

  function startAccommodationsEdit() {
    setAccommodationDraftSetting(extraTimeSetting)
    setAccommodationDraftCustomMinutes(extraTimeCustomMinutes != null ? String(extraTimeCustomMinutes) : "")
    setEditingAccommodations(true)
  }

  function cancelAccommodationsEdit() {
    setEditingAccommodations(false)
  }

  async function saveAccommodationsEdit() {
    const setting = accommodationDraftSetting
    let customMinutes: number | null = null
    if (setting === "custom") {
      const parsed = parseInt(accommodationDraftCustomMinutes.trim(), 10)
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 999) {
        setError("Custom minutes must be a number between 1 and 999.")
        return
      }
      customMinutes = parsed
    }
    setSavingAccommodations(true)
    setError(null)
    try {
      await updateAccommodations(setting, customMinutes)
      setAccountStatus("Accommodations updated.")
      setEditingAccommodations(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update accommodations.")
    } finally {
      setSavingAccommodations(false)
    }
  }

  async function startPaymentCheckout() {
    setStartingPayment(true)
    setPaymentError(null)
    try {
      const billingApi = createBillingApi(getSupabaseBrowserClient())
      const url = await billingApi.createCheckoutSession(paymentPlan, {
        includeLawHub: true,
        successPath: "/app/account?payment=success",
      })
      window.location.assign(url)
    } catch (checkoutError) {
      setPaymentError(checkoutError instanceof Error ? checkoutError.message : "Unable to start secure checkout.")
      setStartingPayment(false)
    }
  }

  if (loading || entitlementLoading) {
    return (
      <StudentMain fullBleed contentClassName="px-6">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading account…" />
      </StudentMain>
    )
  }

  return (
    <StudentMain fullBleed contentClassName="px-6">
      <div className="mx-auto w-full max-w-[1304px] rounded-3xl border border-[#dfe1e7] bg-white p-6">
        <h1 className="m-0 text-2xl font-bold leading-[1.3] text-[#062357]">Account</h1>

        {error ? <p className="mt-4 text-sm text-[#95122b]">{error}</p> : null}
        {accountStatus ? <p className="mt-4 text-sm font-medium text-[#0d47a1]">{accountStatus}</p> : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-6">
            <AccountSection title="Profile" icon={UserRound}>
              <div className="flex items-center gap-4 border-b border-[rgba(44,49,67,0.07)] p-6">
                <div className="relative shrink-0">
                  <div className="flex size-16 items-center justify-center rounded-full bg-[#062357] text-xl font-extrabold tracking-[-0.45px] text-[#f0f4ff]">
                    {initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-[#f4f5f9] bg-[#062357] text-white">
                    <Camera className="size-3" strokeWidth={1.75} />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold tracking-[0.32px] text-[#062357]">{displayName}</p>
                  <p className="truncate text-xs tracking-[0.24px] text-[#666d80]">{email ?? "No email on file"}</p>
                </div>
              </div>
              <NameRow
                displayValue={displayName}
                firstNameDraft={firstNameDraft}
                lastNameDraft={lastNameDraft}
                editing={editingField === "name"}
                saving={savingField === "name"}
                onFirstNameChange={setFirstNameDraft}
                onLastNameChange={setLastNameDraft}
                onEdit={() => startFieldEdit("name")}
                onCancel={cancelFieldEdit}
                onSave={() => void saveFieldEdit("name")}
              />
              <ProfileRow
                icon={Mail}
                label="Email"
                type="email"
                displayValue={email ?? "No email on file"}
                draftValue={fieldDraft}
                editing={editingField === "email"}
                saving={savingField === "email"}
                onDraftChange={setFieldDraft}
                onEdit={() => startFieldEdit("email")}
                onCancel={cancelFieldEdit}
                onSave={() => void saveFieldEdit("email")}
              />
              <ProfileRow
                icon={Phone}
                label="Phone"
                type="tel"
                displayValue={phone ?? "Not added"}
                draftValue={fieldDraft}
                editing={editingField === "phone"}
                saving={savingField === "phone"}
                placeholder="+1 555 123 4567"
                onDraftChange={setFieldDraft}
                onEdit={() => startFieldEdit("phone")}
                onCancel={cancelFieldEdit}
                onSave={() => void saveFieldEdit("phone")}
              />
              <LsatDateRow
                displayValue={formatLsacDateDisplay(lsacDate, lsacWindow)}
                draftValue={fieldDraft}
                editing={editingField === "lsacDate"}
                saving={savingField === "lsacDate"}
                onDraftChange={setFieldDraft}
                onEdit={() => startFieldEdit("lsacDate")}
                onCancel={cancelFieldEdit}
                onSave={() => void saveFieldEdit("lsacDate")}
              />
              <PasswordRow
                currentPasswordDraft={currentPasswordDraft}
                newPasswordDraft={newPasswordDraft}
                editing={editingField === "password"}
                saving={savingField === "password"}
                onCurrentPasswordChange={setCurrentPasswordDraft}
                onNewPasswordChange={setNewPasswordDraft}
                onEdit={() => startFieldEdit("password")}
                onCancel={cancelFieldEdit}
                onSave={() => void saveFieldEdit("password")}
              />
              <TimezoneRow
                value={timezoneValue}
                draftValue={timezoneDraft}
                editing={editingTimezone}
                onDraftChange={setTimezoneDraft}
                onEdit={startTimezoneEdit}
                onCancel={cancelTimezoneEdit}
                onSave={saveTimezoneEdit}
              />
            </AccountSection>

            <AccountSection title="Accommodations" icon={Clock}>
              <AccommodationsRow
                setting={extraTimeSetting}
                customMinutes={extraTimeCustomMinutes}
                editing={editingAccommodations}
                saving={savingAccommodations}
                draftSetting={accommodationDraftSetting}
                draftCustomMinutes={accommodationDraftCustomMinutes}
                onDraftSettingChange={setAccommodationDraftSetting}
                onDraftCustomMinutesChange={setAccommodationDraftCustomMinutes}
                onEdit={startAccommodationsEdit}
                onCancel={cancelAccommodationsEdit}
                onSave={() => void saveAccommodationsEdit()}
              />
            </AccountSection>

            <section className="rounded-[10px] border border-[rgba(44,49,67,0.07)] bg-white px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-sm font-semibold tracking-[0.28px] text-[#062357]">LSAC Account</h2>
                  <p className="text-xs tracking-[0.24px] text-[#666d80]">
                    LawHub Advantage · <span className="text-[#0d47a1]">Not required for basic access</span>
                  </p>
                  <p className="text-xs tracking-[0.24px] text-[#666d80]">
                    {lsacLinkState === "linked"
                      ? "Your LSAC account is linked. PrepTest scores and LawHub content stay in sync."
                      : lsacLinkState === "pending"
                        ? "LawHub invite is pending. Finish linking in your LSAC email, then return to the dashboard."
                        : "Link your LSAC account to sync your PrepTest scores and unlock additional features."}
                  </p>
                </div>
                {lsacLinkState === "linked" ? (
                  <span className="inline-flex h-[35px] shrink-0 items-center gap-1.5 rounded-lg bg-[#ecfdf3] px-3 text-xs font-semibold tracking-[0.24px] text-[#067647]">
                    <Check className="size-3.5" strokeWidth={2.25} />
                    Linked
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="xs"
                    className="h-[35px] rounded-lg px-4"
                    onClick={() => navigate(lsacLinkState === "pending" ? "/app" : "/app/lsac-link")}
                  >
                    {lsacLinkState === "pending" ? "Finish setup" : "Link Account"}
                  </Button>
                )}
              </div>
            </section>

            <AccountSection title="Payment Methods" icon={CreditCard}>
              <div className="p-6">
                <div className="flex min-h-[142px] flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[rgba(44,49,67,0.12)] p-6 text-center">
                  <CreditCard className="size-7 text-[#a4acb9]" strokeWidth={1.75} />
                  <p className="mt-2 text-sm font-semibold tracking-[0.28px] text-[#062357]">No payment method</p>
                  <p className="mt-1 text-xs tracking-[0.24px] text-[#666d80]">
                    Add a card securely through Stripe Checkout.
                  </p>

                  {addingPayment ? (
                    <div
                      className={cn(
                        "mt-4 w-full max-w-[460px] rounded-xl bg-[#f6f8fa] p-4 text-left",
                        paymentPlanMenuOpen && FIGMA_DROPDOWN_CARD_OPEN_CLASS,
                      )}
                    >
                      <label
                        className="block text-xs font-semibold tracking-[0.24px] text-[#062357]"
                        htmlFor="payment-plan"
                      >
                        Choose plan before entering card details
                      </label>
                      <FigmaDropdown
                        id="payment-plan"
                        className="mt-2"
                        value={paymentPlan}
                        options={PAYMENT_PLAN_OPTIONS}
                        placeholder="Select a plan"
                        disabled={startingPayment}
                        onOpenChange={setPaymentPlanMenuOpen}
                        onChange={(value) => setPaymentPlan(value as BillingPlanId)}
                      />
                      <p className="mt-2 text-xs leading-5 tracking-[0.24px] text-[#666d80]">
                        Card number, expiry, CVC, and billing details are collected on Stripe's secure checkout page.
                      </p>
                      {paymentError ? <p className="mt-2 text-xs text-[#95122b]">{paymentError}</p> : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-[35px] rounded-lg px-4"
                          disabled={startingPayment}
                          onClick={() => void startPaymentCheckout()}
                        >
                          {startingPayment ? "Opening…" : "Enter Card Details"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={startingPayment}
                          onClick={() => {
                            setAddingPayment(false)
                            setPaymentPlanMenuOpen(false)
                            setPaymentError(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="mt-4 h-[35px] rounded-lg px-4"
                      onClick={() => setAddingPayment(true)}
                    >
                      Add Payment Method
                    </Button>
                  )}
                </div>
              </div>
            </AccountSection>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <PlanBanner>
              <p className="text-xs font-semibold tracking-[0.24px] text-[#0d47a1]">Current Plan</p>
              <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">{planName}</h2>
              <ul className="flex flex-col gap-2">
                <CheckListItem muted>{hasProPlan ? "Unlimited questions & drills" : "50 questions/day"}</CheckListItem>
                <CheckListItem muted>{hasProPlan ? "Advanced analytics" : "Basic analytics"}</CheckListItem>
                <CheckListItem muted>{hasProPlan ? "Full PrepTest library" : "3 practice tests"}</CheckListItem>
                <CheckListItem muted>{hasProPlan ? "All lessons" : "Limited lessons"}</CheckListItem>
              </ul>
              {!hasProPlan ? (
                <>
                  <p className="text-xs font-medium tracking-[0.24px] text-[#666d80]">
                    <strong>79%</strong> Performance, <strong>30+</strong> Reports, and Score Tracker will be available.
                  </p>
                  <Button type="button" size="xs" className="h-8 w-full rounded-[10px]" onClick={openPricingModal}>
                    Upgrade
                  </Button>
                </>
              ) : null}
            </PlanBanner>

            <PlanBanner>
              <p className="text-xs font-semibold tracking-[0.24px] text-[#0d47a1]">Pro includes everything, plus:</p>
              <ul className="flex flex-col gap-2">
                <CheckListItem>Unlimited questions &amp; drills</CheckListItem>
                <CheckListItem>Full PrepTest library (90+)</CheckListItem>
                <CheckListItem>Advanced analytics &amp; weak areas</CheckListItem>
                <CheckListItem>All lesson videos</CheckListItem>
                <CheckListItem>Priority support</CheckListItem>
              </ul>
            </PlanBanner>
          </div>
        </div>
      </div>
    </StudentMain>
  )
}

export { AccountPage }
