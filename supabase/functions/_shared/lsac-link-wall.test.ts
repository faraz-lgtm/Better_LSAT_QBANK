import { assertEquals } from 'jsr:@std/assert@1'
import { shouldRequireLsacLinkWall } from './lsac-link-wall.ts'

Deno.test('shouldRequireLsacLinkWall is false by default', () => {
  const previous = Deno.env.get('LSAC_REQUIRE_LINK_WALL')
  Deno.env.delete('LSAC_REQUIRE_LINK_WALL')
  try {
    assertEquals(shouldRequireLsacLinkWall(), false)
  } finally {
    if (previous === undefined) Deno.env.delete('LSAC_REQUIRE_LINK_WALL')
    else Deno.env.set('LSAC_REQUIRE_LINK_WALL', previous)
  }
})

Deno.test('shouldRequireLsacLinkWall is true when LSAC_REQUIRE_LINK_WALL=true', () => {
  const previous = Deno.env.get('LSAC_REQUIRE_LINK_WALL')
  Deno.env.set('LSAC_REQUIRE_LINK_WALL', 'true')
  try {
    assertEquals(shouldRequireLsacLinkWall(), true)
  } finally {
    if (previous === undefined) Deno.env.delete('LSAC_REQUIRE_LINK_WALL')
    else Deno.env.set('LSAC_REQUIRE_LINK_WALL', previous)
  }
})
