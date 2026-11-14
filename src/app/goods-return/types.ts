export type ReturnStatus = "Draft" | "Submitted" | "Approved" | "Rejected"
export type ItemCondition = "Restockable" | "Quarantine" | "Scrap"

export interface ReturnReason {
  reasonId: number
  reasonCode: string
  reasonText: string
}

export interface ReturnItem {
  returnItemId?: number
  productId: number
  productName?: string
  variantId: number
  variantName?: string
  lotId?: number | null
  lotNumber?: string | null
  returnQuantity: number
  unitPrice: number
  totalPrice?: number
  itemCondition: ItemCondition | string
}

export interface ReturnRequest {
  returnId: number
  returnNumber: string
  orderId: number
  orderNumber: string
  clientId: number
  clientName: string
  warehouseId: number
  warehouseName?: string
  locationCode?: string
  returnDate: string
  reasonId: number
  reasonText?: string
  checkedBy: string
  receivedBy: string
  status: ReturnStatus | string
  remarks?: string
  creditNoteId?: number | null
  creditNoteNumber?: string | null
  totalReturnAmount: number
  itemsCount: number
  items: ReturnItem[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateReturnPayload {
  orderId: number
  clientId: number
  warehouseId: number
  locationCode: string
  returnDate: string
  reasonId: number
  checkedBy: string
  receivedBy: string
  status: "Draft" | "Submitted" | string
  remarks?: string
  items: {
    productId: number
    variantId: number
    lotId?: number | null
    lotNumber?: string | null
    returnQuantity: number
    unitPrice: number
    itemCondition: ItemCondition | string
  }[]
}

export interface UpdateReturnPayload {
  warehouseId: number
  locationCode: string
  reasonId: number
  checkedBy: string
  receivedBy: string
  status: "Draft" | "Submitted" | string
  remarks?: string
  items: {
    productId: number
    variantId: number
    lotId?: number | null
    lotNumber?: string | null
    returnQuantity: number
    unitPrice: number
    itemCondition: ItemCondition | string
  }[]
}

