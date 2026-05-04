import { useEffect, useMemo, useState } from "react"

import { type AdminQuestionType } from "@/lib/api/admin"
import { useAdminApi } from "@/features/admin/use-admin-api"

function AdminTaxonomyPage() {
  const adminApi = useAdminApi()
  const [rows, setRows] = useState<AdminQuestionType[]>([])
  const [newTag, setNewTag] = useState("")
  const [newSectionType, setNewSectionType] = useState<"LR" | "RC" | "LG">("LR")
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!adminApi) return
    const data = await adminApi.listQuestionTypes()
    setRows(data)
  }

  useEffect(() => {
    void refresh().catch((e) => setError(e instanceof Error ? e.message : "Failed to load taxonomy"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminApi])

  const grouped = useMemo(
    () => ({
      LR: rows.filter((row) => row.section_type === "LR"),
      LG: rows.filter((row) => row.section_type === "LG"),
      RC: rows.filter((row) => row.section_type === "RC"),
    }),
    [rows],
  )

  const isEmpty = rows.length === 0

  return (
    <section className="space-y-4">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] !text-black">Taxonomy</h1>
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      {isEmpty && (
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() =>
            void adminApi
              ?.seedDefaultQuestionTypes()
              .then(() => refresh())
              .catch((e) => setError(e instanceof Error ? e.message : "Failed to seed defaults"))
          }
        >
          Seed default types
        </button>
      )}

      <div className="admin-surface flex flex-wrap gap-2 p-3">
        <input
          className="admin-input min-w-[220px]"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="New question type"
        />
        <select
          className="admin-select"
          value={newSectionType}
          onChange={(e) => setNewSectionType(e.target.value as "LR" | "RC" | "LG")}
        >
          <option value="LR">LR</option>
          <option value="LG">LG</option>
          <option value="RC">RC</option>
        </select>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => {
            if (!newTag.trim()) return
            void adminApi
              ?.createQuestionType({ name: newTag.trim(), sectionType: newSectionType })
              .then(() => {
                setNewTag("")
                return refresh()
              })
              .catch((e) => setError(e instanceof Error ? e.message : "Failed to create type"))
          }}
        >
          Add Tag
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(["LR", "LG", "RC"] as const).map((sectionType) => (
          <article key={sectionType} className="admin-surface p-3">
            <h2 className="mb-2 text-sm font-semibold !text-black">{sectionType}</h2>
            <ul className="space-y-2">
              {grouped[sectionType].map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 rounded border border-[var(--border)] bg-[var(--surface2)] p-2">
                  <span className={row.is_active ? "text-sm text-[var(--text)]" : "text-sm text-[var(--text3)] line-through"}>
                    {row.name}
                  </span>
                  {row.is_active && (
                    <button
                      type="button"
                      className="rounded border border-[#3a1a1e] px-2 py-0.5 text-xs text-[var(--red)]"
                      onClick={() =>
                        void adminApi
                          ?.deactivateQuestionType(row.id)
                          .then(() => refresh())
                          .catch((e) => setError(e instanceof Error ? e.message : "Failed to deactivate type"))
                      }
                    >
                      Deactivate
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export { AdminTaxonomyPage }
