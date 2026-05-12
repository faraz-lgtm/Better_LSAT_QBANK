import { useEffect, useState } from "react"

import { useAdminApi } from "@/features/admin/use-admin-api"

type ConfigTab = "timing" | "scoring" | "access" | "retake" | "drill"

function AdminConfigPage() {
  const adminApi = useAdminApi()
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ConfigTab>("timing")

  useEffect(() => {
    void adminApi
      ?.getPlatformConfig()
      .then((row) => setConfig(row ?? {}))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load config"))
  }, [adminApi])

  function saveField(key: string, value: unknown) {
    setConfig((prev) => ({ ...prev, [key]: value }))
    void adminApi?.upsertPlatformConfig({ [key]: value }).catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to save config")
    })
  }

  function asBool(key: string, fallback = false) {
    const value = config[key]
    return typeof value === "boolean" ? value : fallback
  }

  function asNumber(key: string, fallback: number) {
    const value = Number(config[key])
    return Number.isFinite(value) ? value : fallback
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="admin-typo-h1">Platform config</h1>
        <p className="admin-typo-subtitle mt-1">
          Global settings that apply across all PrepTests and drills. Per-test overrides are set inside each PrepTest.
        </p>
      </div>
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      <div>
        <div className="admin-tabs">
          {[
            { id: "timing", label: "Timing" },
            { id: "scoring", label: "Scoring" },
            { id: "access", label: "Access control" },
            { id: "retake", label: "Retake policy" },
            { id: "drill", label: "Drill settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id as ConfigTab)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "timing" && (
          <>
            <div className="info-box">
              <strong>How timing works</strong>
              Three independent timers: full PrepTest, section practice, and drill. Each is configured separately below.
            </div>
            <div className="cfg-card">
              <div className="cfg-head">
                <div className="cfg-title">
                  <span>Full PrepTest timing</span>
                  <span className="cfg-badge badge-green">Active</span>
                </div>
              </div>
              <div className="cfg-body">
                <table className="timing-table">
                  <thead>
                    <tr><th>Section type</th><th>Default time</th><th>Questions</th><th>Time per Q</th><th>Hard stop</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="section-pill sp-lr">LR</span></td>
                      <td><span className="time-display">35:00</span></td>
                      <td><strong>25-26</strong></td>
                      <td>~1:21</td>
                      <td>
                        <label className="toggle">
                          <input type="checkbox" checked={asBool("auto_advance_on_timeout", true)} onChange={(e) => saveField("auto_advance_on_timeout", e.target.checked)} />
                          <div className="tgl-track" />
                          <div className="tgl-thumb" />
                        </label>
                      </td>
                    </tr>
                    <tr>
                      <td><span className="section-pill sp-rc">RC</span></td>
                      <td><span className="time-display">35:00</span></td>
                      <td><strong>27</strong></td>
                      <td>~1:18</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td><span className="section-pill sp-lg">LG</span></td>
                      <td><span className="time-display">35:00</span></td>
                      <td><strong>23</strong></td>
                      <td>~1:31</td>
                      <td>-</td>
                    </tr>
                  </tbody>
                </table>
                <div className="setting-row mt-3">
                  <div>
                    <div className="sr-label">Student can toggle timed/untimed</div>
                    <div className="sr-sub">Show timed toggle before starting sections.</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={asBool("student_can_toggle_timed", true)} onChange={(e) => saveField("student_can_toggle_timed", e.target.checked)} />
                    <div className="tgl-track" />
                    <div className="tgl-thumb" />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "scoring" && (
          <div className="cfg-card">
            <div className="cfg-head">
              <div className="cfg-title"><span>Score display</span><span className="cfg-badge badge-green">Active</span></div>
            </div>
            <div className="cfg-body">
              <div className="setting-row">
                <div><div className="sr-label">Show scaled score (120-180)</div><div className="sr-sub">Display official LSAC scaled score.</div></div>
                <label className="toggle"><input type="checkbox" checked={asBool("show_scaled_score", true)} onChange={(e) => saveField("show_scaled_score", e.target.checked)} /><div className="tgl-track" /><div className="tgl-thumb" /></label>
              </div>
              <div className="setting-row">
                <div><div className="sr-label">Show percentile</div><div className="sr-sub">Display percentile rank with scaled score.</div></div>
                <label className="toggle"><input type="checkbox" checked={asBool("show_percentile", true)} onChange={(e) => saveField("show_percentile", e.target.checked)} /><div className="tgl-track" /><div className="tgl-thumb" /></label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "access" && (
          <div className="cfg-card">
            <div className="cfg-head">
              <div className="cfg-title"><span>Plan tiers</span><span className="cfg-badge badge-green">3 tiers</span></div>
            </div>
            <div className="cfg-body">
              <div className="setting-row">
                <div><div className="sr-label">Free tier PrepTest cutoff</div><div className="sr-sub">PT numbers up to this value are free.</div></div>
                <input className="admin-input w-24 text-center font-mono" type="number" value={asNumber("free_tier_pt_cutoff", 10)} onChange={(e) => saveField("free_tier_pt_cutoff", Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "retake" && (
          <div className="cfg-card">
            <div className="cfg-head">
              <div className="cfg-title">Retake policy</div>
            </div>
            <div className="cfg-body">
              <div className="setting-row">
                <div><div className="sr-label">Allow PrepTest retakes</div><div className="sr-sub">If off, each PrepTest can only be taken once.</div></div>
                <label className="toggle"><input type="checkbox" checked={asBool("allow_retakes", true)} onChange={(e) => saveField("allow_retakes", e.target.checked)} /><div className="tgl-track" /><div className="tgl-thumb" /></label>
              </div>
              <div className="setting-row">
                <div><div className="sr-label">Minimum days before retake allowed</div><div className="sr-sub">0 means no restriction.</div></div>
                <input className="admin-input w-24 text-center font-mono" type="number" value={asNumber("min_days_between_retakes", 0)} onChange={(e) => saveField("min_days_between_retakes", Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "drill" && (
          <div className="cfg-card">
            <div className="cfg-head">
              <div className="cfg-title"><span>Drill configuration</span><span className="cfg-badge badge-amber">Optional</span></div>
            </div>
            <div className="cfg-body">
              <div className="setting-row">
                <div><div className="sr-label">Max questions per drill session</div><div className="sr-sub">Hard cap on drill size.</div></div>
                <input className="admin-input w-24 text-center font-mono" type="number" value={asNumber("max_drill_questions", 50)} onChange={(e) => saveField("max_drill_questions", Number(e.target.value))} />
              </div>
              <div className="setting-row">
                <div><div className="sr-label">Include You Try questions in drills</div><div className="sr-sub">Allow platform questions in drill builder.</div></div>
                <label className="toggle"><input type="checkbox" checked={asBool("you_try_in_drills", true)} onChange={(e) => saveField("you_try_in_drills", e.target.checked)} /><div className="tgl-track" /><div className="tgl-thumb" /></label>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export { AdminConfigPage }
