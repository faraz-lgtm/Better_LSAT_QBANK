import type { ZoomClient, ZoomMeetingRecordings } from '../_shared/zoom-client.ts'
import { parseZoomVttTranscript } from '../_shared/zoom-vtt.ts'
import type { TutoringRepository } from './tutoring.repository.ts'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function pickRecordingFiles(recordings: ZoomMeetingRecordings) {
  const files = recordings.recording_files ?? []
  const mp4 =
    files.find((f) => f.file_type === 'MP4' && f.status === 'completed') ??
    files.find((f) => f.file_type === 'MP4')
  const transcript =
    files.find((f) => f.file_type === 'TRANSCRIPT' && f.status === 'completed') ??
    files.find((f) => f.file_type === 'TRANSCRIPT')
  return { mp4, transcript }
}

export function createZoomWebhookService(deps: {
  repository: TutoringRepository
  zoom: ZoomClient
}) {
  const { repository, zoom } = deps

  return {
    async handleRecordingEvent(input: {
      event: string
      object: Record<string, unknown>
      downloadToken?: string | null
    }): Promise<{ ok: true; sessionId?: string }> {
      const meetingId =
        asString(input.object.id) ??
        (typeof input.object.id === 'number' ? String(input.object.id) : null)
      const meetingUuid = asString(input.object.uuid)
      const session = await repository.findSessionByZoomMeeting(meetingId, meetingUuid)
      if (!session) {
        console.info('zoom-webhook: no tutoring session for meeting', { meetingId, meetingUuid })
        return { ok: true }
      }

      await repository.updateArtifactStatuses(session.id, {
        zoom_meeting_id: meetingId ?? session.zoom_meeting_id,
        zoom_meeting_uuid: meetingUuid ?? session.zoom_meeting_uuid,
        recording_status: 'processing',
        transcript_status:
          input.event.includes('transcript') ? 'processing' : session.transcript_status,
        status: 'completed',
      })

      const token = input.downloadToken?.trim() || (await zoom.getAccessToken())
      let recordings: ZoomMeetingRecordings = {
        uuid: meetingUuid ?? undefined,
        id: meetingId ?? undefined,
        share_url: asString(input.object.share_url) ?? undefined,
        duration: typeof input.object.duration === 'number' ? input.object.duration : undefined,
        recording_files: Array.isArray(input.object.recording_files)
          ? (input.object.recording_files as ZoomMeetingRecordings['recording_files'])
          : undefined,
      }

      if (!recordings.recording_files?.length) {
        const key = meetingUuid || meetingId
        if (key) recordings = await zoom.getMeetingRecordings(key)
      }

      const { mp4, transcript } = pickRecordingFiles(recordings)
      const patch: {
        recording_storage_path?: string
        recording_content_type?: string
        duration_seconds?: number
        transcript_storage_path?: string
        transcript_json?: unknown
        zoom_share_url?: string
      } = {
        zoom_share_url: recordings.share_url ?? asString(input.object.share_url) ?? undefined,
        duration_seconds: recordings.duration ?? undefined,
      }

      if (mp4?.download_url) {
        const bytes = await zoom.downloadFile(mp4.download_url, token)
        const path = `${session.user_id}/${session.id}/recording.mp4`
        await repository.uploadSessionMedia(path, bytes, 'video/mp4')
        patch.recording_storage_path = path
        patch.recording_content_type = 'video/mp4'
        await repository.updateArtifactStatuses(session.id, { recording_status: 'ready' })
      }

      if (transcript?.download_url) {
        const bytes = await zoom.downloadFile(transcript.download_url, token)
        const vtt = new TextDecoder().decode(bytes)
        const lines = parseZoomVttTranscript(vtt)
        const path = `${session.user_id}/${session.id}/transcript.vtt`
        await repository.uploadSessionMedia(path, bytes, 'text/vtt')
        patch.transcript_storage_path = path
        patch.transcript_json = lines
        await repository.updateArtifactStatuses(session.id, { transcript_status: 'ready' })
      }

      await repository.upsertArtifacts(session.id, patch)
      return { ok: true, sessionId: session.id }
    },
  }
}
