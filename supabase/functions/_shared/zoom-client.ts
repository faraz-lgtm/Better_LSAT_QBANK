import type { ZoomEnv } from './zoom-env.ts'

export type ZoomRecordingFile = {
  id?: string
  file_type?: string
  file_extension?: string
  download_url?: string
  play_url?: string
  recording_type?: string
  file_size?: number
  status?: string
}

export type ZoomMeetingRecordings = {
  uuid?: string
  id?: number | string
  share_url?: string
  duration?: number
  recording_files?: ZoomRecordingFile[]
  download_token?: string
}

/** Zoom AI Companion meeting summary (same content as the emailed summary). */
export type ZoomMeetingSummary = Record<string, unknown>

export type ZoomClient = {
  getAccessToken: () => Promise<string>
  getMeetingRecordings: (meetingIdOrUuid: string) => Promise<ZoomMeetingRecordings>
  getMeetingSummary: (meetingIdOrUuid: string) => Promise<ZoomMeetingSummary>
  downloadFile: (downloadUrl: string, bearerToken: string) => Promise<Uint8Array>
}

type TokenCache = { accessToken: string; expiresAtMs: number }

export function createZoomClient(deps: {
  env: ZoomEnv
  fetchFn?: typeof fetch
}): ZoomClient {
  const fetchFn = deps.fetchFn ?? fetch
  const { env } = deps
  let cache: TokenCache | null = null

  async function getAccessToken(): Promise<string> {
    const now = Date.now()
    if (cache && cache.expiresAtMs > now + 60_000) return cache.accessToken

    const basic = btoa(`${env.clientId}:${env.clientSecret}`)
    const body = new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: env.accountId,
    })
    const res = await fetchFn('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const message =
        typeof json?.reason === 'string'
          ? json.reason
          : typeof json?.error === 'string'
            ? json.error
            : `Zoom token request failed (${res.status})`
      throw new Error(message)
    }
    const accessToken = typeof json.access_token === 'string' ? json.access_token : ''
    const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600
    if (!accessToken) throw new Error('Zoom token response missing access_token')
    cache = { accessToken, expiresAtMs: now + expiresIn * 1000 }
    return accessToken
  }

  return {
    getAccessToken,

    async getMeetingRecordings(meetingIdOrUuid) {
      const token = await getAccessToken()
      const encoded = encodeURIComponent(meetingIdOrUuid)
      const res = await fetchFn(`https://api.zoom.us/v2/meetings/${encoded}/recordings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message =
          typeof json?.message === 'string'
            ? json.message
            : `Zoom recordings request failed (${res.status})`
        throw new Error(message)
      }
      return json as ZoomMeetingRecordings
    },

    async getMeetingSummary(meetingIdOrUuid) {
      const token = await getAccessToken()
      // Zoom requires double-encoding when UUID contains / or //.
      const needsDoubleEncode = meetingIdOrUuid.includes('/')
      const encoded = needsDoubleEncode
        ? encodeURIComponent(encodeURIComponent(meetingIdOrUuid))
        : encodeURIComponent(meetingIdOrUuid)
      const res = await fetchFn(`https://api.zoom.us/v2/meetings/${encoded}/meeting_summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message =
          typeof json?.message === 'string'
            ? json.message
            : `Zoom meeting summary request failed (${res.status})`
        throw new Error(message)
      }
      return json as ZoomMeetingSummary
    },

    async downloadFile(downloadUrl, bearerToken) {
      const res = await fetchFn(downloadUrl, {
        headers: { Authorization: `Bearer ${bearerToken}` },
        redirect: 'follow',
      })
      if (!res.ok) {
        throw new Error(`Zoom file download failed (${res.status})`)
      }
      return new Uint8Array(await res.arrayBuffer())
    },
  }
}
