import { CORS_EDGE_NARROW, json, optionsOk, requireAuthUser } from '../_shared/edge-http.ts'
import { createPracticeRepository, createServiceRoleClient } from '../practice/practice.repository.ts'
import { createPracticeService } from '../practice/practice.service.ts'
import { practiceErrorResponse } from '../practice/practice-edge.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsOk()
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 }, CORS_EDGE_NARROW)

  const [auth, body] = await Promise.all([
    requireAuthUser(req),
    req.json().catch(() => ({})) as Promise<Record<string, unknown>>,
  ])
  if (!auth.ok) return auth.response

  const service = createPracticeService({
    repository: createPracticeRepository(createServiceRoleClient()),
  })

  try {
    const out = await service.getSectionSession(auth.user.id, body)
    return json(out, {}, CORS_EDGE_NARROW)
  } catch (e) {
    return practiceErrorResponse(e)
  }
})
