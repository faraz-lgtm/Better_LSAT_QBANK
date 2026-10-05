import { CORS_EDGE_NARROW, json, optionsOk } from '../_shared/edge-http.ts'
import { createServiceRoleClient } from '../users/users.repository.ts'

const cors = CORS_EDGE_NARROW

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  if (!email || !email.includes('@') || email.length > 320) return null
  return email
}

async function emailExistsInProfiles(email: string): Promise<boolean> {
  const client = createServiceRoleClient()
  const { data, error } = await client.from('profiles').select('id').ilike('email', email).limit(1).maybeSingle()
  if (error) throw error
  return Boolean(data?.id)
}

/** Public signup helper: returns whether an account already exists for the email. */
export async function handleAuthCheckEmail(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsOk(cors)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, cors)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 }, cors)
  }

  const email = normalizeEmail((body as { email?: unknown })?.email)
  if (!email) {
    return json({ error: 'A valid email is required' }, { status: 400 }, cors)
  }

  try {
    const exists = await emailExistsInProfiles(email)
    return json({ exists }, {}, cors)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to check email'
    return json({ error: message }, { status: 500 }, cors)
  }
}

Deno.serve(handleAuthCheckEmail)
