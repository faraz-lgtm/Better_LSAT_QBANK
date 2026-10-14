import { useEffect } from "react"
import { MessageSquarePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import {
  closeProduktlyFeedback,
  openProduktlyFeedback,
} from "@/lib/analytics/produktly"
import { PRODUKTLY_FEEDBACK_WIDGET_ID } from "@/lib/analytics/produktly-widgets"

function FeedbackPage() {
  useEffect(() => {
    openProduktlyFeedback(PRODUKTLY_FEEDBACK_WIDGET_ID)
    return () => {
      closeProduktlyFeedback(PRODUKTLY_FEEDBACK_WIDGET_ID)
    }
  }, [])

  return (
    <StudentMain>
      <div className="mx-auto flex w-full max-w-xl flex-col items-start gap-6 py-2">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary-25)] text-[var(--primary)]">
          <MessageSquarePlus className="size-6" aria-hidden />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-[var(--color-student-heading)]">
            Share feedback
          </h1>
          <p className="m-0 text-sm leading-relaxed text-[var(--greyscale-500)]">
            Tell us what is working, what is confusing, or what would make betterLSAT more useful for
            your prep. Bug reports and feature ideas are both welcome.
          </p>
        </div>
        <Button
          type="button"
          className="h-10 rounded-xl px-5"
          onClick={() => openProduktlyFeedback(PRODUKTLY_FEEDBACK_WIDGET_ID)}
        >
          Open feedback form
        </Button>
      </div>
    </StudentMain>
  )
}

export { FeedbackPage }
