import type { ZoomClient, ZoomMeetingRecordings, ZoomRecordingFile } from '../_shared/zoom-client.ts'
import { normalizeZoomMeetingSummary } from '../_shared/zoom-meeting-summary.ts'
import { parseZoomVttTranscript } from '../_shared/zoom-vtt.ts'
import type { TutoringRepository } from './tutoring.repository.ts'

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

const MP4_TYPE_PRIORITY: Record<string, number> = {
  shared_screen_with_speaker_view: 0,
  active_speaker: 1,
  shared_screen: 2,
  shared_screen_with_gallery_view: 3,
  gallery_view: 4,
}

/** Prefer completed MP4s; try smaller / higher-priority views first so Storage limits are less likely. */
export function pickRecordingFiles(recordings: ZoomMeetingRecordings) {
  const files = recordings.recording_files ?? []
  const mp4s = files
    .filter((f) => (f.file_type ?? '').toUpperCase() === 'MP4')
    .slice()
    .sort((a, b) => {
      const aDone = a.status === 'completed' ? 0 : 1
      const bDone = b.status === 'completed' ? 0 : 1
      if (aDone !== bDone) return aDone - bDone
      const aSize = typeof a.file_size === 'number' ? a.file_size : Number.POSITIVE_INFINITY
      const bSize = typeof b.file_size === 'number' ? b.file_size : Number.POSITIVE_INFINITY
      if (aSize !== bSize) return aSize - bSize
      const aPri = MP4_TYPE_PRIORITY[a.recording_type ?? ''] ?? 50
      const bPri = MP4_TYPE_PRIORITY[b.recording_type ?? ''] ?? 50
      return aPri - bPri
    })
  const transcript =
    files.find((f) => f.file_type === 'TRANSCRIPT' && f.status === 'completed') ??
    files.find((f) => f.file_type === 'TRANSCRIPT')
  return { mp4Candidates: mp4s, transcript }
}

function isEntityTooLarge(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /entitytoolarge|payload too large|exceeded the maximum allowed size/i.test(message)
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

      const { mp4Candidates, transcript } = pickRecordingFiles(recordings)
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

      let recordingReady = false
      let lastUploadError: unknown = null
      for (const mp4 of mp4Candidates) {
        if (!mp4.download_url) continue
        try {
          const bytes = await zoom.downloadFile(mp4.download_url, token)
          const path = `${session.user_id}/${session.id}/recording.mp4`
          await repository.uploadSessionMedia(path, bytes, 'video/mp4')
          patch.recording_storage_path = path
          patch.recording_content_type = 'video/mp4'
          await repository.updateArtifactStatuses(session.id, { recording_status: 'ready' })
          recordingReady = true
          break
        } catch (error) {
          lastUploadError = error
          console.warn('zoom-webhook: recording upload failed', {
            sessionId: session.id,
            recordingType: mp4.recording_type,
            fileSize: mp4.file_size,
            error: error instanceof Error ? error.message : String(error),
          })
          if (!isEntityTooLarge(error)) {
            // Non-size failures: stop trying other candidates.
            break
          }
        }
      }

      if (!recordingReady && mp4Candidates.length > 0) {
        await repository.updateArtifactStatuses(session.id, { recording_status: 'failed' })
        console.error('zoom-webhook: all MP4 uploads failed', {
          sessionId: session.id,
          candidates: mp4Candidates.length,
          error: lastUploadError instanceof Error ? lastUploadError.message : String(lastUploadError),
        })
      } else if (!recordingReady && mp4Candidates.length === 0) {
        // No MP4 in Zoom payload — leave status as processing only if transcript event; else fail softly.
        if (!input.event.includes('transcript')) {
          await repository.updateArtifactStatuses(session.id, { recording_status: 'failed' })
        }
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

    async applySummaryToSession(input: {
      session: { id: string; user_id: string; zoom_meeting_id: string | null; zoom_meeting_uuid: string | null }
      summaryPayload: Record<string, unknown>
      meetingId?: string | null
      meetingUuid?: string | null
    }): Promise<{ todosCreated: number; takeaways: string[]; nextSteps: string[] }> {
      const { takeaways, nextSteps } = normalizeZoomMeetingSummary(input.summaryPayload)
      // Avoid persisting empty stubs (e.g. meeting id only) so later backfills can retry.
      if (takeaways.length > 0 || nextSteps.length > 0) {
        await repository.upsertArtifacts(input.session.id, {
          summary_json: input.summaryPayload,
          takeaways,
        })
      }

      const meetingId = input.meetingId ?? null
      const meetingUuid = input.meetingUuid ?? null
      if (meetingId || meetingUuid) {
        await repository.updateArtifactStatuses(input.session.id, {
          zoom_meeting_id: meetingId ?? input.session.zoom_meeting_id,
          zoom_meeting_uuid: meetingUuid ?? input.session.zoom_meeting_uuid,
        })
      }

      const inserted = await repository.upsertZoomSummaryTodos({
        sessionId: input.session.id,
        userId: input.session.user_id,
        titles: nextSteps,
      })

      return { todosCreated: inserted.length, takeaways, nextSteps }
    },

    /** Pull Zoom AI Companion summary when webhook was missed (page load / manual backfill). */
    async syncSummaryForSession(session: {
      id: string
      user_id: string
      zoom_meeting_id: string | null
      zoom_meeting_uuid: string | null
    }): Promise<{ ok: true; todosCreated: number }> {
      const key = session.zoom_meeting_uuid || session.zoom_meeting_id
      if (!key) return { ok: true, todosCreated: 0 }
      try {
        const summaryPayload = await zoom.getMeetingSummary(key)
        const result = await this.applySummaryToSession({
          session,
          summaryPayload,
          meetingId: session.zoom_meeting_id,
          meetingUuid: session.zoom_meeting_uuid,
        })
        return { ok: true, todosCreated: result.todosCreated }
      } catch (error) {
        console.warn('zoom-webhook: summary sync failed', {
          sessionId: session.id,
          error: error instanceof Error ? error.message : String(error),
        })
        return { ok: true, todosCreated: 0 }
      }
    },

    async handleSummaryEvent(input: {
      object: Record<string, unknown>
    }): Promise<{ ok: true; sessionId?: string; todosCreated?: number }> {
      const meetingId =
        asString(input.object.meeting_id) ??
        asString(input.object.id) ??
        (typeof input.object.meeting_id === 'number'
          ? String(input.object.meeting_id)
          : typeof input.object.id === 'number'
            ? String(input.object.id)
            : null)
      const meetingUuid =
        asString(input.object.meeting_uuid) ?? asString(input.object.uuid)

      const session = await repository.findSessionByZoomMeeting(meetingId, meetingUuid)
      if (!session) {
        console.info('zoom-webhook: no tutoring session for summary', { meetingId, meetingUuid })
        return { ok: true }
      }

      let summaryPayload: Record<string, unknown> = input.object
      const normalizedFromWebhook = normalizeZoomMeetingSummary(summaryPayload)
      const needsFetch =
        normalizedFromWebhook.nextSteps.length === 0 &&
        normalizedFromWebhook.takeaways.length === 0

      if (needsFetch) {
        const key = meetingUuid || meetingId
        if (key) {
          try {
            summaryPayload = await zoom.getMeetingSummary(key)
          } catch (error) {
            console.warn('zoom-webhook: meeting summary fetch failed', {
              meetingId,
              meetingUuid,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }
      }

      const result = await this.applySummaryToSession({
        session,
        summaryPayload,
        meetingId,
        meetingUuid,
      })

      return { ok: true, sessionId: session.id, todosCreated: result.todosCreated }
    },
  }
}

export type { ZoomRecordingFile }
