import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"

function hasCheckoutOrPaymentSuccess(searchParams: URLSearchParams): boolean {
  return (
    searchParams.get("checkout") === "success" || searchParams.get("payment") === "success"
  )
}

function clearCheckoutSuccessParams(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams)
  next.delete("checkout")
  next.delete("payment")
  next.delete("session_id")
  return next
}

type CheckoutPaymentSuccessDialogProps = {
  /** Optional confirm button label (default Continue). */
  confirmLabel?: string
}

/**
 * Modal shown after Stripe returns with checkout/payment success.
 * Dismiss clears success query params so the dialog does not reappear on refresh.
 */
function CheckoutPaymentSuccessDialog({
  confirmLabel = "Continue",
}: CheckoutPaymentSuccessDialogProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [open, setOpen] = useState(() => hasCheckoutOrPaymentSuccess(searchParams))

  useEffect(() => {
    if (hasCheckoutOrPaymentSuccess(searchParams)) {
      setOpen(true)
    }
  }, [searchParams])

  const dismiss = useCallback(() => {
    setOpen(false)
    const next = clearCheckoutSuccessParams(searchParams)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  return (
    <DialogRoot
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) dismiss()
      }}
    >
      <DialogContent className="sm:max-w-md" aria-describedby="checkout-payment-success-desc">
        <DialogHeader>
          <DialogTitle>Payment successful</DialogTitle>
          <DialogDescription id="checkout-payment-success-desc">
            Your Better LSAT subscription is active. You can continue to link LawHub PrepPlus when
            you are ready.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" className="ds-btn w-full sm:w-auto" onClick={dismiss}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export {
  CheckoutPaymentSuccessDialog,
  clearCheckoutSuccessParams,
  hasCheckoutOrPaymentSuccess,
}
