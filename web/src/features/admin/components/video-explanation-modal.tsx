import { useCallback, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { fileExtensionForVideoUpload } from "@/features/admin/lib/video-upload-helpers"
import { createAdminApi } from "@/lib/api/admin"

type AdminApi = ReturnType<typeof createAdminApi>

type VideoExplanationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  questionId: string
  prepTestId: string
  sectionId: string
  currentVideoUrl: string
  adminApi: AdminApi
  onVideoUrlSaved: (url: string | null) => void
}

type TabId = "paste" | "upload" | "record"

function VideoExplanationModal({
  open,
  onOpenChange,
  questionId,
  prepTestId,
  sectionId,
  currentVideoUrl,
  adminApi,
  onVideoUrlSaved,
}: VideoExplanationModalProps) {
  const [tab, setTab] = useState<TabId>("paste")
  const [pasteValue, setPasteValue] = useState(currentVideoUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const recordPath = `/admin/preptests/${prepTestId}/sections/${sectionId}/questions/${questionId}/record`
  const currentUrl = currentVideoUrl.trim()

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setPasteValue(currentVideoUrl)
        setTab("paste")
        setError(null)
      }
      onOpenChange(next)
    },
    [currentVideoUrl, onOpenChange],
  )

  async function savePaste() {
    setBusy(true)
    setError(null)
    try {
      const v = pasteValue.trim() || null
      await adminApi.updateQuestionMeta(questionId, { video_url: v })
      onVideoUrlSaved(v)
      onOpenChange(false)
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
      const url = await adminApi.uploadQuestionVideoBlob(questionId, file, file.type || `video/${ext}`, ext)
      await adminApi.updateQuestionMeta(questionId, { video_url: url })
      onVideoUrlSaved(url)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="!text-[#000000]" style={{ color: "#000000" }}>
            Video explanation
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
              Opens a full-page recorder with the question layout. When you finish, the new video URL is sent back to this editor automatically
              if this tab stays open.
            </p>
            <Button type="button" variant="secondary" asChild>
              <Link to={recordPath} target="_blank" rel="noopener noreferrer" onClick={() => onOpenChange(false)}>
                Open recorder in new tab
              </Link>
            </Button>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
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
