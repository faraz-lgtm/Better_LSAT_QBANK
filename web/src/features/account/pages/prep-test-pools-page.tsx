import { useEffect, useMemo, useRef, useState } from "react"

import {
  AccommodationsSettingsSection,
  AppearanceSettingsSection,
} from "@/features/account/components/settings-preference-sections"
import type {
  PrepTestPoolSettingsItem,
  PrepTestPoolSettingsListResult,
  PrepTestPoolSettingsUpdate,
} from "@/features/account/prep-test-pool-types"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { AppToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import { useAppToast } from "@/hooks/use-app-toast"
import { createPracticeApi } from "@/lib/api/practice"
import {
  PREP_TEST_POOL_DRILL_ONLY_MAX,
  PREP_TEST_POOL_MIDDLE_MAX,
} from "@/lib/prep-test-pool-defaults"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type PoolFlag = "inDrills" | "inSections" | "inTests"
type PoolKey = "drills" | "sections" | "tests"
type BandId = "recent" | "mid" | "older" | "other"

type PoolTone = {
  key: PoolKey
  flag: PoolFlag
  letter: "D" | "S" | "P"
  label: string
  activeBg: string
  activeBorder: string
  activeText: string
  bar: string
  legendBg: string
  legendBorder: string
}

const POOL_TONES: PoolTone[] = [
  {
    key: "drills",
    flag: "inDrills",
    letter: "D",
    label: "Drills",
    activeBg: "bg-[#fff3ea]",
    activeBorder: "border-[#ff6f00]",
    activeText: "text-[#ff6f00]",
    bar: "bg-[#ff6f00]",
    legendBg: "bg-[#fff3ea]",
    legendBorder: "border-[#ff6f00]",
  },
  {
    key: "sections",
    flag: "inSections",
    letter: "S",
    label: "Sections",
    activeBg: "bg-[#fff6e0]",
    activeBorder: "border-[#956321]",
    activeText: "text-[#956321]",
    bar: "bg-[#956321]",
    legendBg: "bg-[#fff6e0]",
    legendBorder: "border-[#956321]",
  },
  {
    key: "tests",
    flag: "inTests",
    letter: "P",
    label: "Preptests",
    activeBg: "bg-[var(--primary-25)]",
    activeBorder: "border-[var(--primary)]",
    activeText: "text-[var(--primary)]",
    bar: "bg-[var(--primary)]",
    legendBg: "bg-[var(--primary-25)]",
    legendBorder: "border-[var(--primary)]",
  },
]

const RECOMMENDATIONS = [
  {
    title: "PT101–122",
    description: "Drills only. No comparative RC passages.",
    active: { drills: true, sections: false, tests: false } as const,
  },
  {
    title: "PT123–152",
    description: "Flexible — works for any pool type.",
    active: { drills: true, sections: true, tests: true } as const,
  },
  {
    title: "PT153–158",
    description: "Most test-like. Reserve for full PrepTests.",
    active: { drills: false, sections: false, tests: true } as const,
  },
] as const

type BandMeta = {
  id: BandId
  title: string
  rangeLabel: string | null
}

function parsePrepTestNumber(item: PrepTestPoolSettingsItem): number | null {
  if (item.prepTestNumber) {
    const n = Number.parseInt(item.prepTestNumber, 10)
    if (Number.isFinite(n)) return n
  }
  const fromTitle = item.title?.match(/\d{3,}/)?.[0]
  if (fromTitle) {
    const n = Number.parseInt(fromTitle, 10)
    if (Number.isFinite(n)) return n
  }
  return null
}

function bandForNumber(n: number | null): BandId {
  if (n == null) return "other"
  if (n > PREP_TEST_POOL_MIDDLE_MAX) return "recent"
  if (n > PREP_TEST_POOL_DRILL_ONLY_MAX) return "mid"
  return "older"
}

function bandMeta(id: BandId): BandMeta {
  switch (id) {
    case "recent":
      return { id, title: "Recent", rangeLabel: "PT153–PT159" }
    case "mid":
      return { id, title: "Mid-range", rangeLabel: "PT123–PT152" }
    case "older":
      return { id, title: "Older", rangeLabel: "PT101–PT122" }
    default:
      return { id, title: "Other", rangeLabel: null }
  }
}

function prepTestLabel(item: PrepTestPoolSettingsItem): string {
  if (item.prepTestNumber) return `PT${item.prepTestNumber}`
  return item.title?.trim() || item.moduleId
}

function freshnessTone(percent: number): string {
  if (percent >= 90) return "#40c4aa"
  if (percent >= 75) return "#d97706"
  if (percent > 0) return "#df1c41"
  return "#818898"
}

function applyLocalUpdate(
  current: PrepTestPoolSettingsListResult,
  update: PrepTestPoolSettingsUpdate,
): PrepTestPoolSettingsListResult {
  const prepTests = current.prepTests.map((pt) =>
    pt.prepTestId === update.prepTestId
      ? {
          ...pt,
          inDrills: update.inDrills,
          inSections: update.inSections,
          inTests: update.inTests,
          isDefault: false,
        }
      : pt,
  )
  return {
    prepTests,
    counts: {
      drills: prepTests.filter((pt) => pt.inDrills).length,
      sections: prepTests.filter((pt) => pt.inSections).length,
      tests: prepTests.filter((pt) => pt.inTests).length,
    },
  }
}

function PoolPill({
  tone,
  active,
  label,
  onClick,
  disabled,
}: {
  tone: PoolTone
  active: boolean
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-6 w-7 shrink-0 items-center justify-center rounded-[6px] border text-xs tracking-[0.24px] transition-colors disabled:opacity-60",
        active
          ? cn(tone.activeBg, tone.activeBorder, tone.activeText)
          : "border-[var(--greyscale-100)] bg-transparent text-[var(--greyscale-400)]",
      )}
    >
      {tone.letter}
    </button>
  )
}

function BandCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width={8}
      height={8}
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M1.5 4L3.2 5.7L6.5 2.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BandBulkToggle({
  tone,
  checked,
  label,
  onClick,
  disabled,
}: {
  tone: PoolTone
  checked: boolean
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors disabled:opacity-60",
        checked
          ? cn(tone.activeBg, tone.activeBorder, tone.activeText)
          : "border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-transparent",
      )}
    >
      {checked ? <BandCheckIcon className="size-2" /> : null}
    </button>
  )
}

function FreshnessBar({ percent }: { percent: number }) {
  const color = freshnessTone(percent)
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="flex min-w-[80px] items-center gap-1.5">
      <div className="h-[3px] w-[46px] overflow-hidden rounded-[2px] bg-[var(--greyscale-100)]">
        <div
          className="h-[3px] rounded-[2px]"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      <span className="min-w-[28px] text-[10px] tracking-[0.2px]" style={{ color }}>
        {Math.round(clamped)}%
      </span>
    </div>
  )
}

function CoverageMeter({
  label,
  value,
  total,
  tone,
}: {
  label: string
  value: number
  total: number
  tone: PoolTone
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between">
        <p className={cn("m-0 text-xs font-semibold tracking-[0.24px]", tone.activeText)}>{label}</p>
        <p className="m-0 text-sm font-semibold tracking-[0.28px] text-[var(--primary-800)]">{value}</p>
      </div>
      <div className="mt-[5px] h-1 overflow-hidden rounded-[2px] bg-[var(--greyscale-100)]">
        <div className={cn("h-1 rounded-[2px] opacity-70", tone.bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function PrepTestPoolsPage() {
  const practiceApi = createPracticeApi(getSupabaseBrowserClient())
  const { toast, showError, showSuccess, dismiss } = useAppToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<PrepTestPoolSettingsListResult | null>(null)
  const [tipsOpen, setTipsOpen] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdates = useRef<Map<string, PrepTestPoolSettingsUpdate>>(new Map())

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await practiceApi.listPrepTestPoolSettings()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : "Failed to load PrepTest pools")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, [])

  function flushUpdates() {
    const updates = [...pendingUpdates.current.values()]
    pendingUpdates.current.clear()
    if (updates.length === 0) return
    setSaving(true)
    void (async () => {
      try {
        const result = await practiceApi.updatePrepTestPoolSettings(updates)
        setData(result)
        showSuccess("Allocation updated.")
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to save PrepTest pools")
        try {
          const refreshed = await practiceApi.listPrepTestPoolSettings()
          setData(refreshed)
        } catch {
          /* keep optimistic state if refresh fails */
        }
      } finally {
        setSaving(false)
      }
    })()
  }

  function queueUpdate(update: PrepTestPoolSettingsUpdate) {
    setData((prev) => (prev ? applyLocalUpdate(prev, update) : prev))
    pendingUpdates.current.set(update.prepTestId, update)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => flushUpdates(), 400)
  }

  function onToggle(item: PrepTestPoolSettingsItem, flag: PoolFlag, checked: boolean) {
    queueUpdate({
      prepTestId: item.prepTestId,
      inDrills: flag === "inDrills" ? checked : item.inDrills,
      inSections: flag === "inSections" ? checked : item.inSections,
      inTests: flag === "inTests" ? checked : item.inTests,
    })
  }

  function onBandBulkToggle(items: PrepTestPoolSettingsItem[], flag: PoolFlag) {
    const allOn = items.length > 0 && items.every((item) => item[flag])
    const next = !allOn
    for (const item of items) {
      queueUpdate({
        prepTestId: item.prepTestId,
        inDrills: flag === "inDrills" ? next : item.inDrills,
        inSections: flag === "inSections" ? next : item.inSections,
        inTests: flag === "inTests" ? next : item.inTests,
      })
    }
  }

  async function onReset() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    pendingUpdates.current.clear()
    setSaving(true)
    try {
      const result = await practiceApi.resetPrepTestPoolSettings()
      setData(result)
      showSuccess("Allocation updated.")
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to reset PrepTest pools")
    } finally {
      setSaving(false)
    }
  }

  const bands = useMemo(() => {
    const prepTests = data?.prepTests ?? []
    const grouped: Record<BandId, PrepTestPoolSettingsItem[]> = {
      recent: [],
      mid: [],
      older: [],
      other: [],
    }
    for (const item of prepTests) {
      grouped[bandForNumber(parsePrepTestNumber(item))].push(item)
    }
    for (const id of Object.keys(grouped) as BandId[]) {
      grouped[id].sort((a, b) => {
        const an = parsePrepTestNumber(a) ?? 0
        const bn = parsePrepTestNumber(b) ?? 0
        return bn - an
      })
    }
    const order: BandId[] = ["recent", "mid", "older", "other"]
    return order
      .filter((id) => grouped[id].length > 0)
      .map((id) => ({
        ...bandMeta(id),
        items: grouped[id],
      }))
  }, [data?.prepTests])

  if (loading) {
    return (
      <StudentMain fullBleed contentClassName="px-6">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading PrepTest pools…" />
      </StudentMain>
    )
  }

  const counts = data?.counts ?? { drills: 0, sections: 0, tests: 0 }
  const totalTests = data?.prepTests.length ?? 0

  return (
    <StudentMain fullBleed contentClassName="px-6">
      <div className="mx-auto flex w-full max-w-[1304px] flex-col gap-6 rounded-3xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
        <h1 className="m-0 text-2xl font-bold leading-[1.3] text-[var(--primary-800)]">Setting</h1>

        <AppearanceSettingsSection />
        <AccommodationsSettingsSection
          onError={(message) => {
            if (message) showError(message)
          }}
          onStatus={(message) => {
            if (message) showSuccess(message)
          }}
        />

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-2xl font-bold leading-[1.3] text-[var(--primary-800)]">
              PrepTest Setting
            </h2>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-[var(--greyscale-100)] px-4 text-sm font-semibold tracking-[0.28px] text-[var(--primary)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]"
              disabled={saving}
              onClick={() => void onReset()}
            >
              Reset to defaults
            </Button>
          </div>

          <p className="m-0 text-[13px] leading-[20.8px] text-[var(--greyscale-500)]">
            Control which PrepTests appear in each practice pool. A test can belong to multiple pools.
          </p>

        <div className="flex flex-wrap items-center gap-4">
          {POOL_TONES.map((tone) => (
            <div key={tone.key} className="flex items-center gap-[5px]">
              <span
                className={cn("size-4 shrink-0 rounded-[4px] border", tone.legendBg, tone.legendBorder)}
                aria-hidden
              />
              <span className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{tone.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-[5px]">
            <span
              className="h-[3px] w-7 shrink-0 rounded-[2px] bg-gradient-to-r from-[#059669] via-[#d97706] to-[#dc2626]"
              aria-hidden
            />
            <span className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">Freshness</span>
          </div>
        </div>

        <div className="rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--primary-0)] px-5 py-[18px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.05)]">
          <p className="m-0 text-xs tracking-[0.24px] text-[var(--primary-800)]">
            Pool coverage · {totalTests} PrepTests
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:justify-between sm:gap-6">
            <CoverageMeter label="Drills" value={counts.drills} total={totalTests} tone={POOL_TONES[0]!} />
            <CoverageMeter label="Sections" value={counts.sections} total={totalTests} tone={POOL_TONES[1]!} />
            <CoverageMeter label="Preptests" value={counts.tests} total={totalTests} tone={POOL_TONES[2]!} />
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-[13px] text-left"
            aria-expanded={tipsOpen}
            onClick={() => setTipsOpen((open) => !open)}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm font-medium leading-[14px] text-[#b5b0a4]">?</span>
              <span className="text-sm tracking-[0.28px] text-[var(--color-student-heading)]">
                Which tests work best for each pool?
              </span>
            </span>
            <img
              src="/figma/prep-course/icon-chevron.svg"
              alt=""
              width={14}
              height={8}
              className={cn("size-[14px] transition-transform", tipsOpen ? "rotate-180" : "rotate-0")}
              aria-hidden
            />
          </button>
          {tipsOpen ? (
            <div className="border-t border-[#ede9e1] px-5 py-[18px]">
              <div className="grid gap-3 md:grid-cols-3">
                {RECOMMENDATIONS.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--primary-0)] px-3.5 py-3"
                  >
                    <p className="m-0 text-xs font-bold tracking-[0.24px] text-[var(--primary-800)]">
                      {card.title}
                    </p>
                    <div className="mt-[7px] flex gap-1">
                      {POOL_TONES.map((tone) => {
                        const on = card.active[tone.key]
                        return (
                          <span
                            key={tone.key}
                            className={cn(
                              "inline-flex h-[18px] w-[22px] items-center justify-center rounded-[4px] border text-[10px] leading-[15px]",
                              on
                                ? cn(tone.activeBg, tone.activeBorder, tone.activeText)
                                : "border-[var(--greyscale-100)] text-[var(--greyscale-500)]",
                            )}
                          >
                            {tone.letter}
                          </span>
                        )
                      })}
                    </div>
                    <p className="mt-2 m-0 text-xs tracking-[0.24px] text-[var(--greyscale-500)]">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05)]">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
          <div className="flex items-center justify-between px-5 py-[13px]">
            <p className="m-0 text-sm tracking-[0.28px] text-[var(--primary-800)]">Official PrepTests</p>
            <div className="flex items-center gap-4">
              <span className="w-20 text-center text-xs tracking-[0.24px] text-[var(--primary-800)]">Fresh</span>
              {POOL_TONES.map((tone) => (
                <span
                  key={tone.key}
                  className={cn("w-9 text-center text-xs font-bold tracking-[0.24px] opacity-80", tone.activeText)}
                >
                  {tone.letter}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--greyscale-100)]">
            {bands.map((band) => {
              const allFlags = {
                inDrills: band.items.every((item) => item.inDrills),
                inSections: band.items.every((item) => item.inSections),
                inTests: band.items.every((item) => item.inTests),
              }
              return (
                <div key={band.id}>
                  <div className="flex items-center border-b border-[var(--greyscale-100)] bg-[var(--primary-0)] px-5 py-[7px]">
                    <div className="flex min-w-0 flex-1 items-center gap-[7px]">
                      <span className="text-xs font-semibold tracking-[0.24px] text-[var(--primary-800)]">
                        {band.title}
                      </span>
                      {band.rangeLabel ? (
                        <span className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">
                          {band.rangeLabel}
                        </span>
                      ) : null}
                    </div>
                    <div className="w-20" aria-hidden />
                    <div className="flex items-center gap-4">
                      {POOL_TONES.map((tone) => (
                        <div key={tone.key} className="flex w-9 justify-center">
                          <BandBulkToggle
                            tone={tone}
                            checked={allFlags[tone.flag]}
                            label={`Toggle all ${band.title} ${tone.label}`}
                            disabled={saving}
                            onClick={() => onBandBulkToggle(band.items, tone.flag)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <ul className="m-0 list-none p-0">
                    {band.items.map((item) => (
                      <li
                        key={item.prepTestId}
                        className="flex items-center border-b border-[var(--greyscale-100)] px-5 py-[9px] last:border-b-0"
                      >
                        <p className="m-0 min-w-0 flex-1 text-sm font-medium tracking-[0.28px] text-[var(--primary-800)]">
                          {prepTestLabel(item)}
                        </p>
                        <div className="flex items-center gap-4">
                          <FreshnessBar percent={item.freshnessPercent} />
                          {POOL_TONES.map((tone) => (
                            <div key={tone.key} className="flex w-9 justify-center">
                              <PoolPill
                                tone={tone}
                                active={item[tone.flag]}
                                label={`${prepTestLabel(item)} ${tone.label.toLowerCase()}`}
                                disabled={saving}
                                onClick={() => onToggle(item, tone.flag, !item[tone.flag])}
                              />
                            </div>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {toast ? <AppToast toast={toast} onDismiss={dismiss} /> : null}
    </StudentMain>
  )
}
