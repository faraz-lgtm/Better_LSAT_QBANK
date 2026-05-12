import {
  createLawHubClient,
} from '../_shared/lawhub-client.ts'
import { parseLawHubEnv } from '../_shared/lawhub-env.ts'
import {
  createServiceRoleClient,
} from '../users/users.repository.ts'
import { createLsacSyncRepository } from './lsac-sync.repository.ts'
import { createLsacSyncService } from './lsac-sync.service.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lsac-sync-key',
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...init.headers,
    },
  })
}

function requireSyncKey(req: Request): boolean {
  const expected = Deno.env.get('LSAC_SYNC_KEY')
  if (!expected) return false
  const provided = req.headers.get('x-lsac-sync-key')
  return provided === expected
}

export async function handleLsacSyncRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 })
  }

  if (!requireSyncKey(req)) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const env = parseLawHubEnv(Deno.env.toObject())
    if (!env) {
      return json(
        {
          error:
            'LawHub is not configured on the server (missing LSAC_* environment variables)',
        },
        { status: 503 },
      )
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const includeInstances = body.includeInstances === true
    const client = createLawHubClient({ getEnv: () => env })
    const repo = createLsacSyncRepository(createServiceRoleClient())
    const service = createLsacSyncService({
      lawHub: client,
      repository: repo,
    })

    const result = await service.run({ includeInstances })
    return json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error'
    console.error(e)
    return json({ error: message }, { status: 500 })
  }
}
