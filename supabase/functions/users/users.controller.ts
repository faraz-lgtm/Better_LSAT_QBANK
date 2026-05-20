import { CORS_EDGE_NARROW, json, requireAuthUser } from '../_shared/edge-http.ts'
import { createUsersRepository, createServiceRoleClient } from './users.repository.ts'
import { AuthorizationError, createUsersService } from './users.service.ts'

const corsHeaders = CORS_EDGE_NARROW

export async function handleUsersRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const auth = await requireAuthUser(req, corsHeaders)
  if (!auth.ok) return auth.response

  const repo = createUsersRepository(createServiceRoleClient())
  const service = createUsersService({ repository: repo })

  try {
    if (req.method === 'GET') {
      const profile = await service.getProfile(auth.user.id)
      const entitlement = await service.getEntitlementState(auth.user.id)
      return json({ profile, entitlement }, {}, corsHeaders)
    }

    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const action = typeof body.action === 'string' ? body.action : ''

      if (action === 'users-complete-first-login') {
        const profile = await service.markFirstTimeLoginComplete(auth.user.id)
        return json({ profile }, {}, corsHeaders)
      }

      return json(
        { error: action ? `Unknown action: ${action}` : 'Missing action in request body' },
        { status: 400 },
        corsHeaders,
      )
    }

    return json({ error: 'Method not allowed' }, { status: 405 }, corsHeaders)
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return json({ error: e.message }, { status: 403 }, corsHeaders)
    }
    const message = e instanceof Error ? e.message : 'Internal error'
    console.error(e)
    return json({ error: message }, { status: 500 }, corsHeaders)
  }
}
