export type MailerLiteSignupNotifyInput = {
  email: string
  fetchImpl?: typeof fetch
  getEnv?: (key: string) => string | undefined
}

const MAILERLITE_SUBSCRIBERS_URL = 'https://connect.mailerlite.com/api/subscribers'

/** Upserts a signup email into MailerLite and assigns the Users group. Never throws. */
export async function notifyMailerLiteSignup(input: MailerLiteSignupNotifyInput): Promise<boolean> {
  const getEnv = input.getEnv ?? ((key: string) => Deno.env.get(key) ?? undefined)
  const apiToken = getEnv('MAILERLITE_API_TOKEN')?.trim()
  const groupId = getEnv('MAILERLITE_USERS_GROUP_ID')?.trim()
  const email = input.email.trim()
  if (!apiToken || !groupId || !email) return false

  const fetchImpl = input.fetchImpl ?? fetch
  try {
    const response = await fetchImpl(MAILERLITE_SUBSCRIBERS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        groups: [groupId],
      }),
    })
    return response.ok
  } catch (error) {
    console.warn('MailerLite signup notify failed:', error)
    return false
  }
}
