import { useMemo } from "react"

import { createAdminApi } from "@/lib/api/admin"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function useAdminApi() {
  return useMemo(() => createAdminApi(getSupabaseBrowserClient()), [])
}

export { useAdminApi }
