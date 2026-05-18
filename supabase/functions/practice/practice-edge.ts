import { CORS_EDGE_NARROW, json } from '../_shared/edge-http.ts'
import { PracticeForbiddenError, PracticeValidationError } from './practice.service.ts'

export function practiceErrorResponse(e: unknown): Response {
  if (e instanceof PracticeValidationError) {
    return json({ error: e.message }, { status: 400 }, CORS_EDGE_NARROW)
  }
  if (e instanceof PracticeForbiddenError) {
    return json({ error: e.message }, { status: 403 }, CORS_EDGE_NARROW)
  }
  console.error('practice error', e)
  return json({ error: 'Internal server error' }, { status: 500 }, CORS_EDGE_NARROW)
}
