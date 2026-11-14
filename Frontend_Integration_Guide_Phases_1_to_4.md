# Tejco ERP – Frontend Integration Guide (Phases 1 to 4)
### Implementation Reference for Frontend & Mobile Teams
**Document Version:** 1.0.0  
**Backend Base URL:** `http://tejco.digitaledgetech.in/api/api` (Production) / `http://localhost:5000/api` (Local)  
**Authentication Header:** `Authorization: Bearer <JWT_TOKEN>`  

---

## 📌 Table of Contents
1. [Overview & Role Permissions Matrix](#1-overview--role-permissions-matrix)
2. [Phase 1: Sales Documents & Address Uniformity](#2-phase-1-sales-documents--address-uniformity)
   - [2.1 Quotation Form (Separate Billing & Shipping)](#21-quotation-form-separate-billing--shipping)
   - [2.2 Proforma Invoice (Validity Removal & Address Flow)](#22-proforma-invoice-validity-removal--address-flow)
   - [2.3 Sales Order (Source Lead Tracking & Address Pass-Through)](#23-sales-order-source-lead-tracking--address-pass-through)
3. [Phase 2: Security, Governance & Lot Visibility Controls](#3-phase-2-security-governance--lot-visibility-controls)
   - [3.1 Sales Lot Number & Cost Masking](#31-sales-lot-number--cost-masking)
   - [3.2 Super Admin Master Price Lock](#32-super-admin-master-price-lock)
   - [3.3 Restricted Warehouse Endpoints](#33-restricted-warehouse-endpoints)
4. [Phase 3: Accounts Invoicing Workflow](#4-phase-3-accounts-invoicing-workflow)
   - [4.1 Accounts Invoicing Queue (`/api/Accounts/InvoicingQueue`)](#41-accounts-invoicing-queue-apiaccountsinvoicingqueue)
   - [4.2 Completed Sales Orders View (`/api/Accounts/SalesOrder/Completed`)](#42-completed-sales-orders-view-apiaccountssalesordercompleted)
   - [4.3 Generate Tax Invoice Endpoint (`/api/Accounts/SalesOrder/{id}/GenerateInvoice`)](#43-generate-tax-invoice-endpoint-apiaccountssalesorderidgenerateinvoice)
   - [4.4 Commercial Adjustments Endpoint (`/api/Accounts/SalesOrder/{id}/CommercialAdjust`)](#44-commercial-adjustments-endpoint-apiaccountssalesorderidcommercialadjust)
5. [Phase 4: Return & Replacement $\rightarrow$ Credit Note Flow](#5-phase-4-return--replacement--credit-note-flow)
   - [5.1 Return Reasons Dropdown (`/api/Return/Reasons`)](#51-return-reasons-dropdown-apireturnreasons)
   - [5.2 Create Return Request Intake (`/api/Return/Create`)](#52-create-return-request-intake-apireturncreate)
   - [5.3 Update Draft Return Request (`/api/Return/Update/{id}`)](#53-update-draft-return-request-apireturnupdateid)
   - [5.4 List & Detail Views (`/api/Return/GetAll`, `/api/Return/GetById/{id}`)](#54-list--detail-views-apireturngetall-apireturngetbyidid)
   - [5.5 Approve Return & Auto-Generate Credit Note (`/api/Return/{id}/Approve`)](#55-approve-return--auto-generate-credit-note-apireturnidapprove)
   - [5.6 Reject Return Request (`/api/Return/{id}/Reject`)](#56-reject-return-request-apireturnidreject)
   - [5.7 View Linked Credit Note (`/api/CreditNote/ByReturn/{returnId}`)](#57-view-linked-credit-note-apicreditnotebyreturnreturnid)

---

## 1. Overview & Role Permissions Matrix

The ERP now enforces role-based capabilities and strict document workflows:

| Role Name | RoleId | Phase 1 (Addresses & Lead) | Phase 2 (Lots & Price) | Phase 3 (Accounts Invoicing) | Phase 4 (Returns & Credit Notes) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | `1` | Full Access | Full Access + **Can Edit Master Price** | Full Access | Full Access (Can Approve) |
| **Admin** | `2` | Full Access | View Lots (No Price Edit) | Full Access | Full Access (Can Approve) |
| **Sales Person** | `3` | Full Access | **Masked Lots, Masked Cost Price, Price Lock** | View Only | View Client Returns |
| **Account Team** | `5` | Full Access | View Lots (No Price Edit) | **Invoicing Queue & Tax Invoice Gen** | View & **Approve Returns (Credit Note Gen)** |
| **Warehouse** | `6` | Read Only | View Lots & Rack Locations | Read Only | **Dock Intake (Draft/Submit) & Putaway** |

---

## 2. Phase 1: Sales Documents & Address Uniformity

### 2.1 Quotation Form (Separate Billing & Shipping)
In the Quotation creation and edit screens, display two address cards with a toggle checkbox:
`[x] Shipping address is same as billing address`.

* **Endpoint:** `POST /api/Quotation/Create` or `PUT /api/Quotation/Update/{id}`
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`

#### Request Payload:
```json
{
  "quotationNumber": "QUO-2026-9001",
  "quotationDate": "2026-11-03T10:00:00Z",
  "clientName": "Dr. Rajoli Brahmanand Clinic",
  "billingAddress": "5th Floor, D No. 8-2-293/82/A/468/601, Fortune Atrium, Road No. 36, Jubilee Hills, Hyderabad - 500033, Telangana, India",
  "shippingAddress": "Plot 14, Biomedical Logistic Hub, Industrial Area, Hyderabad - 500051, Telangana, India",
  "clientMobileNo": "+91 7032292266",
  "subject": "Commercial Proposal for Diagnostic Aesthetics Equipment",
  "gstinNo": "36AABCT1332L1Z4",
  "validityDays": 30,
  "paymentTerms": "100% advance against Proforma Invoice",
  "deliveryTerms": "Ex-warehouse dispatch within 3 working days",
  "salesPersonId": 12,
  "salesPersonName": "Rahul Sharma",
  "salesPersonCell": "+91 9820011223",
  "paymentType": "Domestic",
  "currencyType": "INR",
  "doctorSpeciality": ["Dermatology", "Trichology"],
  "doctorName": "Dr. Rajoli Brahmanand",
  "items": [
    {
      "productId": 145,
      "variantId": 355,
      "quantity": 5,
      "price": 1450.00,
      "gstPercentage": 18.00,
      "discountPercentage": 5.00,
      "discountAmount": 362.50
    }
  ]
}
```

#### Success Response (`200 OK` / `201 Created`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Quotation saved successfully",
  "data": {
    "quotationId": 48,
    "quotationNumber": "QUO-2026-9001",
    "billingAddress": "5th Floor, D No. 8-2-293/82/A/468/601, Fortune Atrium, Road No. 36, Jubilee Hills, Hyderabad - 500033, Telangana, India",
    "shippingAddress": "Plot 14, Biomedical Logistic Hub, Industrial Area, Hyderabad - 500051, Telangana, India",
    "totalAmount": 7999.75
  }
}
```

> **Frontend Note:** The legacy field `clientAddress` is maintained for backward compatibility. Reading `quotation.billingAddress ?? quotation.clientAddress` ensures zero breaks across legacy forms.

---

### 2.2 Proforma Invoice (Validity Removal & Address Flow)
* **UI Changes:**
  1. **Remove** the "Validity (Days)" input box from the PI create/edit screens.
  2. **Remove** the "Validity" row or badge from PI PDF generation templates.
  3. Support distinct `billingAddress` and `shippingAddress`.

* **Endpoint:** `POST /api/ProformaInvoice/Create` or `PUT /api/ProformaInvoice/Update/{id}`

#### Request Payload:
```json
{
  "piNo": "PI-2026-1045",
  "piDate": "2026-11-03T11:00:00Z",
  "clientId": 10,
  "billingName": "Dr. Rajoli Brahmanand",
  "billingAddress": "5th Floor, D No. 8-2-293/82/A/468/601, Fortune Atrium, Road No. 36, Hyderabad - 500033",
  "shippingAddress": "Plot 14, Biomedical Logistic Hub, Industrial Area, Hyderabad - 500051",
  "freight": 250.00,
  "totalAmount": 8249.75,
  "deliveryTerms": "Dispatched upon payment receipt",
  "paymentTerms": "100% Advance Payment",
  "paymentType": "Domestic",
  "currencyType": "INR",
  "salesPersonId": 12,
  "clientGSTIN": "36AABCT1332L1Z4",
  "linkedQuotationId": 48,
  "doctorSpeciality": ["Dermatology"],
  "doctorName": "Dr. Rajoli Brahmanand",
  "items": [
    {
      "productId": 145,
      "variantId": 355,
      "quantity": 5,
      "rate": 1450.00,
      "discountPercentage": 5.00,
      "discountAmount": 362.50,
      "total": 6887.50
    }
  ]
}
```

---

### 2.3 Sales Order (Source Lead Tracking & Address Pass-Through)
When creating or converting to a Sales Order, include the new `sourceLead` field.

* **Dropdown Options for `sourceLead`:**
  - `Direct Call`
  - `Website / Portal`
  - `Doctor Referral`
  - `Exhibition / Conference`
  - `Field Sales Visit`
  - `WhatsApp`
  - `Quotation` *(auto-set when converted from Quotation)*
  - `Proforma Invoice` *(auto-set when converted from PI)*

* **Endpoint:** `POST /api/SalesOrder/Create` or `POST /api/Quotation/ConvertToSalesOrder/{id}`

#### Request Payload:
```json
{
  "orderNumber": "SO-20261103-8821",
  "orderDate": "2026-11-03T12:00:00Z",
  "targetDeliveryDate": "2026-11-07T18:00:00Z",
  "clientId": 10,
  "orderStatus": "Pending",
  "paymentStatus": "Paid",
  "paymentType": "Domestic",
  "currencyType": "INR",
  "salesPersonId": 12,
  "billingAddress": "5th Floor, D No. 8-2-293/82/A/468/601, Fortune Atrium, Hyderabad - 500033",
  "shippingAddress": "Plot 14, Biomedical Logistic Hub, Industrial Area, Hyderabad - 500051",
  "subtotal": 6887.50,
  "gstAmount": 1239.75,
  "freight": 250.00,
  "totalAmount": 8377.25,
  "sourceLead": "Doctor Referral",
  "orderNotes": "Client confirmed urgent delivery for Monday OPD.",
  "doctorSpeciality": ["Dermatology"],
  "doctorName": "Dr. Rajoli Brahmanand",
  "lineItems": [
    {
      "productId": 145,
      "variantId": 355,
      "sku": "SB-006-LG2",
      "quantity": 5,
      "unitPrice": 1450.00,
      "discountPercentage": 5.00,
      "discountAmount": 362.50,
      "totalPrice": 6887.50
    }
  ]
}
```

---

## 3. Phase 2: Security, Governance & Lot Visibility Controls

### 3.1 Sales Lot Number & Cost Masking
When the logged-in user has the **Sales Person** role (`RoleId: 3`):
* **Masked Fields:**
  - `product.lots` $\rightarrow$ `[]`
  - `variant.lots` $\rightarrow$ `[]`
  - `variant.rackLocation` $\rightarrow$ `null`
  - `variant.purchasePrice` $\rightarrow$ `0`
  - `variant.usdAmount` $\rightarrow$ `null`
  - `product.vendorName` $\rightarrow$ `null`
* **Intact Stock Fields for Order Taking:**
  - `variant.currentQuantity` $\rightarrow$ Current physical units
  - `variant.reservedQuantity` $\rightarrow$ Allocated units
  - `variant.availableStock` $\rightarrow$ $\text{Current} - \text{Reserved}$ (Live inventory available for sales)

#### Example Response for Sales User (`GET /api/Product/GetById/145`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "productId": 145,
    "productName": "Cosmetics",
    "baseSKU": "SB-006",
    "vendorName": null,
    "variants": [
      {
        "variantId": 355,
        "variantName": "Formula H, Serum",
        "purchasePrice": 0,
        "sellingPrice": 1456.12,
        "initialQuantity": 0,
        "currentQuantity": 10,
        "reservedQuantity": 0,
        "availableStock": 10,
        "rackLocation": null,
        "usdAmount": null,
        "lots": []
      }
    ],
    "lots": []
  }
}
```

> **Sales Order Lot Masking:** When a Sales Person queries `/api/SalesOrder/GetAll` or `/api/SalesOrder/GetById/{id}`, `lineItems[].lotId` and `lineItems[].lotNumber` are automatically returned as `null`.

---

### 3.2 Super Admin Master Price Lock
* **Rule:** Only users in the **Super Admin** role (`RoleId: 1`) can alter catalog selling prices, purchase prices, or USD amounts on `PUT /api/Product/Update/{id}`.
* **If a Non-SuperAdmin attempts to alter a variant's `sellingPrice` or `purchasePrice`:**

#### Error Response (`403 Forbidden`):
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Only Super Admin is authorized to change master product prices.",
  "data": null,
  "error": null
}
```

> **UI Best Practice:** In the Product Management screen, disable/grey out the `Selling Price` and `Purchase Price` inputs if the current user is not a Super Admin (`user.role !== "Super Admin"`). Non-SuperAdmins can still edit `ProductName`, `Description`, `Brand`, `Unit`, `Category`, and `Status`.

---

### 3.3 Restricted Warehouse Endpoints
The following endpoints now enforce `Inventory.Lots.View` permissions (Super Admin, Admin, Warehouse, Account Team):
* `GET /api/Inventory/Lots`
* `GET /api/Inventory/Lots/{lotId}`
* `GET /api/Inventory/Lots/ByVariant/{variantId}`
* `GET /api/Inventory/Lots/ByWarehouse/{warehouseId}`
* `GET /api/Inventory/Traceability/{lotNumber}`

If a Sales Person calls these endpoints directly, the API returns:
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Access denied. Lot details are restricted to authorized warehouse and administration personnel.",
  "data": null
}
```

---

## 4. Phase 3: Accounts Invoicing Workflow

### Lifecycle Transition
$$\text{Sales Order: Ready for Dispatch} \longrightarrow \text{Outward Order: Completed} \longrightarrow \text{Accounts: Invoicing Queue} \longrightarrow \text{Tax Invoice Generated}$$

---

### 4.1 Accounts Invoicing Queue (`/api/Accounts/InvoicingQueue`)
Displays sales orders whose physical dispatch has completed and are waiting for GST tax invoice generation.

* **Method:** `GET`
* **Route:** `/api/Accounts/InvoicingQueue`
* **Query Parameters:**
  - `pageNumber` *(int, default: 1)*
  - `pageSize` *(int, default: 10)*
  - `searchTerm` *(string, optional — searches order number, client name, invoice number)*
  - `startDate` / `endDate` *(datetime, optional)*
  - `includeInvoiced` *(boolean, default: false — set true to view already invoiced historical orders)*

#### Success Response (`200 OK`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Accounts invoicing queue retrieved successfully",
  "data": [
    {
      "orderId": 3858,
      "orderNumber": "SO-20261016-6306",
      "clientId": 10,
      "clientName": "Dr. Rajoli Brahmanand Clinic",
      "orderDate": "2026-10-16T11:20:00",
      "orderStatus": "Completed",
      "status": "Active",
      "paymentStatus": "Paid",
      "paymentType": "Domestic",
      "currencyType": "INR",
      "subtotal": 12500.00,
      "gstAmount": 2250.00,
      "freight": 250.00,
      "totalAmount": 15000.00,
      "invoiceNumber": null,
      "invoiceDate": null,
      "invoicedBy": null,
      "orderNotes": "Urgent client requirement.",
      "outwardOrderId": 12,
      "outwardStatus": "Completed",
      "dispatchedDate": "2026-10-28T14:45:00",
      "itemsCount": 3
    }
  ],
  "totalCount": 1
}
```

---

### 4.2 Completed Sales Orders View (`/api/Accounts/SalesOrder/Completed`)
Convenience endpoint for Accounts navigation tabs to show only active, uninvoiced completed orders.

* **Method:** `GET`
* **Route:** `/api/Accounts/SalesOrder/Completed`
* **Query Parameters:** `pageNumber`, `pageSize`, `searchTerm`, `startDate`, `endDate`

---

### 4.3 Generate Tax Invoice Endpoint (`/api/Accounts/SalesOrder/{id}/GenerateInvoice`)
When the Accounts user generates the official GST Tax Invoice from Tally or their accounting software, they input the details here to transition the Sales Order.

* **Method:** `POST`
* **Route:** `/api/Accounts/SalesOrder/{orderId}/GenerateInvoice`
* **Required Permission:** `Sales.Invoice.Generate` (Super Admin, Admin, Account Team)

#### Request Payload:
```json
{
  "invoiceNumber": "INV-2026-0412",
  "invoiceDate": "2026-11-03T14:30:00Z",
  "freight": 250.00,
  "roundOff": 0.25,
  "remarks": "Tax invoice filed with 18% IGST. E-Way bill #EWB9928371."
}
```

#### Success Response (`200 OK`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Tax Invoice 'INV-2026-0412' generated successfully for Order #SO-20261016-6306.",
  "data": {
    "orderId": 3858,
    "orderNumber": "SO-20261016-6306",
    "invoiceNumber": "INV-2026-0412",
    "invoiceDate": "2026-11-03T14:30:00Z",
    "orderStatus": "Invoice Generated"
  }
}
```

> **State Guard:** If called on an order that already has an invoice generated, the API returns `400 Bad Request` (*"Invoice has already been generated for Sales Order #..."*).

---

### 4.4 Commercial Adjustments Endpoint (`/api/Accounts/SalesOrder/{id}/CommercialAdjust`)
Enables the Accounts role to adjust commercial line items (freight, round-off, remarks, or client address) immediately prior to generating the invoice.

* **Method:** `PUT`
* **Route:** `/api/Accounts/SalesOrder/{orderId}/CommercialAdjust`
* **Required Permission:** `Sales.Commercial.Edit`

#### Request Payload:
```json
{
  "freight": 350.00,
  "roundOff": -0.50,
  "orderNotes": "Freight updated after special courier arrangement.",
  "shippingAddress": "Plot 14, Industrial Area, Hyderabad - 500051"
}
```

---

## 5. Phase 4: Return & Replacement $\rightarrow$ Credit Note Flow

### Lifecycle Workflow
```
[Customer Return Request]
         │
         ▼
[Dock Intake: Fill Form] ──────────> Save as Draft (status: 'Draft')
         │
         ▼
[QC Inspection: CheckedBy + Bin] ──> Submit for Approval (status: 'Submitted')
         │
         ▼
[Accounts / Manager Approval] ────> Status: 'Approved'
                                       ├──> Restock inventory (if condition = 'Restockable')
                                       └──> Auto-generate linked Credit Note (status: 'Pending')
```

---

### 5.1 Return Reasons Dropdown (`/api/Return/Reasons`)
Use this endpoint to populate the standardized return reason dropdown on the Return entry screen.

* **Method:** `GET`
* **Route:** `/api/Return/Reasons`

#### Success Response (`200 OK`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Return reasons retrieved successfully",
  "data": [
    { "reasonId": 1, "reasonCode": "TRANSIT_DAMAGE", "reasonText": "Damaged in Transit" },
    { "reasonId": 2, "reasonCode": "DEFECTIVE_QC", "reasonText": "Defective / Quality Failure" },
    { "reasonId": 3, "reasonCode": "WRONG_ITEM", "reasonText": "Wrong Item Dispatched" },
    { "reasonId": 4, "reasonCode": "CANCELLATION", "reasonText": "Order Cancellation / Customer Return" },
    { "reasonId": 5, "reasonCode": "EXPIRY_NEAR", "reasonText": "Near Expiry / Expired Item" },
    { "reasonId": 6, "reasonCode": "OTHER", "reasonText": "Other (Subject to Management Approval)" }
  ],
  "totalCount": 6
}
```

---

### 5.2 Create Return Request Intake (`/api/Return/Create`)
Warehouse dock personnel record returned goods. Supports `"status": "Draft"` (Save as Draft) or `"status": "Submitted"`.

* **Method:** `POST`
* **Route:** `/api/Return/Create`
* **Item Conditions:**
  - `Restockable`: Eligible to be added back to available inventory upon approval.
  - `Quarantine`: Requires secondary lab evaluation.
  - `Scrap`: Damaged beyond recovery, cannot be resold.

#### Request Payload:
```json
{
  "orderId": 3858,
  "clientId": 10,
  "warehouseId": 3,
  "locationCode": "BIN-RETURN-04",
  "returnDate": "2026-11-03T15:00:00Z",
  "reasonId": 1,
  "checkedBy": "Mahesh QC",
  "receivedBy": "Ganesh Dock",
  "status": "Draft",
  "remarks": "Outer carton crushed during transit by blue dart courier.",
  "items": [
    {
      "productId": 145,
      "variantId": 355,
      "lotId": 4,
      "lotNumber": "SM-02984-145-355-261017",
      "returnQuantity": 2,
      "unitPrice": 1450.00,
      "itemCondition": "Restockable"
    }
  ]
}
```

#### Success Response (`201 Created`):
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Return request RET-2026-0001 created successfully with status 'Draft'.",
  "data": {
    "returnId": 1,
    "returnNumber": "RET-2026-0001",
    "orderId": 3858,
    "orderNumber": "SO-20261016-6306",
    "clientId": 10,
    "clientName": "Dr. Rajoli Brahmanand Clinic",
    "warehouseId": 3,
    "warehouseName": "AMORE COMMERCIAL",
    "locationCode": "BIN-RETURN-04",
    "returnDate": "2026-11-03T15:00:00",
    "reasonId": 1,
    "reasonText": "Damaged in Transit",
    "checkedBy": "Mahesh QC",
    "receivedBy": "Ganesh Dock",
    "status": "Draft",
    "remarks": "Outer carton crushed during transit by blue dart courier.",
    "creditNoteId": null,
    "creditNoteNumber": null,
    "totalReturnAmount": 2900.00,
    "itemsCount": 1,
    "items": [
      {
        "returnItemId": 1,
        "productId": 145,
        "productName": "Cosmetics",
        "variantId": 355,
        "variantName": "Formula H, Serum",
        "lotNumber": "SM-02984-145-355-261017",
        "returnQuantity": 2,
        "unitPrice": 1450.00,
        "totalPrice": 2900.00,
        "itemCondition": "Restockable"
      }
    ]
  }
}
```

---

### 5.3 Update Draft Return Request (`/api/Return/Update/{id}`)
Allows modifying return intake details or items while the return request remains in `Draft` or `Submitted` state.

* **Method:** `PUT`
* **Route:** `/api/Return/Update/{id}`

#### Request Payload:
```json
{
  "warehouseId": 3,
  "locationCode": "BIN-RESTOCK-01",
  "reasonId": 1,
  "checkedBy": "Mahesh QC Lead",
  "receivedBy": "Ganesh Dock",
  "status": "Submitted",
  "remarks": "Inspection complete. Product seals verified intact. Ready for Accounts approval.",
  "items": [
    {
      "productId": 145,
      "variantId": 355,
      "lotNumber": "SM-02984-145-355-261017",
      "returnQuantity": 2,
      "unitPrice": 1450.00,
      "itemCondition": "Restockable"
    }
  ]
}
```

---

### 5.4 List & Detail Views (`/api/Return/GetAll`, `/api/Return/GetById/{id}`)
* **List Route:** `GET /api/Return/GetAll?pageNumber=1&pageSize=10&status=Submitted`
* **Detail Route:** `GET /api/Return/GetById/1`

#### Filter Parameters for `GetAll`:
* `pageNumber` *(int)*
* `pageSize` *(int)*
* `searchTerm` *(string — matches return number, order number, client name)*
* `status` *(string — `Draft`, `Submitted`, `Approved`, `Rejected`)*
* `warehouseId` *(int, optional)*
* `startDate` / `endDate` *(datetime, optional)*

---

### 5.5 Approve Return & Auto-Generate Credit Note (`/api/Return/{id}/Approve`)
When an authorized user (Account Team / Admin) approves the return request:
1. All line items with `itemCondition = "Restockable"` are **automatically restocked** into `ProductVariants.CurrentQuantity`.
2. A linked **Credit Note** is automatically generated in `credit_notes` and `credit_note_items` with status `Pending`.
3. `ReturnRequests.CreditNoteId` is permanently linked.

* **Method:** `POST`
* **Route:** `/api/Return/{id}/Approve`
* **Required Permission:** `Returns.Approve` (Account Team, Admin, Super Admin)

#### Request Payload:
```json
{
  "remarks": "Approved after inspection. Restocked to shelf. Credit note triggered for accounts adjustment."
}
```

#### Success Response (`200 OK`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Return request #1 approved successfully. Linked Credit Note CR-2026-0005 generated automatically.",
  "data": {
    "returnId": 1,
    "returnNumber": "RET-2026-0001",
    "status": "Approved",
    "creditNoteId": 5,
    "creditNoteNumber": "CR-2026-0005"
  }
}
```

---

### 5.6 Reject Return Request (`/api/Return/{id}/Reject`)
Rejects a return intake (e.g. counterfeit, unapproved return).

* **Method:** `POST`
* **Route:** `/api/Return/{id}/Reject`
* **Required Permission:** `Returns.Approve`

#### Request Payload:
```json
{
  "remarks": "Product seal broken and serial mismatch. Return rejected as per company policy."
}
```

---

### 5.7 View Linked Credit Note (`/api/CreditNote/ByReturn/{returnId}`)
Retrieves the financial Credit Note created from a return request.

* **Method:** `GET`
* **Route:** `/api/CreditNote/ByReturn/{returnId}`

#### Success Response (`200 OK`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Credit note retrieved successfully for return request.",
  "data": {
    "creditNoteId": 5,
    "creditNoteNumber": "CR-2026-0005",
    "returnId": 1,
    "orderId": 3858,
    "orderNumber": "SO-20261016-6306",
    "clientId": 10,
    "clientName": "Dr. Rajoli Brahmanand Clinic",
    "totalCreditAmount": 2900.00,
    "status": "Pending",
    "createdAt": "2026-11-03T15:30:00",
    "items": [
      {
        "creditNoteItemId": 12,
        "creditNoteId": 5,
        "productId": 145,
        "productName": "Cosmetics",
        "variantId": 355,
        "variantName": "Formula H, Serum",
        "quantity": 2,
        "unitPrice": 1450.00,
        "totalPrice": 2900.00,
        "returnReason": "Damaged in Transit"
      }
    ]
  }
}
```

---

## 6. Frontend Quick-Check Summary for Developers

| Feature | Screen / Component | What to Change / Add |
| :--- | :--- | :--- |
| **Separate Addresses** | Quotation / PI / SO Forms | Add `Billing Address` and `Shipping Address` textareas with a `"Shipping is same as Billing"` checkbox. |
| **PI Validity Removal** | Proforma Invoice UI & PDF | Remove `validityDays` input from PI forms and remove the validity row from PI PDF printouts. |
| **Source Lead Dropdown** | Sales Order Form | Add `"Source Lead"` dropdown (`Direct Call`, `Website / Portal`, `Doctor Referral`, `Exhibition`, etc.). |
| **Sales Lot Masking** | Product Details / Catalog | For `Sales Person` role, hide the lot breakdown table. Display only the aggregate `availableStock`. |
| **Master Price Lock** | Product Master Edit Screen | Disable `sellingPrice` and `purchasePrice` inputs for non-SuperAdmin users. |
| **Accounts Invoicing** | New Accounts Invoicing Tab | Fetch `GET /api/Accounts/InvoicingQueue`. Add button **"Generate Tax Invoice"** opening modal for `invoiceNumber`, `invoiceDate`, `freight`, `roundOff`. |
| **Return Reasons** | Return Entry Form | Populate reason dropdown using `GET /api/Return/Reasons`. |
| **Draft Return Mode** | Return Entry Form | Provide two submit buttons: **"Save as Draft"** (`status: "Draft"`) and **"Submit Return"** (`status: "Submitted"`). |
| **Auto Credit Note** | Return Details Screen | Display badge with linked `creditNoteNumber` when return status is `Approved`. Add click to navigate to Credit Note view. |

