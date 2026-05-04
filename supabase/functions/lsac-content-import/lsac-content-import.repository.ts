import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type {
  LsacContentItemRow,
  LsacContentModuleRow,
  LsacContentSectionRow,
} from './lsac-content-import.mapper.ts'

export function createLsacContentImportRepository(client: SupabaseClient) {
  return {
    async upsertModule(row: LsacContentModuleRow): Promise<void> {
      const { error } = await client.from('lsac_content_modules').upsert(row, {
        onConflict: 'module_id',
      })
      if (error) throw error
    },

    async upsertSections(rows: LsacContentSectionRow[]): Promise<void> {
      if (rows.length === 0) return
      const { error } = await client.from('lsac_content_sections').upsert(rows, {
        onConflict: 'module_id,section_id',
      })
      if (error) throw error
    },

    async upsertItems(rows: LsacContentItemRow[]): Promise<void> {
      if (rows.length === 0) return
      const { error } = await client.from('lsac_content_items').upsert(rows, {
        onConflict: 'module_id,section_id,item_id',
      })
      if (error) throw error
    },
  }
}

export type LsacContentImportRepository = ReturnType<
  typeof createLsacContentImportRepository
>
