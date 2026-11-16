import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"

type ComingSoonDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

function ComingSoonDialog({
  open,
  onOpenChange,
  title = "Coming Soon",
  description = "Rescheduling isn't available yet. We'll let you know when you can change your session time here.",
}: ComingSoonDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="tutoring-coming-soon-desc">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="tutoring-coming-soon-desc">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" className="h-10 rounded-[10px] px-4" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export { ComingSoonDialog }
