/** When true, subscribed students must complete LawHub linking before full app access. */
export function shouldRequireLsacLinkWall(): boolean {
  return Deno.env.get('LSAC_REQUIRE_LINK_WALL') === 'true'
}
