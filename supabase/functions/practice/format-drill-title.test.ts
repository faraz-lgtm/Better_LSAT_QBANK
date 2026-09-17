import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

import {
  formatDrillTitleFromTypeNames,
  formatPickMyOwnDrillTitle,
  PICK_MY_OWN_DRILL_TITLE,
  resolveDrillDisplayTitle,
  VARIED_MIX_DRILL_TITLE,
} from './format-drill-title.ts'

Deno.test('formatDrillTitleFromTypeNames returns Varied Mix for empty or >3 types', () => {
  assertEquals(formatDrillTitleFromTypeNames([]), VARIED_MIX_DRILL_TITLE)
  assertEquals(formatDrillTitleFromTypeNames(['A', 'B', 'C', 'D']), VARIED_MIX_DRILL_TITLE)
})

Deno.test('formatDrillTitleFromTypeNames names 1–3 types with Drill suffix', () => {
  assertEquals(formatDrillTitleFromTypeNames(['Flaw']), 'Flaw Drill')
  assertEquals(formatDrillTitleFromTypeNames(['Flaw', 'Assumption']), 'Flaw, Assumption Drill')
  assertEquals(
    formatDrillTitleFromTypeNames(['Flaw', 'Assumption', 'Strengthen']),
    'Flaw, Assumption, Strengthen Drill',
  )
})

Deno.test('resolveDrillDisplayTitle uses Pick My Own for manual Varied Mix', () => {
  assertEquals(
    resolveDrillDisplayTitle({ title: VARIED_MIX_DRILL_TITLE, selection: 'manual' }),
    PICK_MY_OWN_DRILL_TITLE,
  )
})

Deno.test('formatPickMyOwnDrillTitle matches product heading', () => {
  assertEquals(
    formatPickMyOwnDrillTitle({ questionCount: 5, prepTestNumbers: [159, 157, 158] }),
    '5 Questions from PT 157, 158 and 159',
  )
})
