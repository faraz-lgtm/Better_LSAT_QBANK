import { useEffect, useState } from "react"

import { useAdminApi } from "@/features/admin/use-admin-api"

type UserRow = {
  id: string
  email: string | null
  full_name: string | null
  role: "student" | "admin"
  created_at: string
  test_count?: number
}

function AdminUsersPage() {
  const adminApi = useAdminApi()
  const [users, setUsers] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "student" as "student" | "admin",
  })

  async function loadUsers() {
    if (!adminApi) return
    setIsLoading(true)
    setError(null)
    try {
      const rows = (await adminApi.listUsers(200)) as UserRow[]
      setUsers(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminApi])

  async function createUser() {
    if (!adminApi) return
    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required")
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await adminApi.createUser({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim() || undefined,
        role: form.role,
      })
      setForm({
        email: "",
        fullName: "",
        password: "",
        role: "student",
      })
      await loadUsers()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create user")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="admin-typo-h1">Users</h1>
        <p className="admin-typo-subtitle mt-1">Manage platform users and admin access.</p>
      </div>
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      <div className="admin-surface p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">Add user</div>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="admin-input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="Full name (optional)"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <input
            className="admin-input"
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <select
            className="admin-select"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as "student" | "admin" }))}
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" className="admin-btn admin-btn-primary" disabled={isSaving} onClick={() => void createUser()}>
            {isSaving ? "Creating..." : "Create user"}
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <div className="table-title">All users</div>
        </div>
        <div className="p-4">
          {isLoading ? (
            <p className="text-xs text-[var(--text3)]">Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--text3)]">
                    <th className="py-2">Email</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Tests</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[var(--border)]">
                      <td className="py-2 text-[var(--text)]">{user.email ?? "-"}</td>
                      <td className="py-2 text-[var(--text2)]">{user.full_name ?? "-"}</td>
                      <td className="py-2 text-[var(--text2)]">{user.role}</td>
                      <td className="py-2 text-[var(--text2)]">{user.test_count ?? 0}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td className="py-3 text-[var(--text3)]" colSpan={4}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export { AdminUsersPage }
