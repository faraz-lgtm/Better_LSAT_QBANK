import { useCallback, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { fileExtensionForVideoUpload } from "@/features/admin/lib/video-upload-helpers"
import { createAdminApi } from "@/lib/api/admin"

type AdminApi = ReturnType<typeof createAdminApi>

type VideoExplanationModalPropsQuestion = {
  mode?: "question"
  open: boolean
  onOpenChange: (open: boolean) => void
  questionId: string
  prepTestId: string
  sectionId: string
  currentVideoUrl: string
  adminApi: AdminApi
  onVideoUrlSaved: (url: string | null) => void
}

type VideoExplanationModalPropsLessonDrill = {
  mode: "lessonDrill"
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  recordPrepTestId: string
  recordSectionId: string
  recordQuestionId: string
  lessonDrillQuery: "active" | "adaptive"
  currentVideoUrl: string
  adminApi: AdminApi
  onVideoUrlSaved: (url: string | null) => void
  recordDisabled?: boolean
  recordDisabledReason?: string
}

export type VideoExplanationModalProps = VideoExplanationModalPropsQuestion | VideoExplanationModalPropsLessonDrill

type TabId = "paste" | "upload" | "record"

function VideoExplanationModal(props: VideoExplanationModalProps) {
  const isLessonDrill = props.mode === "lessonDrill"
  const questionId = isLessonDrill ? props.recordQuestionId : props.questionId
  const prepTestId = isLessonDrill ? props.recordPrepTestId : props.prepTestId
  const sectionId = isLessonDrill ? props.recordSectionId : props.sectionId
  const lessonId = isLessonDrill ? props.lessonId : ""

  const [tab, setTab] = useState<TabId>("paste")
  const [pasteValue, setPasteValue] = useState(props.currentVideoUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const recordPath = (() => {
    const base = `/admin/preptests/${prepTestId}/sections/${sectionId}/questions/${questionId}/record`
    if (props.mode === "lessonDrill") {
      const qs = new URLSearchParams({
        lessonId: props.lessonId,
        lessonDrill: props.lessonDrillQuery,
        lessonVideoLessonId: props.lessonId,
      })
      return `${base}?${qs.toString()}`
    }
    return base
  })()

  const currentUrl = props.currentVideoUrl.trim()
  const dialogTitle = isLessonDrill ? "Lesson intro video" : "Video explanation"
  const recordDisabled = isLessonDrill && props.recordDisabled
  const recordDisabledReason = isLessonDrill ? props.recordDisabledReason : undefined

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setPasteValue(props.currentVideoUrl)
        setTab("paste")
        setError(null)
      }
      props.onOpenChange(next)
    },
    [props],
  )

  async function savePaste() {
    setBusy(true)
    setError(null)
    try {
      const v = pasteValue.trim() || null
      if (isLessonDrill) {
        await props.adminApi.updateLesson(lessonId, { videoUrl: v })
      } else {
        await props.adminApi.updateQuestionMeta(props.questionId, { video_url: v })
      }
      props.onVideoUrlSaved(v)
      props.onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const ext = fileExtensionForVideoUpload(file)
      if (isLessonDrill) {
        const url = await props.adminApi.uploadLessonVideoBlob(lessonId, file, file.type || `video/${ext}`, ext)
        await props.adminApi.updateLesson(lessonId, { videoUrl: url })
        props.onVideoUrlSaved(url)
      } else {
        const url = await props.adminApi.uploadQuestionVideoBlob(props.questionId, file, file.type || `video/${ext}`, ext)
        await props.adminApi.updateQuestionMeta(props.questionId, { video_url: url })
        props.onVideoUrlSaved(url)
      }
      props.onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <DialogRoot open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="!text-[#000000]" style={{ color: "#000000" }}>
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="sr-only">Add a video by pasting a URL, uploading a file, or recording in a new tab.</DialogDescription>
          <div className="text-muted-foreground text-sm">
            Current:{" "}
            {currentUrl ? (
              <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                Video link
              </a>
            ) : (
              "No video linked"
            )}
          </div>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(
            [
              ["paste", "Paste link"],
              ["upload", "Upload"],
              ["record", "Record"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`flex-1 rounded-md px-2 py-2 text-xs font-semibold ${
                tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        {tab === "paste" ? (
          <div className="grid gap-2">
            <label className="text-sm font-medium">Video URL</label>
            <Input value={pasteValue} onChange={(e) => setPasteValue(e.target.value)} placeholder="https://…" disabled={busy} />
            <p className="text-muted-foreground text-xs">YouTube, Vimeo, or a direct link to a video file.</p>
          </div>
        ) : null}

        {tab === "upload" ? (
          <div className="grid gap-2">
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(ev) => void onPickFile(ev)} />
            <Button type="button" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
              Choose video file…
            </Button>
            <p className="text-muted-foreground text-xs">WebM, MP4, MOV, or MKV (large files may take a moment).</p>
          </div>
        ) : null}

        {tab === "record" ? (
          <div className="grid gap-2 text-sm">
            <p className="text-muted-foreground">
              {isLessonDrill
                ? "Opens a full-page recorder with the linked PrepTest question. When you finish, the new video URL is saved on this lesson (not the question explanation)."
                : "Opens a full-page recorder with the question layout. When you finish, the new video URL is sent back to this editor automatically if this tab stays open."}
            </p>
            {recordDisabled ? (
              <p className="text-muted-foreground text-xs">{recordDisabledReason ?? "Recording is not available."}</p>
            ) : null}
            {recordDisabled ? (
              <Button type="button" variant="secondary" disabled>
                Open recorder in new tab
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const abs = new URL(recordPath, window.location.origin).href
                  window.open(abs, "_blank", "noopener,noreferrer")
                  props.onOpenChange(false)
                }}
              >
                Open recorder in new tab
              </Button>
            )}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          {tab === "paste" ? (
            <Button type="button" disabled={busy} onClick={() => void savePaste()}>
              {busy ? "Saving…" : "Save URL"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export { VideoExplanationModal }
