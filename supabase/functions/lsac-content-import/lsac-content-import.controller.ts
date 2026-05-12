import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  createServiceRoleClient,
} from '../users/users.repository.ts'
import { createLsacContentImportRepository } from './lsac-content-import.repository.ts'
import { createLsacContentImportService } from './lsac-content-import.service.ts'

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

export async function handleLsacContentImportRequest(
  req: Request,
): Promise<Response> {
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
    const body = await req.json()
    const repo = createLsacContentImportRepository(createServiceRoleClient())
    const service = createLsacContentImportService({ repository: repo })
    const result = await service.importPayload(body)
    return json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error'
    console.error(e)
    return json({ error: message }, { status: 500 })
  }
}
