import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { useAdminApi } from "@/features/admin/use-admin-api"

function AdminUserDetailPage() {
  const adminApi = useAdminApi()
  const { userId } = useParams()
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [tests, setTests] = useState<Array<Record<string, unknown>>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminApi || !userId) return
    void adminApi
      .getUserDetail(userId)
      .then((data) => {
        setProfile((data.profile as Record<string, unknown> | null) ?? null)
        setTests((data.tests as Array<Record<string, unknown>>) ?? [])
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load user detail"))
  }, [adminApi, userId])

  return (
    <section className="space-y-4">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">User detail</h1>
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      <article className="admin-surface p-3">
        <p className="text-sm text-[var(--text)]">Email: {String(profile?.email ?? "unknown")}</p>
        <p className="text-sm text-[var(--text2)]">Role: {String(profile?.role ?? "student")}</p>
      </article>
      <article className="admin-surface p-3">
        <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">Test history</h2>
        <ul className="space-y-1">
          {tests.map((test) => (
            <li key={String(test.id)} className="rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1 text-sm text-[var(--text2)]">
              {String(test.test_id ?? test.test_instance_id ?? "-")} · completed {String(test.is_completed ?? false)}
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}

export { AdminUserDetailPage }
