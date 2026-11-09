export type ZoomEnv = {
  accountId: string
  clientId: string
  clientSecret: string
  webhookSecretToken: string | null
}

export function parseZoomEnv(
  getEnv: (key: string) => string | undefined = (k) => Deno.env.get(k),
): ZoomEnv | null {
  const accountId = getEnv('ZOOM_ACCOUNT_ID')?.trim() ?? ''
  const clientId = getEnv('ZOOM_CLIENT_ID')?.trim() ?? ''
  const clientSecret = getEnv('ZOOM_CLIENT_SECRET')?.trim() ?? ''
  if (!accountId || !clientId || !clientSecret) return null
  return {
    accountId,
    clientId,
    clientSecret,
    webhookSecretToken: getEnv('ZOOM_WEBHOOK_SECRET_TOKEN')?.trim() || null,
  }
}
