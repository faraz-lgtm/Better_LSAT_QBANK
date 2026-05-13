import { useEffect, useState } from "react"

import { allowsPrepTestUnauthenticatedPreview } from "@/lib/dev/prep-test-ui-preview"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/**
 * Shown on PrepTest practice pages when preview mode is on and there is no auth session.
 */
function PrepTestPreviewNotice() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!allowsPrepTestUnauthenticatedPreview()) return
    let alive = true
    try {
      const supabase = getSupabaseBrowserClient()
      void supabase.auth.getSession().then(({ data }) => {
        if (!alive) return
        setShow(!data.session)
      })
    } catch {
      setShow(false)
    }
    return () => {
      alive = false
    }
  }, [])

  if (!show) return null

  return (
    <div
      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
      role="status"
    >
      <strong className="font-semibold">PrepTest UI preview.</strong> This screen is available without signing in
      because you are running a dev emulator build or set{" "}
      <code className="rounded bg-white/90 px-1.5 py-0.5 text-xs">VITE_STUDENT_UI_PREVIEW=1</code>. The rest of the
      student app still requires login.
    </div>
  )
}

export { PrepTestPreviewNotice }
