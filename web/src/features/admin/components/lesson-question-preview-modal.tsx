import { useEffect, useState } from "react"
import { X } from "lucide-react"

import { QuestionContentPreview } from "@/features/admin/lib/question-content-preview"
import { createAdminApi } from "@/lib/api/admin"
import { DialogClose, DialogContent, DialogDescription, DialogHeader, DialogRoot, DialogTitle } from "@/components/ui/dialog"

type AdminApi = ReturnType<typeof createAdminApi>

type LessonQuestionPreviewModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  questionId: string | null
  adminApi: AdminApi | null
}

function LessonQuestionPreviewModal({ open, onOpenChange, questionId, adminApi }: LessonQuestionPreviewModalProps) {
  const [question, setQuestion] = useState<Record<string, unknown> | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuestion(null)
      setLoadError(null)
      setLoading(false)
      return
    }
    if (!questionId || !adminApi) return

    let alive = true
    setLoading(true)
    setLoadError(null)
    setQuestion(null)

    void adminApi
      .getQuestionEditorPayload(questionId)
      .then((data) => {
        if (!alive) return
        const q = (data as { question?: Record<string, unknown> }).question
        setQuestion(q ?? null)
      })
      .catch((e) => {
        if (!alive) return
        setLoadError(e instanceof Error ? e.message : "Failed to load question")
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [open, questionId, adminApi])

  const correctAnswer = String(question?.correct_answer ?? "")

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[92vh] w-[70vw] sm:!max-w-none overflow-y-auto p-0" aria-describedby={undefined}>
        <DialogClose
          className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close preview"
        >
          <X className="size-4" />
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="px-6 pt-6 !text-[#000000]" style={{ color: "#000000" }}>
            Question preview
          </DialogTitle>
          <DialogDescription className="sr-only">Passage, question stem, answer choices, and correct answer.</DialogDescription>
        </DialogHeader>
        {loading ? <p className="px-6 pb-6 text-muted-foreground text-sm">Loading…</p> : null}
        {loadError ? <p className="px-6 pb-6 text-destructive text-sm">{loadError}</p> : null}
        {!loading && !loadError && question ? (
          <QuestionContentPreview question={question} correctAnswer={correctAnswer} className="pb-6" />
        ) : null}
      </DialogContent>
    </DialogRoot>
  )
}

export { LessonQuestionPreviewModal }
