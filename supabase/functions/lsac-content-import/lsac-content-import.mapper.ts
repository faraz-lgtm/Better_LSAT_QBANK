export type LsacContentModuleRow = {
  module_id: string
  module_name: string | null
  module_type: string | null
  description: string | null
  admin_date: string | null
  vendor_name: string | null
  source_filename: string | null
  raw_payload: Record<string, unknown>
}

export type LsacContentSectionRow = {
  module_id: string
  section_id: string
  section_order: number | null
  section_name: string | null
  directions: string | null
  has_grouped_items: boolean | null
  item_count: number | null
  raw_payload: Record<string, unknown>
}

export type LsacContentItemRow = {
  module_id: string
  section_id: string
  item_id: string
  item_position: number | null
  group_id: string | null
  stem_text: string | null
  stimulus_text: string | null
  correct_answer: string | null
  options: unknown[] | null
  raw_payload: Record<string, unknown>
}

export type ParsedModuleContent = {
  module: LsacContentModuleRow
  sections: LsacContentSectionRow[]
  items: LsacContentItemRow[]
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function asBool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

export function parseLsacContentModule(
  input: unknown,
  sourceFilename?: string,
): ParsedModuleContent {
  if (!input || typeof input !== 'object') {
    throw new Error('Module payload must be a JSON object')
  }
  const data = input as Record<string, unknown>
  const moduleId = asString(data.moduleId)?.trim()
  if (!moduleId) throw new Error('moduleId is required')

  const sectionsRaw = Array.isArray(data.sections) ? data.sections : null
  if (!sectionsRaw) throw new Error('sections must be an array')

  const sections: LsacContentSectionRow[] = []
  const items: LsacContentItemRow[] = []
  for (const sectionUnknown of sectionsRaw) {
    if (!sectionUnknown || typeof sectionUnknown !== 'object') continue
    const section = sectionUnknown as Record<string, unknown>
    const sectionId = asString(section.sectionId)?.trim()
    if (!sectionId) continue

    const itemArray = Array.isArray(section.items) ? section.items : []
    sections.push({
      module_id: moduleId,
      section_id: sectionId,
      section_order: asNumber(section.sectionOrder),
      section_name: asString(section.sectionName),
      directions: asString(section.directions),
      has_grouped_items: asBool(section.hasGroupedItems),
      item_count: itemArray.length,
      raw_payload: section,
    })

    for (const itemUnknown of itemArray) {
      if (!itemUnknown || typeof itemUnknown !== 'object') continue
      const item = itemUnknown as Record<string, unknown>
      const itemId = asString(item.itemId)?.trim()
      if (!itemId) continue
      items.push({
        module_id: moduleId,
        section_id: sectionId,
        item_id: itemId,
        item_position: asNumber(item.itemPosition),
        group_id: asString(item.groupId),
        stem_text: asString(item.stemText),
        stimulus_text: asString(item.stimulusText),
        correct_answer: asString(item.correctAnswer),
        options: Array.isArray(item.options) ? item.options : null,
        raw_payload: item,
      })
    }
  }

  return {
    module: {
      module_id: moduleId,
      module_name: asString(data.moduleName),
      module_type: asString(data.moduleType),
      description: asString(data.description),
      admin_date: asString(data.adminDate),
      vendor_name: asString(data.vendorName),
      source_filename: sourceFilename ?? null,
      raw_payload: data,
    },
    sections,
    items,
  }
}
