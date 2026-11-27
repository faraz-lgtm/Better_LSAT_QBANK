import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { endImpersonation, getImpersonationMeta } from "@/lib/auth/impersonation"

function ImpersonationBanner() {
  const navigate = useNavigate()
  const [meta] = useState(() => getImpersonationMeta())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!meta) return null

  async function onExit() {
    setBusy(true)
    setError(null)
    try {
      await endImpersonation((to) => navigate(to, { replace: true }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to exit student view")
      setBusy(false)
    }
  }

  return (
    <div
      className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950"
      role="status"
    >
      <p>
        Viewing as <span className="font-semibold">{meta.studentFullName}</span>
        <span className="text-amber-800"> ({meta.studentEmail})</span>
        {error ? <span className="ml-2 text-red-700">{error}</span> : null}
      </p>
      <button
        type="button"
        className="rounded-md border border-amber-400 bg-white px-3 py-1 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-60"
        disabled={busy}
        onClick={() => void onExit()}
      >
        {busy ? "Exiting…" : "Exit student view"}
      </button>
    </div>
  )
}

export { ImpersonationBanner }
