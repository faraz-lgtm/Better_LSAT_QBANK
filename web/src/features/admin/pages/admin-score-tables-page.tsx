import { useEffect, useState } from "react"

import { useAdminApi } from "@/features/admin/use-admin-api"

function AdminScoreTablesPage() {
  const adminApi = useAdminApi()
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
  const [selectedId, setSelectedId] = useState("")
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      if (!adminApi) return
      try {
        const data = (await adminApi.listScoreTables()) as Array<Record<string, unknown>>
        if (!alive) return
        setRows(data)
        if (data[0]) setSelectedId(String(data[0].id))
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load score tables")
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [adminApi])

  useEffect(() => {
    if (!adminApi || !selectedId) return
    void adminApi
      .getScoreTable(selectedId)
      .then((row) => setDetail((row as Record<string, unknown>) ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load score table"))
  }, [adminApi, selectedId])

  const scoreRows = (detail?.admin_score_rows as Array<Record<string, unknown>> | undefined) ?? []

  return (
    <section className="space-y-4">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">Score tables</h1>
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="admin-surface p-3">
          <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">PrepTest Tables</h2>
          <ul className="space-y-1">
            {rows.map((row) => (
              <li key={String(row.id)}>
                <button
                  type="button"
                  className={`w-full rounded px-2 py-1 text-left text-sm ${
                    selectedId === String(row.id)
                      ? "border border-[#2e3a10] bg-[var(--accent-bg)] text-[var(--accent)]"
                      : "text-[var(--text2)] hover:bg-[var(--surface2)]"
                  }`}
                  onClick={() => setSelectedId(String(row.id))}
                >
                  {String(((row.admin_prep_tests as Record<string, unknown> | null)?.title ?? row.prep_test_id) || "Unknown")}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="admin-surface p-3">
          <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">Rows</h2>
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)]">
              <tr>
                <th className="px-2 py-1 text-left text-[11px] uppercase tracking-[0.06em] text-[var(--text3)]">Raw</th>
                <th className="px-2 py-1 text-left text-[11px] uppercase tracking-[0.06em] text-[var(--text3)]">Scaled</th>
                <th className="px-2 py-1 text-left text-[11px] uppercase tracking-[0.06em] text-[var(--text3)]">Percentile</th>
              </tr>
            </thead>
            <tbody>
              {scoreRows.map((row) => (
                <tr key={String(row.id)} className="border-b border-[var(--border)]">
                  <td className="px-2 py-1 text-[var(--text2)]">{String(row.raw_score ?? "-")}</td>
                  <td className="px-2 py-1">
                    <input
                      className="admin-input w-20 px-1 py-0.5 text-center font-mono"
                      type="number"
                      defaultValue={Number(row.scaled_score ?? 0)}
                      onBlur={(e) =>
                        void adminApi?.updateScoreRow(String(row.id), { scaled_score: Number(e.target.value) }).catch((err) => {
                          setError(err instanceof Error ? err.message : "Failed to update score row")
                        })
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="admin-input w-20 px-1 py-0.5 text-center font-mono"
                      type="number"
                      defaultValue={Number(row.percentile ?? 0)}
                      onBlur={(e) =>
                        void adminApi?.updateScoreRow(String(row.id), { percentile: Number(e.target.value) }).catch((err) => {
                          setError(err instanceof Error ? err.message : "Failed to update score row")
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export { AdminScoreTablesPage }
