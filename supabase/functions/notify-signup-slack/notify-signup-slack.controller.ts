import {
  authorizeSignupWebhook,
  parseAuthUsersConfirmedSignup,
} from '../_shared/slack-signup.ts'
import { json } from '../_shared/edge-http.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-signup-webhook-secret',
}

export type NotifySignupSlackDeps = {
  authorize?: (req: Request) => boolean
  getEnv?: (key: string) => string | undefined
}

/**
 * Database Webhook target for auth.users INSERT/UPDATE.
 * Slack notify moved to users.trackSignupConversion (has UTMs / intent / country).
 * Handler remains for webhook health checks and to avoid broken webhook configs.
 */
export async function handleNotifySignupSlack(
  req: Request,
  deps: NotifySignupSlackDeps = {},
): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, corsHeaders)
  }

  const getEnv = deps.getEnv ?? ((key: string) => Deno.env.get(key) ?? undefined)
  const authorize =
    deps.authorize ?? ((request: Request) => authorizeSignupWebhook(request, getEnv))
  if (!authorize(req)) {
    return json({ error: 'Unauthorized' }, { status: 401 }, corsHeaders)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 }, corsHeaders)
  }

  const parsed = parseAuthUsersConfirmedSignup(body)
  if (!parsed) {
    return json({ received: true, notified: false, reason: 'ignored' }, { status: 200 }, corsHeaders)
  }

  return json(
    { received: true, notified: false, reason: 'moved_to_conversion' },
    { status: 200 },
    corsHeaders,
  )
}
