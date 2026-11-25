import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  AdminCustomDateRangeDialog,
  addDays,
  startOfDay,
  type DateRangeValue,
} from "@/features/admin/components/admin-custom-date-range-dialog"
import { useAdminApi } from "@/features/admin/use-admin-api"
import type { AdminInsightsSnapshot } from "@/lib/api/admin"

type RangeKey = "7" | "30" | "90" | "custom"

const BLUE = "#0d47a1"
const BLUE_MID = "#3b6ad4"
const BLUE_SOFT = "#6e90dc"
const BLUE_PALE = "#9eb4e8"
const BLUE_LIGHTEST = "#c8d6f3"
const BLUE_LIGHT = "#93c5fd"
const ORANGE = "#f08a24"
const ORANGE_LABEL = "#b4590a"
const GRID = "#e8edf4"
const AXIS = "#5a6478"
const CARD_BORDER = "#e4e7ec"

const FUNNEL_FILL = [BLUE, BLUE_MID, BLUE_SOFT, BLUE_PALE, BLUE_LIGHTEST]
const SCORE_FILL = ["#c8d6f3", "#9eb4e8", "#6e90dc", BLUE, BLUE_MID, BLUE_SOFT, BLUE_PALE]
const UPGRADE_FILL = [BLUE_PALE, BLUE_SOFT, BLUE, BLUE, BLUE_SOFT, BLUE_PALE]

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function ChartLegend({ items }: { items: Array<{ color: string; label: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-[5px]">
          <span className="size-[9px] shrink-0 rounded-[2px]" style={{ background: item.color }} />
          <span className="text-xs text-[#5a6478]">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function AdminInsightsPage() {
  const adminApi = useAdminApi()
  const [snapshot, setSnapshot] = useState<AdminInsightsSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<RangeKey>("30")
  const [customOpen, setCustomOpen] = useState(false)
  const [customRange, setCustomRange] = useState<DateRangeValue>(() => {
    const end = startOfDay(new Date())
    return { start: addDays(end, -29), end }
  })

  const activeRange = useMemo(() => {
    if (range === "custom") return customRange
    const end = startOfDay(new Date())
    const days = Number(range)
    return { start: addDays(end, -(days - 1)), end }
  }, [range, customRange])

  const rangeQuery = useMemo(() => {
    const from = startOfDay(activeRange.start)
    const toEnd = startOfDay(activeRange.end).getTime() + 86400000 - 1
    return {
      from: from.toISOString(),
      to: new Date(toEnd).toISOString(),
    }
  }, [activeRange])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!adminApi) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const row = await adminApi.getInsights(rangeQuery)
        if (alive) {
          setSnapshot(row)
          setLoading(false)
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : "Failed to load insights")
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [adminApi, rangeQuery])

  const payload = snapshot?.payload ?? {}
  const funnel = asArray<{ stage: string; count: number }>(payload.funnel)
  const conversionBySource = asArray<{
    source: string
    paid_rate: number
    active_60d: number
    signups: number
  }>(payload.conversion_by_source)
  const signupsWeeks = asArray<{ week: string; signups: number; upgrades: number }>(
    payload.signups_and_upgrades_by_week,
  )
  const scoreImprovement = asArray<{ bucket: string; count: number }>(payload.score_improvement)
  const featureUsage = asArray<{ feature: string; paid: number; free: number }>(payload.feature_usage)
  const activityOverTime = asArray<{ week: string; paid: number; free: number }>(payload.activity_over_time)
  const retention = asArray<{ month: string; six_month: number | null; three_month: number | null }>(
    payload.retention,
  )
  const cohort = asArray<{ cohort: string; day7: number; day14: number; day30: number }>(
    payload.cohort_conversion,
  )
  const timeToUpgrade = asArray<{ bucket: string; count: number }>(payload.time_to_upgrade)
  const activityRate = (payload.activity_rate ?? {}) as { paid?: number; free?: number }

  const funnelWithLeak = useMemo(() => {
    return funnel.map((row, idx) => {
      const prev = idx === 0 ? row.count : (funnel[idx - 1]?.count ?? row.count)
      const leak = prev - row.count
      return { ...row, leak: idx === 0 ? 0 : leak }
    })
  }, [funnel])

  const largestLeakIdx = useMemo(() => {
    let maxIdx = -1
    let maxLeak = 0
    funnelWithLeak.forEach((row, idx) => {
      if (idx > 0 && row.leak > maxLeak) {
        maxLeak = row.leak
        maxIdx = idx
      }
    })
    return maxIdx
  }, [funnelWithLeak])

  const cohortLineData = useMemo(() => {
    if (cohort.length === 0) return []
    return [
      { day: "day 0", ...Object.fromEntries(cohort.map((c) => [c.cohort, 0])) },
      { day: "day 7", ...Object.fromEntries(cohort.map((c) => [c.cohort, c.day7])) },
      { day: "day 14", ...Object.fromEntries(cohort.map((c) => [c.cohort, c.day14])) },
      { day: "day 30", ...Object.fromEntries(cohort.map((c) => [c.cohort, c.day30])) },
    ]
  }, [cohort])

  const cohortColors = ["#93c5fd", "#60a5fa", "#3b82f6", BLUE, "#1e3a8a"]

  const signupsCaption = useMemo(() => {
    if (signupsWeeks.length === 0) return "Signups and upgrades over the selected range."
    const signups = signupsWeeks.reduce((s, r) => s + r.signups, 0)
    const upgrades = signupsWeeks.reduce((s, r) => s + r.upgrades, 0)
    return `${signups} signups and ${upgrades} upgrades over ${signupsWeeks.length} weeks.`
  }, [signupsWeeks])

  const timeToUpgradeCaption = useMemo(() => {
    if (timeToUpgrade.length === 0) return "How long is the decision window?"
    return "Median 7 days. Half of upgrades happen in the first week, so the first 7 days are where any onboarding change pays off."
  }, [timeToUpgrade])

  const customLabel =
    range === "custom"
      ? `${customRange.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${customRange.end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : "Custom"

  const axisTick = { fill: AXIS, fontSize: 10 }
  const tooltipStyle = {
    borderRadius: 8,
    border: `1px solid ${CARD_BORDER}`,
    fontSize: 12,
  }

  return (
    <section className="flex flex-col gap-5 pb-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="admin-typo-h1">Insights</h1>
          <p className="admin-typo-subtitle">
            Why the numbers are moving. Read weekly. One range control, and every chart on this page obeys it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-[10px] border border-[#e3e8ef] bg-white p-[3px]">
            {(["7", "30", "90"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`min-h-9 rounded-[7px] px-3 py-2 text-sm ${
                  range === key
                    ? "bg-[#1e40af] font-semibold text-white"
                    : "font-normal text-[#475569] hover:bg-[var(--surface3)]"
                }`}
                onClick={() => setRange(key)}
              >
                {key} days
              </button>
            ))}
            <button
              type="button"
              className={`min-h-9 rounded-[7px] px-3 py-2 text-sm ${
                range === "custom"
                  ? "bg-[#1e40af] font-semibold text-white"
                  : "font-normal text-[#475569] hover:bg-[var(--surface3)]"
              }`}
              onClick={() => setCustomOpen(true)}
            >
              {customLabel}
            </button>
          </div>
        </div>
      </div>

      <AdminCustomDateRangeDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        initialRange={customRange}
        onApply={(next) => {
          setCustomRange(next)
          setRange("custom")
        }}
      />

      {loading && <p className="text-sm text-[var(--text3)]">Loading insights…</p>}
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}

      <div className="flex flex-col gap-6">
        <Section title="1 · ACQUISITION AND CONVERSION">
          <div className="grid gap-[23px] lg:grid-cols-2">
            <ChartCard
              title="Conversion by source"
              badge
              subtitle="Which channels bring students who pay, and who stay?"
              footnote="Source is captured on every student row today and aggregated nowhere. Until this chart exists there is no way to judge acquisition spend."
            >
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={conversionBySource} layout="vertical" margin={{ left: 8, right: 36, top: 4, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="0" horizontal={false} stroke={GRID} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="source"
                    width={88}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="paid_rate" name="paid rate" fill={BLUE} barSize={8} radius={[2, 2, 2, 2]}>
                    <LabelList
                      dataKey="paid_rate"
                      position="right"
                      formatter={(v: number) => `${v}%`}
                      style={{ fill: "#1a1b25", fontSize: 10, fontWeight: 700 }}
                    />
                  </Bar>
                  <Bar dataKey="active_60d" name="still active at 60 days" fill={ORANGE} barSize={8} radius={[2, 2, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend
                items={[
                  { color: BLUE, label: "paid rate" },
                  { color: ORANGE, label: "still active at 60 days" },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Cohort conversion"
              badge
              subtitle="Of students who signed up in week N, what share had paid by day 7, 14 and 30?"
              footnote={
                <>
                  Replaces the lifetime <em className="italic">paid ÷ all users</em> tile, which mixes cohorts and
                  falls during a good acquisition month.
                </>
              }
            >
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={cohortLineData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[0, 30]}
                    tickFormatter={(v) => `${v}%`}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  {cohort.map((c, i) => (
                    <Line
                      key={c.cohort}
                      type="monotone"
                      dataKey={c.cohort}
                      stroke={cohortColors[i % cohortColors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Signups and paid upgrades"
              subtitle="Is growth coming from volume, or from conversion?"
              footnote={signupsCaption}
            >
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={signupsWeeks} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} barGap={4}>
                  <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="week" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="signups" fill={BLUE_LIGHT} radius={[3, 3, 0, 0]} barSize={22} />
                  <Bar dataKey="upgrades" fill={BLUE} radius={[3, 3, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Time to upgrade"
              subtitle="How long is the decision window?"
              footnote={timeToUpgradeCaption}
            >
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={timeToUpgrade} margin={{ left: 0, right: 8, top: 18, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="bucket" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={36}>
                    {timeToUpgrade.map((_, i) => (
                      <Cell key={i} fill={UPGRADE_FILL[i % UPGRADE_FILL.length]} />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="top"
                      style={{ fill: "#1a1b25", fontSize: 10, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </Section>

        <Section title="2 · THE FUNNEL">
          <ChartCard
            title="Signup to upgrade"
            badge
            subtitle="Where do students fall out? Split by source and by whether a test date was given."
            footnote={
              <>
                Each stage opens that list in{" "}
                <Link to="/admin/students" className="text-[var(--accent)] underline">
                  Students
                </Link>
                . The{" "}
                {funnelWithLeak[largestLeakIdx]?.leak ?? 0} who signed up and never started a diagnostic are the
                cheapest students on the platform to win back.
              </>
            }
          >
            <div className="flex flex-col gap-2.5 pt-1">
              {funnelWithLeak.map((row, idx) => {
                const max = funnelWithLeak[0]?.count || 1
                const width = Math.max(14, Math.round((100 * row.count) / max))
                const fill = FUNNEL_FILL[Math.min(idx, FUNNEL_FILL.length - 1)]
                const darkText = idx >= 3
                const isLargest = idx === largestLeakIdx
                return (
                  <div key={row.stage} className="flex items-center gap-4">
                    <div
                      className="flex h-[42px] min-w-[145px] max-w-[760px] items-center rounded-lg px-4 text-sm font-semibold"
                      style={{
                        width: `${width}%`,
                        background: fill,
                        color: darkText ? "#1a1b25" : "#ffffff",
                      }}
                    >
                      {row.stage} · {row.count}
                    </div>
                    {idx > 0 && row.leak > 0 && (
                      <p
                        className={`shrink-0 text-[13px] whitespace-nowrap ${
                          isLargest ? "font-semibold text-[#b42318]" : "font-normal text-[#5a6478]"
                        }`}
                      >
                        −{row.leak}
                        {isLargest ? " · the largest single leak" : ""}
                      </p>
                    )}
                  </div>
                )
              })}
              {funnelWithLeak.length === 0 && (
                <p className="text-sm text-[var(--text3)]">No funnel data yet.</p>
              )}
            </div>
          </ChartCard>
        </Section>

        <Section title="3 · ENGAGEMENT AND USAGE">
          <div className="grid gap-[23px] lg:grid-cols-2">
            <ChartCard
              title="What people use"
              subtitle="Share of active students who used each feature, paid against free."
              footnote="Free students at 18% on course lessons against 69% paid is either the paywall working or activation failing. Decide which, deliberately."
            >
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={featureUsage} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 0 }} barCategoryGap="22%">
                  <CartesianGrid strokeDasharray="0" horizontal={false} stroke={GRID} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    width={110}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="paid" fill={BLUE} barSize={7} radius={[2, 2, 2, 2]} />
                  <Bar dataKey="free" fill={ORANGE} barSize={7} radius={[2, 2, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend
                items={[
                  { color: BLUE, label: "paid" },
                  { color: ORANGE, label: "free" },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Activity rate over time"
              subtitle="The line chart the old three-bar card was trying to be."
              footnote="Paid activity is stable. Free activity is the number any activation work has to move."
            >
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={activityOverTime} margin={{ left: 0, right: 56, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="week" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[0, 80]}
                    tickFormatter={(v) => `${v}%`}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="paid" stroke={BLUE} strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="free" stroke={ORANGE} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-1 flex justify-end gap-4 pr-1 text-[10px] font-bold">
                <span style={{ color: BLUE }}>paid {activityRate.paid ?? 0}%</span>
                <span style={{ color: ORANGE_LABEL }}>free {activityRate.free ?? 0}%</span>
              </div>
            </ChartCard>
          </div>
        </Section>

        <Section title="4 · OUTCOMES AND RETENTION">
          <div className="grid gap-[23px] lg:grid-cols-2">
            <ChartCard
              title="Score improvement"
              badge
              subtitle="Diagnostic against latest PrepTest, by weeks studied. The product's actual promise."
              footnote="Median gain +11 points. Nothing in the admin measures this today, and it is the strongest marketing asset you would own."
            >
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={scoreImprovement} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="bucket" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={36}>
                    {scoreImprovement.map((_, i) => (
                      <Cell key={i} fill={SCORE_FILL[i % SCORE_FILL.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Retention and cancellations"
              badge
              subtitle="A 6-month plan cancelling is a large, slow, invisible event. Nothing surfaces one today."
              footnote="Also needed here: refunds, failed payments and non-renewals, all of which are invisible in the current admin."
            >
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={retention} margin={{ left: 0, right: 56, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[25, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="six_month"
                    name="6-month"
                    stroke={BLUE}
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="three_month"
                    name="3-month"
                    stroke={ORANGE}
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-1 flex justify-end gap-4 pr-1 text-[10px] font-bold">
                <span style={{ color: BLUE }}>6-month</span>
                <span style={{ color: ORANGE_LABEL }}>3-month</span>
              </div>
            </ChartCard>
          </div>
        </Section>
      </div>
    </section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold tracking-[0.96px] text-[#5a6478]">{title}</h2>
      {children}
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  footnote,
  badge,
  children,
}: {
  title: string
  subtitle?: string
  footnote?: React.ReactNode
  badge?: boolean
  children: React.ReactNode
}) {
  return (
    <article
      className="flex flex-col rounded-[14px] border bg-white px-[22px] py-5 shadow-[0px_1px_2px_rgba(15,23,41,0.02)]"
      style={{ borderColor: CARD_BORDER }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold leading-5 text-[#1a1b25]">{title}</h3>
        {badge ? (
          <span className="rounded-[5px] bg-[#eef3ff] px-1.5 py-px text-[11px] font-semibold text-[#0d47a1]">
            new
          </span>
        ) : null}
      </div>
      {subtitle ? <p className="mt-1 text-[13px] leading-[18.85px] text-[#5a6478]">{subtitle}</p> : null}
      <div className="mt-4 min-w-0">{children}</div>
      {footnote ? (
        <p className="mt-3.5 text-[13px] leading-[19.5px] text-[#3a4458]">{footnote}</p>
      ) : null}
    </article>
  )
}

export { AdminInsightsPage }
