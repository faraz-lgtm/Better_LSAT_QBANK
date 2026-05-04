import { parseLsacContentModule } from './lsac-content-import.mapper.ts'
import type { LsacContentImportRepository } from './lsac-content-import.repository.ts'

export type LsacContentImportServiceDeps = {
  repository: LsacContentImportRepository
}

export function createLsacContentImportService(deps: LsacContentImportServiceDeps) {
  async function importOne(
    payload: unknown,
    sourceFilename?: string,
  ): Promise<{ moduleId: string; sections: number; items: number }> {
    const parsed = parseLsacContentModule(payload, sourceFilename)
    await deps.repository.upsertModule(parsed.module)
    await deps.repository.upsertSections(parsed.sections)
    await deps.repository.upsertItems(parsed.items)
    return {
      moduleId: parsed.module.module_id,
      sections: parsed.sections.length,
      items: parsed.items.length,
    }
  }

  return {
    async importPayload(body: unknown): Promise<{
      imported: number
      modules: { moduleId: string; sections: number; items: number }[]
    }> {
      if (!body || typeof body !== 'object') {
        throw new Error('Request body must be a JSON object')
      }
      const data = body as Record<string, unknown>
      const modulesInput =
        Array.isArray(data.modules) && data.modules.length > 0
          ? data.modules
          : [data]
      const sourceFilename =
        typeof data.sourceFilename === 'string' ? data.sourceFilename : undefined

      const modules = []
      for (const modulePayload of modulesInput) {
        const out = await importOne(modulePayload, sourceFilename)
        modules.push(out)
      }
      return {
        imported: modules.length,
        modules,
      }
    },
  }
}

export type LsacContentImportService = ReturnType<
  typeof createLsacContentImportService
>
