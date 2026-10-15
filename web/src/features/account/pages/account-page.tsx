import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Camera, Check, CreditCard, Calendar, ExternalLink, FileText, Globe2, ImagePlus, LockKeyhole, Mail, Phone, Trash2, UserRound } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FIGMA_DROPDOWN_CARD_OPEN_CLASS,
  FigmaDropdown,
  type FigmaDropdownOption,
} from "@/components/ui/figma-dropdown"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Select } from "@/components/ui/select"
import northAmericanTimezones from "@/features/account/data/north-american-timezones.json"
import {
  formatCardExpiry,
  formatInvoiceAmount,
  formatInvoiceMeta,
  formatMaskedCardNumber,
  invoiceStatusLabel,
} from "@/features/account/format-billing-display"
import { ONBOARDING_LSAT_DATE_OPTIONS } from "@/features/auth/onboarding/onboarding-lsat-date-options"
import {
  findLsacTestWindow,
  formatLsacTestWindowLabel,
  resolveLsacTestWindowValue,
} from "@/lib/lsac-test-window-options"
import { usePollEntitlementAfterCheckoutSuccess } from "@/features/app-shell/poll-entitlement-after-checkout"
import { useStudentEntitlement } from "@/features/app-shell/student-entitlement-context"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import {
  FREE_PRICING_PLAN,
  getPricingPlanById,
  isPaidPricingPlan,
  resolveCurrentPricingPlan,
} from "@/features/guest/pricing/guest-pricing-plans-data"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { useTrackCheckoutPurchase } from "@/lib/analytics/track-checkout-purchase"
import {
  createBillingApi,
  type BillingInvoice,
  type BillingPaymentMethod,
  type BillingStatus,
  type CheckoutPlanId,
} from "@/lib/api/billing"
import {
  attachStreamToVideo,
  capturePhotoFromVideo,
  openDeviceCamera,
  stopMediaStream,
} from "@/lib/account/device-camera"
import {
  validateAccountNameParts,
  validateAccountPhone,
} from "@/lib/account/profile-field-validation"
import { createUsersApi, type UserProfile } from "@/lib/api/users"
import { resolveAccountLsacLinkState } from "@/lib/auth/needs-lsac-link"
import { notifyProfileAvatarChanged } from "@/lib/profile-avatar-sync"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const ACCOUNT_EDIT_BTN_CLASS =
  "h-[30px] rounded-lg border border-[rgba(44,49,67,0.12)] !bg-transparent px-3 text-xs font-medium tracking-[0.24px] text-[var(--greyscale-500)] !shadow-none hover:!border-[var(--primary)] hover:!bg-[var(--primary)] hover:!text-white"

const ACCOUNT_CANCEL_BTN_CLASS =
  "h-[30px] rounded-lg !bg-[var(--greyscale-25)] px-3 text-xs font-medium tracking-[0.24px] text-[var(--greyscale-500)] hover:!bg-[var(--greyscale-50)] hover:!text-[var(--color-student-heading)]"

const ACCOUNT_TIMEZONE_STORAGE_KEY = "betterlsat.account.timezone"

type AccountTimezone = {
  country: "Canada" | "United States"
  label: string
  value: string
}

type EditableAccountField = "name" | "email" | "phone" | "password" | "lsacDate"

const TIMEZONE_OPTIONS = northAmericanTimezones as AccountTimezone[]

const PAYMENT_PLAN_OPTIONS: FigmaDropdownOption[] = [
  { value: "monthly", label: "Monthly — $69/mo" },
  { value: "three_month", label: "Quarterly — $192" },
  { value: "six_month", label: "Semiannual — $354" },
  { value: "yearly", label: "Yearly — $624" },
]

const PLAN_LABELS: Record<CheckoutPlanId, string> = {
  monthly: getPricingPlanById("monthly").name,
  three_month: getPricingPlanById("three_month").name,
  six_month: getPricingPlanById("six_month").name,
  yearly: getPricingPlanById("yearly").name,
}

const FULL_ACCESS_PLAN = getPricingPlanById("monthly")

function formatPlanChangeDate(value: string | null | undefined): string {
  if (!value) return "your next renewal"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "your next renewal"
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

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
  error?: string | null
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
  error = null,
  onFirstNameChange,
  onLastNameChange,
  onEdit,
  onCancel,
  onSave,
}: NameRowProps) {
  return (
    <div className="flex items-start gap-4 border-b border-[rgba(44,49,67,0.07)] px-4 py-[18px]">
      <span className="mt-5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--greyscale-50)] text-[var(--muted-foreground)]">
        <UserRound className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">Name</p>
          {editing ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={firstNameDraft}
                  placeholder="First name"
                  autoComplete="given-name"
                  aria-invalid={Boolean(error)}
                  onChange={(event) => onFirstNameChange(event.target.value)}
                  className="h-10 rounded-lg border-0 bg-[var(--greyscale-25)] px-2.5 text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)] shadow-none focus-visible:ring-0"
                />
                <Input
                  value={lastNameDraft}
                  placeholder="Last name"
                  autoComplete="family-name"
                  aria-invalid={Boolean(error)}
                  onChange={(event) => onLastNameChange(event.target.value)}
                  className="h-10 rounded-lg border-0 bg-[var(--greyscale-25)] px-2.5 text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)] shadow-none focus-visible:ring-0"
                />
              </div>
              {error ? <p className="text-sm text-[#95122b]">{error}</p> : null}
            </>
          ) : (
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)]">{displayValue}</p>
          )}
        </div>
        {editing ? (
          <div className="mt-5 flex shrink-0 items-center gap-2">
            <Button type="button" size="xs" disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="xs" variant="ghost" disabled={saving} className={ACCOUNT_CANCEL_BTN_CLASS} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className={`mt-5 ${ACCOUNT_EDIT_BTN_CLASS}`}
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
  error?: string | null
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
  error = null,
  onDraftChange,
  onEdit,
  onCancel,
  onSave,
}: LsatDateRowProps) {
  return (
    <div className="flex items-start gap-4 border-b border-[rgba(44,49,67,0.07)] px-4 py-[18px]">
      <span className="mt-5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--greyscale-50)] text-[var(--muted-foreground)]">
        <Calendar className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">LSAC Test Date</p>
          {editing ? (
            <>
              <Select
                value={draftValue}
                onChange={(event) => onDraftChange(event.target.value)}
                options={[...ONBOARDING_LSAT_DATE_OPTIONS]}
                placeholder="Select a test date"
                className="h-10 rounded-lg border-0 bg-[var(--greyscale-25)] px-2.5 text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)] shadow-none focus-visible:ring-0"
                disabled={saving}
              />
              {error ? <p className="text-sm text-[#95122b]">{error}</p> : null}
            </>
          ) : (
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)]">{displayValue}</p>
          )}
        </div>
        {editing ? (
          <div className="mt-5 flex shrink-0 items-center gap-2">
            <Button type="button" size="xs" disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="xs" variant="ghost" disabled={saving} className={ACCOUNT_CANCEL_BTN_CLASS} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className={`mt-5 ${ACCOUNT_EDIT_BTN_CLASS}`}
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
  error?: string | null
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
  error = null,
  onDraftChange,
  onEdit,
  onCancel,
  onSave,
}: ProfileRowProps) {
  const isEditing = editable && editing
  return (
    <div className="flex items-start gap-4 border-b border-[rgba(44,49,67,0.07)] px-4 py-[18px] last:border-b-0">
      <span className="mt-5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--greyscale-50)] text-[var(--muted-foreground)]">
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{label}</p>
          {isEditing ? (
            <>
              <Input
                type={type}
                value={draftValue}
                placeholder={placeholder}
                aria-invalid={Boolean(error)}
                onChange={(event) => onDraftChange(event.target.value)}
                className="h-10 rounded-lg border-0 bg-[var(--greyscale-25)] px-2.5 text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)] shadow-none focus-visible:ring-0"
              />
              {error ? <p className="text-sm text-[#95122b]">{error}</p> : null}
            </>
          ) : (
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)]">{displayValue}</p>
          )}
        </div>
        {!editable ? null : isEditing ? (
          <div className="mt-5 flex shrink-0 items-center gap-2">
            <Button type="button" size="xs" disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="xs" variant="ghost" disabled={saving} className={ACCOUNT_CANCEL_BTN_CLASS} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className={`mt-5 ${ACCOUNT_EDIT_BTN_CLASS}`}
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
  error?: string | null
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
  error = null,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onEdit,
  onCancel,
  onSave,
}: PasswordRowProps) {
  return (
    <div className="flex items-start gap-4 border-b border-[rgba(44,49,67,0.07)] px-4 py-[18px]">
      <span className="mt-5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--greyscale-50)] text-[var(--muted-foreground)]">
        <LockKeyhole className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">Password</p>
          {editing ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <PasswordInput
                  value={currentPasswordDraft}
                  placeholder="Current password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(error)}
                  onChange={(event) => onCurrentPasswordChange(event.target.value)}
                  className="h-10 rounded-lg border-0 bg-[var(--greyscale-25)] px-2.5 text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)] shadow-none focus-visible:ring-0"
                />
                <PasswordInput
                  value={newPasswordDraft}
                  placeholder="New password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(error)}
                  onChange={(event) => onNewPasswordChange(event.target.value)}
                  className="h-10 rounded-lg border-0 bg-[var(--greyscale-25)] px-2.5 text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)] shadow-none focus-visible:ring-0"
                />
              </div>
              {error ? <p className="text-sm text-[#95122b]">{error}</p> : null}
            </>
          ) : (
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)]">••••••••</p>
          )}
        </div>
        {editing ? (
          <div className="mt-5 flex shrink-0 items-center gap-2">
            <Button type="button" size="xs" disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="xs" variant="ghost" disabled={saving} className={ACCOUNT_CANCEL_BTN_CLASS} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className={`mt-5 ${ACCOUNT_EDIT_BTN_CLASS}`}
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
    <div className="flex items-center gap-4 px-4 py-[18px]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--greyscale-50)] text-[var(--muted-foreground)]">
        <Globe2 className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 items-end gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">Timezone</p>
          {editing ? (
            <select
              value={draftValue}
              onChange={(event) => onDraftChange(event.target.value)}
              className="h-10 w-full rounded-lg border-0 bg-[var(--greyscale-25)] px-2.5 text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)] shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20"
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
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)]">
              {formatTimezoneOption(selectedOption)}
            </p>
          )}
        </div>
        {editing ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="xs" onClick={onSave}>
              Save
            </Button>
            <Button type="button" size="xs" variant="ghost" className={ACCOUNT_CANCEL_BTN_CLASS} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className={ACCOUNT_EDIT_BTN_CLASS}
            onClick={onEdit}
          >
            Edit
          </Button>
        )}
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
    <section className="overflow-hidden rounded-[10px] border border-[rgba(44,49,67,0.07)] bg-[var(--greyscale-0)]">
      <div className="flex items-center gap-2 border-b border-[rgba(44,49,67,0.07)] px-4 py-4">
        <Icon className="size-[15px] text-[var(--muted-foreground)]" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold tracking-[0.28px] text-[var(--color-student-heading)]">{title}</h2>
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
        "bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(26,87,184,0.22)_100%),linear-gradient(90deg,var(--primary-0)_0%,var(--primary-0)_100%)]",
        className,
      )}
    >
      {children}
    </aside>
  )
}

function CheckListItem({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 tracking-[0.24px]",
        muted ? "text-xs text-[var(--greyscale-500)]" : "text-sm text-[var(--color-student-heading)]",
      )}
    >
      <Check className="size-[13px] shrink-0 text-[var(--primary)]" strokeWidth={2} />
      <span>{children}</span>
    </li>
  )
}

function PaymentMethodCardRow({
  method,
  onReplace,
  replacing,
}: {
  method: BillingPaymentMethod
  onReplace: () => void
  replacing: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-4 py-3.5">
      <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]">
        <span className="text-[9px] font-black tracking-[-0.03px] text-white">{method.brandLabel}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-[0.28px] text-[var(--color-student-heading)]">
          {formatMaskedCardNumber(method.last4)}
        </p>
        <p className="mt-px text-xs tracking-[0.24px] text-[var(--greyscale-500)]">
          {formatCardExpiry(method.expMonth, method.expYear)} · {method.displayLabel}
        </p>
      </div>
      {method.isDefault ? (
        <span className="rounded-full bg-[var(--explanation-answered-bg)] px-2.5 py-0.5 text-xs font-bold tracking-[0.24px] text-[var(--explanation-answered)]">
          Default
        </span>
      ) : null}
      <button
        type="button"
        className={ACCOUNT_EDIT_BTN_CLASS}
        disabled={replacing}
        onClick={onReplace}
      >
        {replacing ? "Opening…" : "Replace"}
      </button>
    </div>
  )
}

function BillingHistoryRow({ invoice }: { invoice: BillingInvoice }) {
  const pdfUrl = invoice.invoicePdfUrl ?? invoice.hostedInvoiceUrl
  const isPaid = invoice.status === "paid"
  return (
    <div className="flex flex-wrap items-center gap-3.5 border-b border-[rgba(44,49,67,0.06)] px-4 py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-[0.24px] text-[var(--color-student-heading)]">{invoice.title}</p>
        <p className="mt-0.5 text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{formatInvoiceMeta(invoice)}</p>
      </div>
      <p className="text-sm font-semibold tracking-[0.28px] text-[var(--color-student-heading)]">
        {formatInvoiceAmount(invoice.amountPaidCents, invoice.currency)}
      </p>
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-[0.24px]",
          isPaid
            ? "bg-[var(--explanation-answered-bg)] text-[var(--explanation-answered)]"
            : "bg-[var(--greyscale-25)] text-[var(--greyscale-500)]",
        )}
      >
        {invoiceStatusLabel(invoice.status)}
      </span>
      {pdfUrl ? (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-xs font-semibold tracking-[0.24px] text-[var(--primary)] hover:underline"
        >
          <ExternalLink className="size-[11px]" strokeWidth={2.25} />
          PDF
        </a>
      ) : (
        <span className="text-xs tracking-[0.24px] text-[var(--greyscale-300)]">PDF</span>
      )}
    </div>
  )
}

function AccountPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  useTrackCheckoutPurchase()
  const { openPricingModal } = useGuestPricingModal()
  const { entitlement, loading: entitlementLoading, refresh } = useStudentEntitlement()
  usePollEntitlementAfterCheckoutSuccess({ entitlement, refresh })
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
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [timezoneValue, setTimezoneValue] = useState(getInitialTimezoneValue)
  const [timezoneDraft, setTimezoneDraft] = useState(timezoneValue)
  const [editingTimezone, setEditingTimezone] = useState(false)
  const [addingPayment, setAddingPayment] = useState(false)
  const [paymentPlan, setPaymentPlan] = useState<CheckoutPlanId>("monthly")
  const [paymentPlanMenuOpen, setPaymentPlanMenuOpen] = useState(false)
  const [startingPayment, setStartingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<BillingPaymentMethod[]>([])
  const [billingInvoices, setBillingInvoices] = useState<BillingInvoice[]>([])
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
  const [billingDetailsLoading, setBillingDetailsLoading] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [planChangeMenuOpen, setPlanChangeMenuOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<CheckoutPlanId>("monthly")
  const [changingPlan, setChangingPlan] = useState(false)
  const [planChangeError, setPlanChangeError] = useState<string | null>(null)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraStarting, setCameraStarting] = useState(false)
  const [capturingCameraPhoto, setCapturingCameraPhoto] = useState(false)
  const avatarMenuRef = useRef<HTMLDivElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  cameraStreamRef.current = cameraStream

  const setCameraVideoNode = useCallback((node: HTMLVideoElement | null) => {
    cameraVideoRef.current = node
    // Dialog portals mount the <video> after open — attach here so we don't miss it.
    attachStreamToVideo(node, cameraStreamRef.current)
  }, [])

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
  const avatarUrl = profile?.avatar_url?.trim() || null
  const hasProPlan = Boolean(entitlement?.hasActiveCore || entitlement?.accessState === "FULL_ACCESS")

  useEffect(() => {
    if (!avatarMenuOpen) return
    function handlePointerDown(event: MouseEvent) {
      if (!avatarMenuRef.current?.contains(event.target as Node)) {
        setAvatarMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAvatarMenuOpen(false)
    }
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [avatarMenuOpen])

  useEffect(() => {
    if (!cameraDialogOpen) return
    attachStreamToVideo(cameraVideoRef.current, cameraStream)
  }, [cameraDialogOpen, cameraStream])

  useEffect(() => {
    return () => {
      stopMediaStream(cameraStreamRef.current)
    }
  }, [])

  function closeCameraDialog() {
    attachStreamToVideo(cameraVideoRef.current, null)
    stopMediaStream(cameraStreamRef.current)
    cameraStreamRef.current = null
    setCameraStream(null)
    setCameraDialogOpen(false)
    setCameraStarting(false)
    setCapturingCameraPhoto(false)
  }
  const currentPlan = useMemo(
    () =>
      resolveCurrentPricingPlan({
        hasActiveCore: hasProPlan,
        checkoutPlan: billingStatus?.checkoutPlan ?? null,
      }),
    [billingStatus?.checkoutPlan, hasProPlan],
  )
  const planName = currentPlan.name
  const currentPlanFeatures = currentPlan.features
  const lsacLinkState = useMemo(
    () => resolveAccountLsacLinkState(profile, entitlement),
    [entitlement, profile],
  )

  const replacePaymentMethodParam = searchParams.get("replace_pm")?.trim() || null

  useEffect(() => {
    if (!hasProPlan || entitlementLoading) return
    let alive = true
    async function loadBillingDetails() {
      setBillingDetailsLoading(true)
      try {
        const billingApi = createBillingApi(getSupabaseBrowserClient())
        const [status, methods, invoices] = await Promise.all([
          billingApi.getStatus(),
          billingApi.getPaymentMethods(
            replacePaymentMethodParam
              ? { replacePaymentMethodId: replacePaymentMethodParam }
              : undefined,
          ),
          billingApi.getInvoices(),
        ])
        if (!alive) return
        if (replacePaymentMethodParam) {
          const next = new URLSearchParams(searchParams)
          next.delete("replace_pm")
          setSearchParams(next, { replace: true })
        }
        setBillingStatus(status)
        setPaymentMethods(methods)
        setBillingInvoices(invoices)
      } catch {
        if (!alive) return
        setBillingStatus(null)
        setPaymentMethods([])
        setBillingInvoices([])
      } finally {
        if (alive) setBillingDetailsLoading(false)
      }
    }
    void loadBillingDetails()
    return () => {
      alive = false
    }
    // replacePaymentMethodParam: re-run once after portal return so we detach the old card.
  }, [entitlementLoading, hasProPlan, replacePaymentMethodParam, searchParams, setSearchParams])

  async function openBillingPortal(options?: { replacePaymentMethodId?: string }) {
    setOpeningPortal(true)
    setPaymentError(null)
    try {
      const billingApi = createBillingApi(getSupabaseBrowserClient())
      const url = await billingApi.createBillingPortalSession({
        replacePaymentMethodId: options?.replacePaymentMethodId,
      })
      window.location.assign(url)
    } catch (portalError) {
      setPaymentError(portalError instanceof Error ? portalError.message : "Unable to open billing portal.")
      setOpeningPortal(false)
    }
  }

  function openPlanChangeDialog() {
    const currentPlan = billingStatus?.checkoutPlan
    const nextPlan =
      billingStatus?.pendingChange?.plan ??
      PAYMENT_PLAN_OPTIONS.find((option) => option.value !== currentPlan)?.value ??
      "monthly"
    setSelectedPlan(nextPlan as CheckoutPlanId)
    setPlanChangeError(null)
    setPlanDialogOpen(true)
  }

  async function confirmPlanChange() {
    setChangingPlan(true)
    setPlanChangeError(null)
    try {
      const billingApi = createBillingApi(getSupabaseBrowserClient())
      const pendingChange = await billingApi.schedulePlanChange(selectedPlan)
      setBillingStatus((current) => current ? { ...current, pendingChange } : current)
      setAccountStatus(
        `${PLAN_LABELS[selectedPlan]} will start on ${formatPlanChangeDate(pendingChange.effectiveAt)}.`,
      )
      setPlanDialogOpen(false)
    } catch (changeError) {
      setPlanChangeError(changeError instanceof Error ? changeError.message : "Unable to change plan.")
    } finally {
      setChangingPlan(false)
    }
  }

  async function cancelPendingPlanChange() {
    setChangingPlan(true)
    setPlanChangeError(null)
    try {
      const billingApi = createBillingApi(getSupabaseBrowserClient())
      await billingApi.cancelScheduledPlanChange()
      setBillingStatus((current) => current ? { ...current, pendingChange: null } : current)
      setAccountStatus("Scheduled plan change canceled. Your current plan will continue.")
    } catch (changeError) {
      setPlanChangeError(
        changeError instanceof Error ? changeError.message : "Unable to cancel the scheduled change.",
      )
    } finally {
      setChangingPlan(false)
    }
  }

  function startFieldEdit(field: EditableAccountField) {
    setAccountStatus(null)
    setFieldError(null)
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
    setFieldError(null)
    setFieldDraft("")
    setFirstNameDraft("")
    setLastNameDraft("")
    setCurrentPasswordDraft("")
    setNewPasswordDraft("")
  }

  function updateFirstNameDraft(value: string) {
    setFieldError(null)
    setFirstNameDraft(value)
  }

  function updateLastNameDraft(value: string) {
    setFieldError(null)
    setLastNameDraft(value)
  }

  function updateFieldDraft(value: string) {
    setFieldError(null)
    setFieldDraft(value)
  }

  async function saveFieldEdit(field: EditableAccountField) {
    if (field === "name") {
      const nameError = validateAccountNameParts(firstNameDraft, lastNameDraft)
      if (nameError) {
        setFieldError(nameError)
        return
      }
    } else if (field === "phone") {
      const phoneError = validateAccountPhone(fieldDraft)
      if (phoneError) {
        setFieldError(phoneError)
        return
      }
    } else if (field === "password") {
      if (!currentPasswordDraft.trim() || !newPasswordDraft.trim()) {
        setFieldError("Current and new password are required.")
        return
      }
    } else if (field === "lsacDate") {
      if (!fieldDraft.trim()) {
        setFieldError("LSAC test date is required.")
        return
      }
    } else {
      const value = fieldDraft.trim()
      if (!value) {
        setFieldError(`${field} is required.`)
        return
      }
    }

    setSavingField(field)
    setFieldError(null)
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
      setFieldError(saveError instanceof Error ? saveError.message : "Failed to update account")
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

  async function handleAvatarFileSelected(file: File | undefined) {
    if (!file) return
    setAvatarMenuOpen(false)
    setUploadingAvatar(true)
    setError(null)
    setAccountStatus(null)
    try {
      const nextProfile = await createUsersApi(getSupabaseBrowserClient()).uploadAvatar(file)
      setProfile(nextProfile)
      notifyProfileAvatarChanged(nextProfile.avatar_url?.trim() || null)
      setAccountStatus("Profile photo updated.")
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload photo")
    } finally {
      setUploadingAvatar(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ""
    }
  }

  async function handleDeleteAvatar() {
    if (!avatarUrl) {
      setAvatarMenuOpen(false)
      return
    }
    setAvatarMenuOpen(false)
    setUploadingAvatar(true)
    setError(null)
    setAccountStatus(null)
    try {
      const nextProfile = await createUsersApi(getSupabaseBrowserClient()).deleteAvatar()
      setProfile(nextProfile)
      notifyProfileAvatarChanged(null)
      setAccountStatus("Profile photo removed.")
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete photo")
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleTakePhoto() {
    setAvatarMenuOpen(false)
    setError(null)
    setAccountStatus(null)
    setCameraDialogOpen(true)
    setCameraStarting(true)
    try {
      const stream = await openDeviceCamera()
      cameraStreamRef.current = stream
      setCameraStream(stream)
      attachStreamToVideo(cameraVideoRef.current, stream)
    } catch {
      closeCameraDialog()
      const useUpload = window.confirm(
        "No camera available on this device. Upload a photo from your device instead?",
      )
      if (useUpload) galleryInputRef.current?.click()
    } finally {
      setCameraStarting(false)
    }
  }

  async function handleCaptureCameraPhoto() {
    const video = cameraVideoRef.current
    if (!video) return
    setCapturingCameraPhoto(true)
    setError(null)
    try {
      const file = await capturePhotoFromVideo(video)
      closeCameraDialog()
      await handleAvatarFileSelected(file)
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "Failed to capture photo")
      setCapturingCameraPhoto(false)
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
      <StudentMain fullBleed contentClassName="px-4">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading account…" />
      </StudentMain>
    )
  }

  return (
    <StudentMain fullBleed contentClassName="px-4">
      <div className="mx-auto w-full max-w-[1304px] rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-4">
        <h2 className="m-0 text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">Account</h2>

        {error ? <p className="mt-4 text-sm text-[#95122b]">{error}</p> : null}
        {accountStatus ? <p className="mt-4 text-sm font-medium text-[var(--primary)]">{accountStatus}</p> : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-6">
            <AccountSection title="Profile" icon={UserRound}>
              <div className="flex items-center gap-4 border-b border-[rgba(44,49,67,0.07)] px-4 py-5">
                <div ref={avatarMenuRef} className="relative shrink-0">
                  <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)] text-xl font-extrabold tracking-[-0.45px] text-[#f0f4ff]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={`${displayName} profile photo`} className="size-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <button
                    type="button"
                    className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-[var(--greyscale-25)] bg-[var(--primary)] text-white disabled:opacity-60"
                    aria-label={
                      uploadingAvatar
                        ? "Uploading profile photo"
                        : cameraStarting
                          ? "Opening camera"
                          : "Change profile photo"
                    }
                    aria-haspopup="menu"
                    aria-expanded={avatarMenuOpen}
                    disabled={uploadingAvatar || cameraStarting}
                    onClick={() => setAvatarMenuOpen((open) => !open)}
                  >
                    <Camera className="size-3" strokeWidth={1.75} />
                  </button>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={(event) => void handleAvatarFileSelected(event.target.files?.[0])}
                  />
                  {avatarMenuOpen ? (
                    <div
                      role="menu"
                      className="absolute left-0 top-[calc(100%+8px)] z-20 flex min-w-[180px] flex-col rounded-xl border border-[rgba(44,49,67,0.12)] bg-[var(--greyscale-0)] p-1.5 shadow-[0px_8px_24px_rgba(13,13,18,0.12)]"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium tracking-[0.24px] text-[var(--color-student-heading)] hover:bg-[var(--greyscale-25)]"
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        <ImagePlus className="size-3.5 text-[var(--muted-foreground)]" strokeWidth={1.75} />
                        Upload from device
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium tracking-[0.24px] text-[var(--color-student-heading)] hover:bg-[var(--greyscale-25)]"
                        onClick={() => void handleTakePhoto()}
                      >
                        <Camera className="size-3.5 text-[var(--muted-foreground)]" strokeWidth={1.75} />
                        Take photo
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={!avatarUrl || uploadingAvatar}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium tracking-[0.24px] text-[var(--color-student-heading)] hover:bg-[var(--greyscale-25)] disabled:pointer-events-none disabled:opacity-40"
                        onClick={() => void handleDeleteAvatar()}
                      >
                        <Trash2 className="size-3.5 text-[var(--muted-foreground)]" strokeWidth={1.75} />
                        Delete profile pic
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold tracking-[0.32px] text-[var(--color-student-heading)]">{displayName}</p>
                  <p className="truncate text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{email ?? "No email on file"}</p>
                  {uploadingAvatar ? (
                    <p className="mt-1 text-xs tracking-[0.24px] text-[var(--primary)]">Uploading photo…</p>
                  ) : null}
                </div>
              </div>
              <NameRow
                displayValue={displayName}
                firstNameDraft={firstNameDraft}
                lastNameDraft={lastNameDraft}
                editing={editingField === "name"}
                saving={savingField === "name"}
                error={editingField === "name" ? fieldError : null}
                onFirstNameChange={updateFirstNameDraft}
                onLastNameChange={updateLastNameDraft}
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
                error={editingField === "email" ? fieldError : null}
                onDraftChange={updateFieldDraft}
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
                error={editingField === "phone" ? fieldError : null}
                placeholder="+1 555 123 4567"
                onDraftChange={updateFieldDraft}
                onEdit={() => startFieldEdit("phone")}
                onCancel={cancelFieldEdit}
                onSave={() => void saveFieldEdit("phone")}
              />
              <LsatDateRow
                displayValue={formatLsacDateDisplay(lsacDate, lsacWindow)}
                draftValue={fieldDraft}
                editing={editingField === "lsacDate"}
                saving={savingField === "lsacDate"}
                error={editingField === "lsacDate" ? fieldError : null}
                onDraftChange={updateFieldDraft}
                onEdit={() => startFieldEdit("lsacDate")}
                onCancel={cancelFieldEdit}
                onSave={() => void saveFieldEdit("lsacDate")}
              />
              <PasswordRow
                currentPasswordDraft={currentPasswordDraft}
                newPasswordDraft={newPasswordDraft}
                editing={editingField === "password"}
                saving={savingField === "password"}
                error={editingField === "password" ? fieldError : null}
                onCurrentPasswordChange={(value) => {
                  setFieldError(null)
                  setCurrentPasswordDraft(value)
                }}
                onNewPasswordChange={(value) => {
                  setFieldError(null)
                  setNewPasswordDraft(value)
                }}
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

            <section className="rounded-[10px] border border-[rgba(44,49,67,0.07)] bg-[var(--greyscale-0)] px-4 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-sm font-semibold tracking-[0.28px] text-[var(--color-student-heading)]">LSAC Account</h2>
                  <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">
                    LawHub Advantage · <span className="text-[var(--primary)]">Not required for basic access</span>
                  </p>
                  <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">
                    {lsacLinkState === "linked"
                      ? "Your LSAC account is linked. PrepTest scores and LawHub content stay in sync."
                      : lsacLinkState === "pending"
                        ? "LawHub invite is pending. Finish linking in your LSAC email, then return to the dashboard."
                        : "Link your LSAC account to sync your PrepTest scores and unlock additional features."}
                  </p>
                </div>
                {lsacLinkState === "linked" ? (
                  <span className="inline-flex h-[35px] shrink-0 items-center gap-1.5 rounded-lg bg-[var(--explanation-answered-bg)] px-3 text-xs font-semibold tracking-[0.24px] text-[var(--explanation-answered)]">
                    <Check className="size-3.5" strokeWidth={2.25} />
                    Linked
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="xs"
                    className="h-[35px] rounded-lg px-4"
                    onClick={() => navigate("/app/lsac-link-step")}
                  >
                    {lsacLinkState === "pending" ? "Finish setup" : "Link Account"}
                  </Button>
                )}
              </div>
            </section>

            <AccountSection title="Payment Method" icon={CreditCard}>
              <div className="px-4 py-5">
                {hasProPlan && billingDetailsLoading ? (
                  <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">Loading payment method…</p>
                ) : hasProPlan && paymentMethods.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {paymentMethods.map((method) => (
                      <PaymentMethodCardRow
                        key={method.id}
                        method={method}
                        replacing={openingPortal}
                        onReplace={() => void openBillingPortal({ replacePaymentMethodId: method.id })}
                      />
                    ))}
                    {paymentError ? <p className="text-xs text-[#95122b]">{paymentError}</p> : null}
                    <button
                      type="button"
                      className="self-start text-[13px] font-semibold tracking-[-0.08px] text-[var(--primary)] hover:underline disabled:opacity-60"
                      disabled={openingPortal}
                      onClick={() => void openBillingPortal()}
                    >
                      + Add another card
                    </button>
                  </div>
                ) : (
                  <div className="flex min-h-[142px] flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[rgba(44,49,67,0.12)] p-6 text-center">
                    <CreditCard className="size-7 text-[var(--greyscale-300)]" strokeWidth={1.75} />
                    <p className="mt-2 text-sm font-semibold tracking-[0.28px] text-[var(--color-student-heading)]">No payment method</p>
                    <p className="mt-1 text-xs tracking-[0.24px] text-[var(--greyscale-500)]">
                      Add a card securely through Stripe Checkout.
                    </p>

                    {addingPayment ? (
                      <div
                        className={cn(
                          "mt-4 w-full max-w-[460px] rounded-xl bg-[var(--greyscale-25)] p-4 text-left",
                          paymentPlanMenuOpen && FIGMA_DROPDOWN_CARD_OPEN_CLASS,
                        )}
                      >
                        <label
                          className="block text-xs font-semibold tracking-[0.24px] text-[var(--color-student-heading)]"
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
                          onChange={(value) => setPaymentPlan(value as CheckoutPlanId)}
                        />
                        <p className="mt-2 text-xs leading-5 tracking-[0.24px] text-[var(--greyscale-500)]">
                          Card number, expiry, CVC, and billing details are collected on Stripe&apos;s secure checkout page.
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
                )}
              </div>
            </AccountSection>

            {hasProPlan ? (
              <AccountSection title="Billing History" icon={FileText}>
                {billingDetailsLoading ? (
                  <div className="px-4 py-5">
                    <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">Loading billing history…</p>
                  </div>
                ) : billingInvoices.length > 0 ? (
                  <div className="flex flex-col">
                    {billingInvoices.map((invoice) => (
                      <BillingHistoryRow key={invoice.id} invoice={invoice} />
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5">
                    <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">
                      No invoices yet. Paid invoices will appear here after your first billing cycle.
                    </p>
                  </div>
                )}
              </AccountSection>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <PlanBanner>
              <p className="text-xs font-semibold tracking-[0.24px] text-[var(--primary)]">Current Plan</p>
              <h2 className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">{planName}</h2>
              {isPaidPricingPlan(currentPlan) ? (
                <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">
                  {currentPlan.headline}
                  {billingStatus?.subscription?.currentPeriodEnd
                    ? ` · Renews ${formatPlanChangeDate(billingStatus.subscription.currentPeriodEnd)}`
                    : null}
                </p>
              ) : (
                <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{currentPlan.headline}</p>
              )}
              <ul className="flex flex-col gap-2">
                {currentPlanFeatures.map((feature) => (
                  <CheckListItem key={feature} muted>
                    {feature}
                  </CheckListItem>
                ))}
                {isPaidPricingPlan(currentPlan) ? (
                  <CheckListItem muted>{currentPlan.renewalNote}</CheckListItem>
                ) : null}
              </ul>
              {!hasProPlan ? (
                <>
                  <p className="text-xs font-medium tracking-[0.24px] text-[var(--greyscale-500)]">
                    {FREE_PRICING_PLAN.description}
                  </p>
                  <Button type="button" size="xs" className="h-8 w-full rounded-[10px]" onClick={openPricingModal}>
                    Upgrade
                  </Button>
                </>
              ) : billingStatus ? (
                <div className="space-y-3">
                  {billingStatus.pendingChange ? (
                    <div className="rounded-[10px] bg-[var(--primary-25)] p-3">
                      <p className="text-xs font-semibold text-[var(--color-student-heading)]">
                        Changing to {PLAN_LABELS[billingStatus.pendingChange.plan]}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--greyscale-500)]">
                        Starts {formatPlanChangeDate(billingStatus.pendingChange.effectiveAt)}. No charge today.
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-xs font-semibold text-[var(--primary)] hover:underline disabled:opacity-60"
                        disabled={changingPlan}
                        onClick={() => void cancelPendingPlanChange()}
                      >
                        {changingPlan ? "Canceling…" : "Cancel scheduled change"}
                      </button>
                    </div>
                  ) : null}
                  {planChangeError ? <p className="text-xs text-[#95122b]">{planChangeError}</p> : null}
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    className="h-8 w-full rounded-[10px]"
                    disabled={billingDetailsLoading || changingPlan}
                    onClick={openPlanChangeDialog}
                  >
                    {billingStatus.pendingChange ? "Modify Plan Change" : "Change Plan"}
                  </Button>
                </div>
              ) : null}
            </PlanBanner>

            {!hasProPlan ? (
              <PlanBanner>
                <p className="text-xs font-semibold tracking-[0.24px] text-[var(--primary)]">
                  {FULL_ACCESS_PLAN.name} includes:
                </p>
                <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{FULL_ACCESS_PLAN.headline}</p>
                <ul className="flex flex-col gap-2">
                  {FULL_ACCESS_PLAN.features.map((feature) => (
                    <CheckListItem key={feature}>{feature}</CheckListItem>
                  ))}
                </ul>
              </PlanBanner>
            ) : null}
          </div>
        </div>
      </div>

      <DialogRoot
        open={planDialogOpen}
        onOpenChange={(open) => {
          if (!changingPlan) {
            setPlanDialogOpen(open)
            if (!open) setPlanChangeMenuOpen(false)
          }
        }}
      >
        <DialogContent className="overflow-visible">
          <DialogHeader>
            <DialogTitle>Change your plan</DialogTitle>
            <DialogDescription>
              Your current {billingStatus?.checkoutPlan ? PLAN_LABELS[billingStatus.checkoutPlan] : "plan"} remains
              active until {formatPlanChangeDate(billingStatus?.subscription?.currentPeriodEnd)}. You will not be
              charged today.
            </DialogDescription>
          </DialogHeader>
          <div className={cn(planChangeMenuOpen && FIGMA_DROPDOWN_CARD_OPEN_CLASS)}>
            <label
              className="mb-2 block text-xs font-semibold tracking-[0.24px] text-[var(--color-student-heading)]"
              htmlFor="change-plan"
            >
              New plan
            </label>
            <FigmaDropdown
              id="change-plan"
              value={selectedPlan}
              disabled={changingPlan}
              options={PAYMENT_PLAN_OPTIONS.filter((option) => option.value !== billingStatus?.checkoutPlan)}
              placeholder="Select a plan"
              onOpenChange={setPlanChangeMenuOpen}
              onChange={(value) => setSelectedPlan(value as CheckoutPlanId)}
            />
            <p className="mt-3 text-xs leading-5 text-[var(--greyscale-500)]">
              The new billing interval starts at your next renewal. Your LawHub fee will not be charged again.
            </p>
            {planChangeError ? <p className="mt-2 text-xs text-[#95122b]">{planChangeError}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={changingPlan}
              onClick={() => setPlanDialogOpen(false)}
            >
              Keep Current Plan
            </Button>
            <Button
              type="button"
              disabled={changingPlan || selectedPlan === billingStatus?.checkoutPlan}
              onClick={() => void confirmPlanChange()}
            >
              {changingPlan ? "Scheduling…" : "Confirm Plan Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={cameraDialogOpen}
        onOpenChange={(open) => {
          if (!open && !capturingCameraPhoto) closeCameraDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take photo</DialogTitle>
            <DialogDescription>Center your face in the frame, then capture your profile photo.</DialogDescription>
          </DialogHeader>
          <div className="relative overflow-hidden rounded-xl bg-[var(--greyscale-900)]">
            <video
              ref={setCameraVideoNode}
              className="aspect-square w-full scale-x-[-1] object-cover"
              autoPlay
              playsInline
              muted
            />
            {cameraStarting || !cameraStream ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--greyscale-900)] text-sm text-white">
                {cameraStarting ? "Starting camera…" : "Waiting for camera…"}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={capturingCameraPhoto || cameraStarting}
              onClick={closeCameraDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={capturingCameraPhoto || uploadingAvatar || cameraStarting || !cameraStream}
              onClick={() => void handleCaptureCameraPhoto()}
            >
              {capturingCameraPhoto || uploadingAvatar ? "Saving…" : "Capture photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </StudentMain>
  )
}

export { AccountPage }
