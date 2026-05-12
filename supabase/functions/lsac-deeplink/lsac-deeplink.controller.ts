import { createClient } from 'npm:@supabase/supabase-js@2'
import { parseLawHubEnv } from '../_shared/lawhub-env.ts'
import {
  createServiceRoleClient,
  createUsersRepository,
} from '../users/users.repository.ts'
import { createLsacDeeplinkService } from './lsac-deeplink.service.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

export async function handleLsacDeeplinkRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) {
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
    const testId = body.testId
    const sectionId = body.sectionId
    const itemId = body.itemId
    if (typeof testId !== 'string') {
      return json({ error: 'testId is required' }, { status: 400 })
    }

    const repo = createUsersRepository(createServiceRoleClient())
    const service = createLsacDeeplinkService({
      getLawHubBaseUrl: () => Deno.env.get('LSAC_DEEPLINK_BASE_URL') ?? 'https://lawhub.org',
      getVendorId: () => env.LSAC_VENDOR_ID,
      getProfileById: repo.getProfileById,
    })

    const deepLinkUrl = await service.createUrl({
      userId: user.id,
      testId,
      sectionId: typeof sectionId === 'string' ? sectionId : undefined,
      itemId: typeof itemId === 'string' ? itemId : undefined,
    })
    return json({ url: deepLinkUrl })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error'
    console.error(e)
    return json({ error: message }, { status: 500 })
  }
}
