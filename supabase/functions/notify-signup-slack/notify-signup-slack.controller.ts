import {
  authorizeSignupWebhook,
  notifySlackSignup,
  parseAuthUsersSignupInsert,
} from '../_shared/slack-signup.ts'
import { json } from '../_shared/edge-http.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-signup-webhook-secret',
}

export type NotifySignupSlackDeps = {
  authorize?: (req: Request) => boolean
  notify?: typeof notifySlackSignup
  getEnv?: (key: string) => string | undefined
}

/**
 * Database Webhook target for auth.users INSERT → Slack #lsat-platform-signups.
 * Auth: SIGNUP_WEBHOOK_SECRET via x-signup-webhook-secret or Authorization: Bearer.
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

  const parsed = parseAuthUsersSignupInsert(body)
  if (!parsed) {
    // Non-matching events (or malformed) — acknowledge so pg_net does not retry forever.
    return json({ received: true, notified: false, reason: 'ignored' }, { status: 200 }, corsHeaders)
  }

  const notify = deps.notify ?? notifySlackSignup
  const notified = await notify({
    email: parsed.email,
    userId: parsed.userId,
    provider: parsed.provider,
    createdAt: parsed.createdAt ?? undefined,
    getEnv,
  })

  return json({ received: true, notified }, { status: 200 }, corsHeaders)
}
