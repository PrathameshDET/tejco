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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  RotateCcw,
  Plus,
  Trash2,
  Loader2,
  FileText,
  Warehouse,
  CheckCircle2,
  Save,
} from "lucide-react"
import {
  returnApi,
  warehousesApi,
  salesOrderApi,
  type ReturnReason,
  type ReturnRequestDto,
} from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import type { ItemCondition, ReturnItem, ReturnRequest } from "./types"

const DEFAULT_RETURN_REASONS: ReturnReason[] = [
  { reasonId: 1, reasonCode: "TRANSIT_DAMAGE", reasonText: "Damaged in Transit" },
  { reasonId: 2, reasonCode: "DEFECTIVE_QC", reasonText: "Defective / Quality Failure" },
  { reasonId: 3, reasonCode: "WRONG_ITEM", reasonText: "Wrong Item Dispatched" },
  { reasonId: 4, reasonCode: "CANCELLATION", reasonText: "Order Cancellation / Customer Return" },
  { reasonId: 5, reasonCode: "EXPIRY_NEAR", reasonText: "Near Expiry / Expired Item" },
  { reasonId: 6, reasonCode: "OTHER", reasonText: "Other (Subject to Management Approval)" },
]

interface ReturnIntakeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnRequest?: ReturnRequest | null
  onSuccess: () => void
}

export function ReturnIntakeDialog({
  open,
  onOpenChange,
  returnRequest,
  onSuccess,
}: ReturnIntakeDialogProps) {
  const { user } = useAuth()
  const isEditMode = Boolean(returnRequest && returnRequest.returnId > 0)

  // Master options
  const [reasons, setReasons] = React.useState<ReturnReason[]>(DEFAULT_RETURN_REASONS)
  const [warehouses, setWarehouses] = React.useState<any[]>([])
  const [orders, setOrders] = React.useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = React.useState(false)

  // Form state
  const [orderId, setOrderId] = React.useState<number>(0)
  const [orderNumber, setOrderNumber] = React.useState<string>("")
  const [clientId, setClientId] = React.useState<number>(0)
  const [clientName, setClientName] = React.useState<string>("")
  const [warehouseId, setWarehouseId] = React.useState<number>(0)
  const [locationCode, setLocationCode] = React.useState<string>("BIN-RETURN-01")
  const [returnDate, setReturnDate] = React.useState<string>("")
  const [reasonId, setReasonId] = React.useState<number>(1)
  const [checkedBy, setCheckedBy] = React.useState<string>("")
  const [receivedBy, setReceivedBy] = React.useState<string>("")
  const [remarks, setRemarks] = React.useState<string>("")
  const [items, setItems] = React.useState<ReturnItem[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Load reasons and warehouses
  React.useEffect(() => {
    if (!open) return

    const loadMasters = async () => {
      try {
        const [reasonsRes, warehousesRes] = await Promise.all([
          returnApi.getReasons().catch(() => null),
          warehousesApi.getAll().catch(() => []),
        ])

        if (reasonsRes?.data && Array.isArray(reasonsRes.data) && reasonsRes.data.length > 0) {
          setReasons(reasonsRes.data)
        }

        const wList = Array.isArray(warehousesRes)
          ? warehousesRes
          : (warehousesRes as any)?.data || []
        setWarehouses(wList)
      } catch (e) {
        console.error("Error loading return masters:", e)
      }
    }

    loadMasters()
  }, [open])

  // Load recent sales orders for selection
  React.useEffect(() => {
    if (!open || isEditMode) return

    const loadOrders = async () => {
      setLoadingOrders(true)
      try {
        const res = await salesOrderApi.getAll({ PageNumber: 1, PageSize: 50 })
        const list = res?.orders || (res as any)?.data || []
        setOrders(list)
      } catch (e) {
        console.error("Error loading orders for return:", e)
      } finally {
        setLoadingOrders(false)
      }
    }

    loadOrders()
  }, [open, isEditMode])

  // Populate form in edit mode or reset on new
  React.useEffect(() => {
    if (!open) return

    if (returnRequest) {
      setOrderId(Number(returnRequest.orderId) || 0)
      setOrderNumber(returnRequest.orderNumber || "")
      setClientId(Number(returnRequest.clientId) || 0)
      setClientName(returnRequest.clientName || "")
      setWarehouseId(Number(returnRequest.warehouseId) || 0)
      setLocationCode(returnRequest.locationCode || "BIN-RETURN-01")
      setReturnDate(
        returnRequest.returnDate
          ? returnRequest.returnDate.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      )
      setReasonId(Number(returnRequest.reasonId) || 1)
      setCheckedBy(returnRequest.checkedBy || "")
      setReceivedBy(returnRequest.receivedBy || "")
      setRemarks(returnRequest.remarks || "")
      setItems(
        (returnRequest.items || []).map((it) => ({
          ...it,
          itemCondition: it.itemCondition || "Restockable",
        }))
      )
    } else {
      const today = new Date().toISOString().slice(0, 10)
      const currentUserName =
        user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || ""

      setOrderId(0)
      setOrderNumber("")
      setClientId(0)
      setClientName("")
      setWarehouseId(0)
      setLocationCode("BIN-RETURN-01")
      setReturnDate(today)
      setReasonId(1)
      setCheckedBy("")
      setReceivedBy(currentUserName || "Dock Personnel")
      setRemarks("")
      setItems([])
    }
  }, [returnRequest, open, user])

  const handleOrderChange = async (selectedOrderIdStr: string | null) => {
    if (!selectedOrderIdStr) return
    const sId = Number(selectedOrderIdStr)
    const matched = orders.find((o) => Number(o.id || o.orderId) === sId)
    setOrderId(sId)

    if (matched) {
      setOrderNumber(matched.orderNumber || "")
      setClientId(Number(matched.clientId) || 0)
      setClientName(matched.clientName || "")

      // Populate items from order line items
      try {
        const fullOrder = await salesOrderApi.getById(String(sId))
        const orderItems = fullOrder?.items || (fullOrder as any)?.lineItems || []
        if (orderItems.length > 0) {
          const mappedItems: ReturnItem[] = orderItems.map((it: any) => ({
            productId: Number(it.productId) || 0,
            productName: it.productName || it.name || "Product",
            variantId: Number(it.variantId) || 0,
            variantName: it.variantName || it.sku || "Default",
            lotId: it.lotId ? Number(it.lotId) : null,
            lotNumber: it.lotNumber || null,
            returnQuantity: 1,
            unitPrice: Number(it.unitPrice || it.price || 0),
            totalPrice: Number(it.unitPrice || it.price || 0),
            itemCondition: "Restockable",
          }))
          setItems(mappedItems)
        }
      } catch (err) {
        console.warn("Could not prefill order items:", err)
      }
    }
  }

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: 0,
        productName: "",
        variantId: 0,
        variantName: "",
        lotId: null,
        lotNumber: "",
        returnQuantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        itemCondition: "Restockable",
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemFieldChange = (
    index: number,
    field: keyof ReturnItem,
    value: any
  ) => {
    setItems((prev) => {
      const copy = [...prev]
      const target = { ...copy[index], [field]: value }

      if (field === "returnQuantity" || field === "unitPrice") {
        const q = Number(field === "returnQuantity" ? value : target.returnQuantity) || 0
        const p = Number(field === "unitPrice" ? value : target.unitPrice) || 0
        target.totalPrice = parseFloat((q * p).toFixed(2))
      }

      copy[index] = target
      return copy
    })
  }

  const totalReturnAmount = items.reduce(
    (sum, it) => sum + (Number(it.totalPrice) || 0),
    0
  )

  const handleSubmit = async (targetStatus: "Draft" | "Submitted") => {
    if (!orderId && !isEditMode) {
      toast.error("Please select a Sales Order for this return intake.")
      return
    }
    if (!warehouseId) {
      toast.error("Please select the intake Warehouse.")
      return
    }
    if (!locationCode.trim()) {
      toast.error("Please enter a Bin or Location Code (e.g. BIN-RETURN-01).")
      return
    }
    if (items.length === 0) {
      toast.error("Please add at least one line item to the return request.")
      return
    }

    setIsSubmitting(true)
    try {
      const sanitizedItems = items.map((it) => ({
        productId: Number(it.productId) || 1,
        variantId: Number(it.variantId) || 1,
        lotId: it.lotId ? Number(it.lotId) : null,
        lotNumber: it.lotNumber?.trim() || null,
        returnQuantity: Number(it.returnQuantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        itemCondition: it.itemCondition || "Restockable",
      }))

      if (isEditMode && returnRequest) {
        const updatePayload = {
          warehouseId,
          locationCode: locationCode.trim(),
          reasonId,
          checkedBy: checkedBy.trim(),
          receivedBy: receivedBy.trim(),
          status: targetStatus,
          remarks: remarks.trim() || undefined,
          items: sanitizedItems,
        }

        const res = await returnApi.update(returnRequest.returnId, updatePayload)
        toast.success(
          res.message ||
            `Return request ${returnRequest.returnNumber} updated successfully with status "${targetStatus}".`
        )
      } else {
        const createPayload = {
          orderId,
          clientId: clientId || 1,
          warehouseId,
          locationCode: locationCode.trim(),
          returnDate: returnDate
            ? new Date(returnDate).toISOString()
            : new Date().toISOString(),
          reasonId,
          checkedBy: checkedBy.trim() || "QC Inspector",
          receivedBy: receivedBy.trim() || "Dock Intake",
          status: targetStatus,
          remarks: remarks.trim() || undefined,
          items: sanitizedItems,
        }

        const res = await returnApi.create(createPayload)
        toast.success(
          res.message ||
            `Return request created successfully with status "${targetStatus}".`
        )
      }

      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error("Failed to save return intake:", err)
      toast.error(
        err?.info?.message ||
          err?.message ||
          "Failed to save return intake. Please check all fields."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>
                {isEditMode
                  ? `Edit Return Intake (${returnRequest?.returnNumber})`
                  : "New Goods Return Intake"}
              </DialogTitle>
              <DialogDescription>
                Record customer return intake, QC inspection condition, and intake warehouse bin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Order & Client Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Sales Order *</Label>
              {isEditMode ? (
                <Input
                  value={`${orderNumber} (Order #${orderId})`}
                  disabled
                  className="bg-muted font-mono text-xs"
                />
              ) : (
                <Select
                  value={orderId ? String(orderId) : ""}
                  onValueChange={handleOrderChange}
                  disabled={loadingOrders}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue
                      placeholder={
                        loadingOrders ? "Loading orders..." : "Select Sales Order"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {orders.map((o) => (
                      <SelectItem
                        key={o.id || o.orderId}
                        value={String(o.id || o.orderId)}
                      >
                        <span className="font-mono font-medium">{o.orderNumber}</span>
                        <span className="text-muted-foreground ml-2">
                          — {o.clientName}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Client Name</Label>
              <Input
                value={clientName || "—"}
                disabled
                className="bg-muted text-xs font-medium"
              />
            </div>
          </div>

          {/* Warehouse & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Intake Warehouse *</Label>
              <Select
                value={warehouseId ? String(warehouseId) : ""}
                onValueChange={(val) => setWarehouseId(Number(val))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w: any) => (
                    <SelectItem
                      key={w.warehouseId || w.id}
                      value={String(w.warehouseId || w.id)}
                    >
                      {w.warehouseName || w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Intake Bin / Rack Code *</Label>
              <Input
                placeholder="e.g. BIN-RETURN-04"
                value={locationCode}
                onChange={(e) => setLocationCode(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Return Date</Label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Return Reason, QC Inspector, Dock Personnel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Return Reason *</Label>
              <Select
                value={String(reasonId)}
                onValueChange={(val) => setReasonId(Number(val))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r.reasonId} value={String(r.reasonId)}>
                      {r.reasonText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">QC Inspected By</Label>
              <Input
                placeholder="e.g. Mahesh QC Lead"
                value={checkedBy}
                onChange={(e) => setCheckedBy(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Dock Received By</Label>
              <Input
                placeholder="e.g. Ganesh Dock"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Intake Remarks / Transit Condition</Label>
            <Textarea
              placeholder="e.g. Outer carton crushed during transit. Product seals verified intact."
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Return Items Section */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Returned Products & QC Condition
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddItem}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Line
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Product & Variant</TableHead>
                    <TableHead className="text-xs font-semibold">Lot / Serial Number</TableHead>
                    <TableHead className="w-24 text-xs font-semibold">Return Qty</TableHead>
                    <TableHead className="w-28 text-right text-xs font-semibold">Unit Price (₹)</TableHead>
                    <TableHead className="w-32 text-xs font-semibold">QC Condition</TableHead>
                    <TableHead className="w-28 text-right text-xs font-semibold">Total (₹)</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-20 text-center text-xs text-muted-foreground italic"
                      >
                        No items added yet. Click &quot;Add Line&quot; to insert returned products.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((it, idx) => (
                      <TableRow key={idx}>
                        {/* Product & Variant */}
                        <TableCell className="p-2">
                          <Input
                            placeholder="Product name / Variant"
                            value={it.productName || ""}
                            onChange={(e) =>
                              handleItemFieldChange(idx, "productName", e.target.value)
                            }
                            className="h-8 text-xs"
                          />
                        </TableCell>

                        {/* Lot Number */}
                        <TableCell className="p-2">
                          <Input
                            placeholder="e.g. SM-02984-..."
                            value={it.lotNumber || ""}
                            onChange={(e) =>
                              handleItemFieldChange(idx, "lotNumber", e.target.value)
                            }
                            className="h-8 font-mono text-xs"
                          />
                        </TableCell>

                        {/* Return Qty */}
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            min={1}
                            value={it.returnQuantity}
                            onChange={(e) =>
                              handleItemFieldChange(
                                idx,
                                "returnQuantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="h-8 text-xs"
                          />
                        </TableCell>

                        {/* Unit Price */}
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            step="any"
                            value={it.unitPrice}
                            onChange={(e) =>
                              handleItemFieldChange(
                                idx,
                                "unitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-xs text-right"
                          />
                        </TableCell>

                        {/* Condition */}
                        <TableCell className="p-2">
                          <Select
                            value={it.itemCondition}
                            onValueChange={(val) => {
                              if (val) {
                                handleItemFieldChange(idx, "itemCondition", val as ItemCondition)
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Restockable">Restockable (Back to shelf)</SelectItem>
                              <SelectItem value="Quarantine">Quarantine (Lab check)</SelectItem>
                              <SelectItem value="Scrap">Scrap (Damaged)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Line Total */}
                        <TableCell className="p-2 text-right font-medium text-xs">
                          ₹{Number(it.totalPrice || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>

                        {/* Remove */}
                        <TableCell className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(idx)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {items.length > 0 && (
              <div className="flex justify-end p-2 text-xs font-bold text-foreground">
                <span>Total Return Amount: </span>
                <span className="ml-2 text-emerald-700 dark:text-emerald-400">
                  ₹{totalReturnAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {/* Save as Draft */}
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => handleSubmit("Draft")}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save as Draft
            </Button>

            {/* Submit Return */}
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("Submitted")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Submit for Approval
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
