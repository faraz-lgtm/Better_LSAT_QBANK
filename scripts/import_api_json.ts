import { createServiceRoleClient } from "../supabase/functions/users/users.repository.ts"
import { createLsacContentImportRepository } from "../supabase/functions/lsac-content-import/lsac-content-import.repository.ts"
import { createLsacContentImportService } from "../supabase/functions/lsac-content-import/lsac-content-import.service.ts"
import { createAdminRepository } from "../supabase/functions/admin/admin.repository.ts"

async function main() {
  const apiJsonDir = new URL("../api_json_new_batch/", import.meta.url)
  const files: string[] = []

  for await (const entry of Deno.readDir(apiJsonDir)) {
    if (!entry.isFile || !entry.name.endsWith(".json")) continue
    files.push(entry.name)
  }
  files.sort((a, b) => a.localeCompare(b))

  if (files.length === 0) {
    console.log("No JSON files found in api_json/")
    return
  }

  const repo = createLsacContentImportRepository(createServiceRoleClient())
  const service = createLsacContentImportService({ repository: repo })

  let imported = 0
  let sections = 0
  let items = 0
  const importedModuleIds: string[] = []

  for (const file of files) {
    const path = new URL(`../api_json_new_batch/${file}`, import.meta.url)
    const raw = await Deno.readTextFile(path)
    const payload = JSON.parse(raw) as unknown
    const result = await service.importPayload({ ...(payload as Record<string, unknown>), sourceFilename: file })
    imported += result.imported
    for (const mod of result.modules) {
      sections += mod.sections
      items += mod.items
      importedModuleIds.push(mod.moduleId)
    }
    console.log(`Imported ${file}`)
  }

  // Project only the files just imported. A full-catalog projection rewrites every PrepTest.
  console.log(`Projecting ${importedModuleIds.join(", ")} into admin_prep_tests...`)
  const adminRepo = createAdminRepository(createServiceRoleClient())
  await adminRepo.ensureAdminProjectionFromLsac(importedModuleIds)

  console.log(`Done. Imported modules=${imported}, sections=${sections}, items=${items}`)
}

if (import.meta.main) {
  await main()
}
