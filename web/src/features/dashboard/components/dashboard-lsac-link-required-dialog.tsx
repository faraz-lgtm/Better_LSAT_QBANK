import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"

const LSAC_LINK_HREF = "/app/lsac-link-step"

type DashboardLsacLinkRequiredDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Prompt when premium is active but LawHub / LSAC is not linked yet. */
function DashboardLsacLinkRequiredDialog({
  open,
  onOpenChange,
}: DashboardLsacLinkRequiredDialogProps) {
  const navigate = useNavigate()

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link your LSAC account first</DialogTitle>
          <DialogDescription>
            Smart Drills and Practice drills unlock after you link your LSAC account with LawHub.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Back
          </Button>
          <Button
            type="button"
            className="ds-btn w-full sm:w-auto"
            onClick={() => {
              onOpenChange(false)
              navigate(LSAC_LINK_HREF)
            }}
          >
            Link LSAC
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export { DashboardLsacLinkRequiredDialog, LSAC_LINK_HREF }
