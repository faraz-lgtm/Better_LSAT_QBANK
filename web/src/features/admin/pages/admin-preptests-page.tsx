import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAdminApi } from "@/features/admin/use-admin-api"
import {
  filterStudentVisiblePrepTestRows,
  sortPrepTestsByNumberAsc,
} from "@/lib/prep-test-visibility"

function AdminPrepTestsPage() {
  const adminApi = useAdminApi()
  const navigate = useNavigate()
  const [allRows, setAllRows] = useState<Array<Record<string, unknown>>>([])
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [openingPrepTestId, setOpeningPrepTestId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "lr" | "rc" | "lg" | "missing-tags">("all")
  const pageSize = 10

  useEffect(() => {
    let alive = true
    async function load() {
      if (!adminApi) return
      try {
        if (alive) setLoading(true)
        const contentFilter = activeFilter === "all" ? undefined : activeFilter
        const rows = await adminApi.listAllPrepTests(contentFilter)
        if (alive) {
          const visibleRows = sortPrepTestsByNumberAsc(
            filterStudentVisiblePrepTestRows(rows as Array<Record<string, unknown>>),
          )
          setAllRows(visibleRows)
          setPage(0)
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load prep tests")
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [adminApi, activeFilter])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allRows
    return allRows.filter((row) => {
      const title = String(row.title ?? "").toLowerCase()
      const moduleId = String(row.module_id ?? "").toLowerCase()
      return title.includes(q) || moduleId.includes(q)
    })
  }, [allRows, search])

  const total = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageItems = Array.from({ length: totalPages }, (_, i) => i)
  const pagedRows = filteredRows.slice(page * pageSize, page * pageSize + pageSize)

  function formatImportedDate(value: unknown) {
    if (typeof value !== "string") return "-"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return "-"
    return d.toLocaleString("en-US", { month: "short", year: "numeric" })
  }

  function getSectionCount(row: Record<string, unknown>) {
    const sectionCount = Number(row.section_count ?? 0)
    if (sectionCount > 0) return sectionCount
    const sections = row.admin_sections as Array<{ count?: number }> | undefined
    return Number(sections?.[0]?.count ?? 0)
  }

  function getQuestionCount(row: Record<string, unknown>, sectionCount: number) {
    const questionCount = Number(row.question_count ?? 0)
    if (questionCount > 0) return questionCount
    return sectionCount > 0 ? sectionCount * 25 : 0
  }

  function formatPercent(value: number) {
    return `${value.toFixed(2)}%`
  }

  async function openPrepTest(prepTestId: string) {
    if (!adminApi) return
    setError(null)
    setOpeningPrepTestId(prepTestId)
    try {
      const nextQuestion = await adminApi.getNextQuestionForPrepTest(prepTestId)
      navigate(`/admin/preptests/${prepTestId}/sections/${nextQuestion.sectionId}/questions/${nextQuestion.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open prep test")
    } finally {
      setOpeningPrepTestId(null)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] !text-black">PrepTests</h1>
        <button type="button" className="admin-btn admin-btn-primary">+ Import PrepTest</button>
      </div>
      <div>
        <p className="text-[13px] text-[var(--text3)]">All imported tests - click any row to open question editing</p>
      </div>
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      {loading && <p className="text-xs text-[var(--text3)]">Loading...</p>}
      <div className="table-wrap">
        <div className="table-header">
          <div className="table-title">All PrepTests</div>
          <input
            className="search-box"
            placeholder="Search module or title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`filter-pill ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => {
                setPage(0)
                setActiveFilter("all")
              }}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === "lr" ? "active" : ""}`}
              onClick={() => {
                setPage(0)
                setActiveFilter("lr")
              }}
            >
              LR
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === "rc" ? "active" : ""}`}
              onClick={() => {
                setPage(0)
                setActiveFilter("rc")
              }}
            >
              RC
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === "lg" ? "active" : ""}`}
              onClick={() => {
                setPage(0)
                setActiveFilter("lg")
              }}
            >
              LG
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === "missing-tags" ? "active" : ""}`}
              onClick={() => {
                setPage(0)
                setActiveFilter("missing-tags")
              }}
            >
              Missing tags
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface2)]">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">PrepTest</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">Date</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">Sections</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">Questions</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">Explanations</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">Tagged</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text3)]"></th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => {
              const sectionCount = getSectionCount(row)
              const questionCount = getQuestionCount(row, sectionCount)
              const explainedCount = Number(row.explained_count ?? 0)
              const taggedCount = Number(row.tagged_count ?? 0)
              const expPct = questionCount > 0 ? Math.max(0, Math.min(100, (explainedCount / questionCount) * 100)) : 0
              const tagPct = questionCount > 0 ? Math.max(0, Math.min(100, (taggedCount / questionCount) * 100)) : 0
              return (
                <tr
                  key={String(row.id)}
                  className="cursor-pointer border-b border-[var(--border)] hover:bg-[var(--surface2)]"
                  onClick={() => void openPrepTest(String(row.id))}
                >
                  <td className="px-3 py-2 text-[var(--text)]">
                    <span className="pt-number">{String(row.module_id ?? "-")}</span>
                  </td>
                  <td className="px-3 py-2 text-[var(--text2)]">{formatImportedDate(row.imported_at)}</td>
                  <td className="px-3 py-2 text-[var(--text2)]">{sectionCount || "-"}</td>
                  <td className="px-3 py-2 text-[var(--text2)]">{questionCount || "-"}</td>
                  <td className="px-3 py-2">
                    <div className="prog-wrap">
                      <div className="prog-bar"><div className={`prog-fill ${expPct >= 60 ? "green" : "amber"}`} style={{ width: `${expPct}%` }} /></div>
                      <span className="prog-label">{formatPercent(expPct)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="prog-wrap">
                      <div className="prog-bar"><div className="prog-fill green" style={{ width: `${tagPct}%` }} /></div>
                      <span className="prog-label">{formatPercent(tagPct)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost !px-3 !py-1.5 text-[11px]"
                      disabled={openingPrepTestId === String(row.id)}
                      onClick={(e) => {
                        e.stopPropagation()
                        void openPrepTest(String(row.id))
                      }}
                    >
                      {openingPrepTestId === String(row.id) ? "Opening..." : "Open →"}
                    </button>
                  </td>
                </tr>
              )
            })}
            {!loading && pagedRows.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-[var(--text3)]" colSpan={7}>
                  No tests on this page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="admin-btn admin-btn-ghost"
          disabled={page === 0 || loading}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </button>
        {pageItems.map((pageIdx) => (
          <button
            key={pageIdx}
            type="button"
            className={`admin-btn ${pageIdx === page ? "admin-btn-primary" : "admin-btn-ghost"}`}
            disabled={loading}
            onClick={() => setPage(pageIdx)}
          >
            {pageIdx + 1}
          </button>
        ))}
        <button
          type="button"
          className="admin-btn admin-btn-ghost"
          disabled={loading || page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </section>
  )
}

export { AdminPrepTestsPage }
