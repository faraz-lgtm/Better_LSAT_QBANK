import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { pickRecordingFiles } from './zoom-webhook.service.ts'

Deno.test('pickRecordingFiles prefers smaller completed MP4 first', () => {
  const { mp4Candidates, transcript } = pickRecordingFiles({
    recording_files: [
      {
        file_type: 'MP4',
        status: 'completed',
        recording_type: 'gallery_view',
        file_size: 200_000_000,
        download_url: 'https://zoom.example/large',
      },
      {
        file_type: 'MP4',
        status: 'completed',
        recording_type: 'active_speaker',
        file_size: 12_000_000,
        download_url: 'https://zoom.example/small',
      },
      {
        file_type: 'TRANSCRIPT',
        status: 'completed',
        download_url: 'https://zoom.example/vtt',
      },
    ],
  })

  assertEquals(mp4Candidates[0]?.download_url, 'https://zoom.example/small')
  assertEquals(transcript?.download_url, 'https://zoom.example/vtt')
})

Deno.test('pickRecordingFiles ranks completed ahead of incomplete regardless of size', () => {
  const { mp4Candidates } = pickRecordingFiles({
    recording_files: [
      {
        file_type: 'MP4',
        status: 'processing',
        file_size: 1_000,
        download_url: 'https://zoom.example/tiny-incomplete',
      },
      {
        file_type: 'MP4',
        status: 'completed',
        file_size: 50_000_000,
        download_url: 'https://zoom.example/ready',
      },
    ],
  })

  assertEquals(mp4Candidates[0]?.download_url, 'https://zoom.example/ready')
})
