/** Human-readable message for Stripe, PostgREST, and other non-Error throws. */
export function formatUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>
    const message = typeof record.message === 'string' ? record.message.trim() : ''
    const details = typeof record.details === 'string' ? record.details.trim() : ''
    const hint = typeof record.hint === 'string' ? record.hint.trim() : ''
    const code = typeof record.code === 'string' ? record.code.trim() : ''

    const parts = [message, details, hint].filter((part) => part.length > 0)
    if (parts.length > 0) {
      return code ? `${parts.join(' — ')} (${code})` : parts.join(' — ')
    }

    if (typeof record.error === 'string' && record.error.trim()) {
      return record.error.trim()
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}
