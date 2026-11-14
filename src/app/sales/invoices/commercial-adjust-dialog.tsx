import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Sliders } from "lucide-react"
import { accountsApi, type InvoicingQueueItem, type CommercialAdjustPayload } from "@/lib/api"

interface CommercialAdjustDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: InvoicingQueueItem | null
  onSuccess: () => void
}

export function CommercialAdjustDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: CommercialAdjustDialogProps) {
  const [freight, setFreight] = React.useState<number>(0)
  const [roundOff, setRoundOff] = React.useState<number>(0)
  const [orderNotes, setOrderNotes] = React.useState("")
  const [shippingAddress, setShippingAddress] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (order && open) {
      setFreight(Number(order.freight) || 0)
      setRoundOff(0)
      setOrderNotes(order.orderNotes || "")
      setShippingAddress("")
    }
  }, [order, open])

  if (!order) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload: CommercialAdjustPayload = {
        freight: Number(freight) || 0,
        roundOff: Number(roundOff) || 0,
        orderNotes: orderNotes.trim() || undefined,
        shippingAddress: shippingAddress.trim() || undefined,
      }

      await accountsApi.commercialAdjust(order.orderId, payload)
      toast.success(
        `Commercial adjustments updated successfully for Order #${order.orderNumber}.`
      )
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error("Failed to update commercial adjustments:", err)
      toast.error(
        err?.info?.message ||
          err?.message ||
          "Failed to update commercial adjustments."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Commercial Adjustments</DialogTitle>
              <DialogDescription>
                Modify freight, round-off, order notes, or shipping address for Order{" "}
                <span className="font-mono font-semibold text-foreground">
                  {order.orderNumber}
                </span>{" "}
                prior to invoicing.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="adj-freight" className="text-xs font-semibold">
                Freight Charges (₹)
              </Label>
              <Input
                id="adj-freight"
                type="number"
                step="any"
                value={freight}
                onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adj-roundOff" className="text-xs font-semibold">
                Round-off (₹)
              </Label>
              <Input
                id="adj-roundOff"
                type="number"
                step="any"
                value={roundOff}
                onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adj-orderNotes" className="text-xs font-semibold">
              Order Notes / Commercial Remarks
            </Label>
            <Textarea
              id="adj-orderNotes"
              placeholder="e.g. Freight updated after special courier arrangement."
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adj-shippingAddress" className="text-xs font-semibold">
              Shipping Address Override (Optional)
            </Label>
            <Textarea
              id="adj-shippingAddress"
              placeholder="Leave blank to retain original shipping address..."
              rows={2}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Adjustments"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

