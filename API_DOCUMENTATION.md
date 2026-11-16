# CKTracker — Comprehensive REST API Reference

Base URL: `http://localhost:5000/api` (or production Railway host)  
Authentication: Bearer JWT token in header `Authorization: Bearer <TOKEN>`

All responses follow standard JSON formatting:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional feedback message"
}
```

---

## 1. Authentication & User Management (`/api/auth`, `/api/users`)

### `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@cktracker.com",
    "password": "Admin@123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "usr_01",
      "email": "admin@cktracker.com",
      "firstName": "Arun",
      "lastName": "Mehta",
      "role": "ADMIN"
    }
  }
  ```

### `GET /api/auth/me`
- **Access**: Authenticated (`ADMIN`, `MANAGER`, `DESIGNER`, `CUSTOMER`)
- **Returns**: Current authenticated profile.

### `PUT /api/auth/change-password`
- **Access**: Authenticated
- **Body**: `{ "currentPassword": "...", "newPassword": "..." }`

### `GET /api/users`
- **Access**: `ADMIN`
- **Query Params**: `role`, `status`, `page`, `limit`
- **Returns**: Paginated list of staff members.

### `POST /api/users`
- **Access**: `ADMIN`
- **Body**: `{ "email": "...", "firstName": "...", "lastName": "...", "role": "MANAGER", "phone": "..." }`

### `PATCH /api/users/:id/status`
- **Access**: `ADMIN`
- **Body**: `{ "status": "ACTIVE" | "INACTIVE" }`

---

## 2. Customer CRM & Lead Management (`/api/customers`, `/api/leads`, `/api/appointments`)

### `GET /api/customers`
- **Access**: `ADMIN`, `MANAGER`
- **Query Params**: `search`, `page`, `limit`
- **Returns**: List of customer profiles with linked project IDs.

### `POST /api/customers`
- **Access**: `ADMIN`, `MANAGER`
- **Body**:
  ```json
  {
    "firstName": "Siddharth",
    "lastName": "Kapoor",
    "email": "siddharth@example.com",
    "phone": "+91 9811122334",
    "address": "Flat 802, Palm Heights, Gurugram",
    "propertyType": "4BHK Apartment",
    "kitchenDimensions": "14ft x 10ft L-Shape",
    "estimatedBudget": 650000,
    "preferredStyle": "Modern Minimalist",
    "leadSource": "Showroom Walk-in"
  }
  ```

### `GET /api/customers/:id`
- **Access**: `ADMIN`, `MANAGER`, or the `CUSTOMER` themselves.

### `GET /api/leads`
- **Access**: `ADMIN`, `MANAGER`
- **Returns**: Lead pipeline organized by stages: `NEW`, `CONTACTED`, `INTERESTED`, `SITE_VISIT_SCHEDULED`, `QUOTATION_SENT`, `CONVERTED`, `LOST`.

### `PATCH /api/leads/:id/stage`
- **Access**: `ADMIN`, `MANAGER`
- **Body**: `{ "stage": "CONVERTED" }`

### `POST /api/appointments`
- **Access**: `ADMIN`, `MANAGER`
- **Body**:
  ```json
  {
    "customerId": "cust_id",
    "title": "Laser Site Measurement & Structural Survey",
    "scheduledAt": "2026-11-20T10:30:00Z",
    "location": "Customer Site",
    "notes": "Verify plumb lines and chimney exhaust hole positioning."
  }
  ```

---

## 3. Project Engine & 14-Stage Lifecycle (`/api/projects`)

### `GET /api/projects`
- **Access**: `ADMIN`, `MANAGER`, `CUSTOMER` (auto-filtered to own project for customers).
- **Query Params**: `status`, `stageNumber`, `search`, `page`

### `POST /api/projects`
- **Access**: `ADMIN`
- **Body**:
  ```json
  {
    "customerId": "cust_01",
    "managerId": "mgr_01",
    "title": "Island Kitchen with Acrylic Finish",
    "kitchenType": "ISLAND",
    "budget": 750000,
    "startDate": "2026-11-20"
  }
  ```
  *Initializes all 14 stages in sequential dependency automatically.*

### `GET /api/projects/:id`
- **Access**: `ADMIN`, `MANAGER` (if assigned), `CUSTOMER` (if project owner).
- **Returns**: Project details, current stage, all 14 stages, delay logs, and progress photos.

### `PATCH /api/projects/:id/stages/:stageNumber`
- **Access**: `ADMIN`, `MANAGER`
- **Body**:
  ```json
  {
    "status": "COMPLETED",
    "remarks": "Laser measurement complete; CAD imported.",
    "delayReason": "Required only if status is DELAYED"
  }
  ```
- **Business Rule**: Fails with `400 Bad Request` if stage $N-1$ is not completed.

### `POST /api/projects/:id/stages/:stageNumber/photos`
- **Access**: `ADMIN`, `MANAGER`
- **Payload**: `multipart/form-data` with `photo` and optional `caption`.

---

## 4. Kitchen Design Management (`/api/designs`)

### `GET /api/designs/project/:projectId`
- **Access**: `ADMIN`, `MANAGER`, `DESIGNER`, `CUSTOMER` (owner)
- **Returns**: 2D floor plans, 3D photorealistic renders, revision histories.

### `POST /api/designs`
- **Access**: `ADMIN`, `MANAGER`, `DESIGNER`
- **Payload**: `multipart/form-data` (`designFile`, `title`, `type` [`LAYOUT_2D`, `RENDER_3D`], `version`, `projectId`)

### `PATCH /api/designs/:id/status`
- **Access**: `CUSTOMER` (or `ADMIN`)
- **Body**:
  ```json
  {
    "status": "APPROVED",
    "comment": "Renders look great. Approved to proceed with quotation."
  }
  ```

---

## 5. Quotations & Billing Management (`/api/quotations`)

### `GET /api/quotations/project/:projectId`
- **Access**: `ADMIN`, `MANAGER`, `CUSTOMER` (owner)
- **Returns**: List of quotation versions (V1, V2, etc.).

### `POST /api/quotations`
- **Access**: `ADMIN`
- **Body**:
  ```json
  {
    "projectId": "proj_01",
    "customerId": "cust_01",
    "items": [
      {
        "category": "Base Cabinets",
        "description": "Marine Ply Waterproof Base Carcass (Hettich hardware)",
        "quantity": 12,
        "unit": "RFT",
        "unitPrice": 4500
      },
      {
        "category": "Countertops",
        "description": "Kalinga Stone Calacatta Quartz Countertop",
        "quantity": 45,
        "unit": "SQFT",
        "unitPrice": 950
      }
    ],
    "discount": 15000,
    "terms": "50% Advance with PO, 40% Pre-Dispatch, 10% On Handover."
  }
  ```
- **Tax Calculation**: Automated subtotal + 18% GST - discount.

### `GET /api/quotations/:id/pdf`
- **Access**: `ADMIN`, `MANAGER`, `CUSTOMER`
- **Response**: Streams binary `application/pdf` generated via PDFKit.

### `PATCH /api/quotations/:id/status`
- **Access**: `CUSTOMER` (or `ADMIN`)
- **Body**: `{ "status": "APPROVED" | "REJECTED", "remarks": "..." }`

---

## 6. Payments & Revenue (`/api/payments`)

### `POST /api/payments`
- **Access**: `ADMIN`
- **Body**:
  ```json
  {
    "projectId": "proj_01",
    "invoiceId": "inv_01",
    "amount": 250000,
    "paymentMethod": "NEFT",
    "transactionRef": "NEFT-HDFC-99283711",
    "notes": "Stage 6 Advance Production Payment (50%)"
  }
  ```
- **Response**: Generates receipt code `RCPT-2026-XXX` and recalculates remaining invoice balance.

### `GET /api/payments/:id/receipt-pdf`
- **Access**: `ADMIN`, `MANAGER`, `CUSTOMER`
- **Response**: Streams PDF receipt generated via PDFKit.

---

## 7. Inventory & Material Management (`/api/inventory`)

### `GET /api/inventory`
- **Access**: `ADMIN`, `MANAGER`
- **Returns**: Stock quantities, reorder thresholds, and material categories.

### `POST /api/inventory/allocate`
- **Access**: `ADMIN`
- **Body**:
  ```json
  {
    "projectId": "proj_01",
    "inventoryItemId": "inv_item_01",
    "quantityAllocated": 15
  }
  ```
- **Business Rule**: Fails with `400` if requested quantity exceeds current stock.

---

## 8. Enterprise Analytics & Executive Reports (`/api/analytics`)

### `GET /api/analytics/dashboard`
- **Access**: `ADMIN`
- **Returns**:
  - `revenueSummary`: Total quotation value, total received, pending revenue.
  - `projectDistribution`: Active, manufacturing, installation, completed.
  - `leadFunnel`: Conversion rates across 7 CRM stages.
  - `stageDelays`: Identified bottlenecks and average cycle time.

---

## 9. Support & Warranty Management (`/api/support`)

### `POST /api/support/tickets`
- **Access**: `CUSTOMER`, `ADMIN`, `MANAGER`
- **Body**:
  ```json
  {
    "projectId": "proj_01",
    "subject": "Soft-close hinge adjustment on spice pullout",
    "description": "The drawer needs minor tension alignment.",
    "priority": "LOW"
  }
  ```

### `GET /api/support/warranties/project/:projectId`
- **Access**: `ADMIN`, `MANAGER`, `CUSTOMER`
- **Returns**: 10-Year Hardware & 5-Year Woodwork Warranty Certificate with coverage terms.
