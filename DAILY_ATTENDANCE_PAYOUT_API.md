# TraccBOX Daily Attendance & Payout API

**Audience:** TraccBOX backend team  
**Source of truth:** *Daily Geofenced Worker Attendance & Payout — Development Specification / MVP PRD*, version 1.0 (September 2026), plus the current Daily Attendance & Payout screens.  
**Base path:** `/api/v1`  
**Currency:** NGN (`₦`)

This document defines the API contract needed by the Daily Attendance & Payout feature: same-day worker registration using an existing staff record, shared Work Areas/geofences, attendance, server-calculated payouts, approvals, payment recording, worker history, and payslips.

## 1. Contract conventions

### Authentication and company scope

- All endpoints require `Authorization: Bearer <access_token>` over HTTPS, except where the existing authentication policy explicitly says otherwise.
- Derive the company from the authenticated token. Do not trust a client-supplied `company_id` to authorize or scope a payout, worker, attendance, or Work Area.
- The existing staff-directory endpoint includes a company ID in its path; the caller must use the company ID associated with the authenticated administrator.
- Enforce role/permission checks on the server. Workers may read only their own attendance, payout, and slip records. Company administrators and authorized supervisors may use company-wide management endpoints.

### JSON and pagination

JSON requests and responses use `Content-Type: application/json` unless a download is returned. Dates are ISO 8601 calendar dates (`YYYY-MM-DD`); timestamps are ISO 8601 UTC strings. Coordinates use decimal degrees, WGS84. Monetary values are decimal numbers in NGN, not formatted strings.

Collection responses use this envelope:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 0,
    "total_pages": 0
  }
}
```

Use `page` (one-based, default `1`) and `limit` (default `25`, maximum `100`). For compatibility with current client list normalization, the API may also return `total`/`page`/`limit` beside `data`; the values must be consistent.

### Errors

Use a consistent error body and suitable HTTP status:

```json
{
  "error": {
    "code": "ATTENDANCE_ALREADY_CLOCKED_IN",
    "message": "A valid clock-in already exists for this worker today.",
    "details": {},
    "request_id": "req_01J..."
  }
}
```

Recommended statuses: `400` malformed request, `401` unauthenticated, `403` unauthorized, `404` resource not found or outside the caller's company, `409` duplicate/invalid state transition, `422` field or business-rule validation failure, `429` rate limited, and `500` unexpected server error. Never silently replace an API failure with fabricated attendance, geofence, worker, or payout records.

## 2. Shared staff and Work Areas

### Existing staff directory — no new staff-creation API required

The registration form selects an employee already created in User Roles & Permissions. Reuse the existing endpoint:

```http
GET /api/v1/{company_id}/all_staffs
```

There is no request body. Preserve the existing endpoint and response behavior (the current team screen consumes a staff array; the payout selector also tolerates a `data`, `staffs`, or `all_staffs` array wrapper).

Example staff record (return only directory fields needed by the caller; do not return credentials, tokens, or permission secrets):

```json
{
  "id": "staff_7f42",
  "full_name": "Musa Ibrahim",
  "email": "musa@example.com",
  "phone_number": "+2348031234567",
  "job_title": "Mason",
  "role": "field_worker",
  "department": "Construction",
  "status": "active"
}
```

The selected staff ID is sent as `staff_id` when registering that person's daily worker record. The backend must verify that the staff member belongs to the authenticated company and is eligible for work. Do not create a duplicate staff account as part of worker registration.

### Work Areas are the single source of geofence truth

The payout module must use the existing Work Areas records and their actual location boundaries/rules. It must not maintain an independent construction-site/geofence store. The canonical relationship is:

- `worker.site_id` (legacy payout field) is the **Work Area ID**. New integrations may send `work_area_id`; accept either name during migration and return both with the same ID while older clients still use `site_id`.
- Attendance's `site_id` is likewise the Work Area ID; `work_area_id` may be used as its canonical alias.
- A Work Area can have multiple locations and circle or polygon boundaries. Geofence decisions must use the complete Work Area locations/rules on the server, not a client-calculated center/radius approximation.
- Listing payout sites must read/projection-map the existing Work Areas. Creating a Work Area must use the existing Work Areas flow/endpoints. Do not create a second site record or geofence when a Work Area already exists.

The current payout screens call `GET /sites` and expect site-shaped records. During migration, keep this compatibility endpoint as a read-only projection of Work Areas; `id` must equal the Work Area ID. For circle-based single-location areas, `latitude`, `longitude`, and `geofence_radius` may expose the circle center/radius. For polygon or multi-location areas, those summary fields are not authoritative; retain the full Work Area boundary data for server validation. The existing app's `POST /sites` is legacy: if retained temporarily, it must create a Work Area through the same Work Areas service (for example a single-circle `construction_site` Work Area), never an independent site/geofence. Prefer linking users to the Work Areas screen for creation.

Existing Work Areas endpoint reference (these belong to the Work Areas API, not a duplicate payout API):

```http
GET  /api/v1/work-areas?page=1&limit=25&status=active
GET  /api/v1/work-areas/{work_area_id}
POST /api/v1/work-areas
```

The list/detail responses should expose the same Work Area ID, status, locations (including complete boundary geometry), and rules already used by the Work Areas module. The payout `GET /sites` compatibility projection is:

```json
{
  "data": [
    {
      "id": "wa_2001",
      "work_area_id": "wa_2001",
      "name": "Ikeja Construction Site",
      "project": "Housing Project Phase II",
      "address": "Ikeja, Lagos",
      "latitude": 6.6018,
      "longitude": 3.3515,
      "geofence_radius": 100,
      "status": "active",
      "locations": [
        {
          "id": "loc_2001",
          "name": "Main site",
          "boundary": { "kind": "circle", "center": [6.6018, 3.3515], "radius": 100 }
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 25
}
```

`GET /sites` query parameters: `page`, `limit`, `search`, `status`. Only return Work Areas the caller can access. If the response includes `locations`, its geometry must match the Work Areas response exactly.

## 3. Resource models

The examples below define the recommended normalized response fields. IDs are opaque strings. Additional server-managed fields may be included.

### Daily worker

```json
{
  "id": "worker_9001",
  "staff_id": "staff_7f42",
  "name": "Musa Ibrahim",
  "phone": "+2348031234567",
  "email": "musa@example.com",
  "role": "Mason",
  "site_id": "wa_2001",
  "work_area_id": "wa_2001",
  "site": { "id": "wa_2001", "name": "Ikeja Construction Site" },
  "daily_wage": 7000,
  "standard_hours": 8,
  "payment_method": "transfer",
  "bank_name": "Example Bank",
  "account_number": "0123456789",
  "account_name": "Musa Ibrahim",
  "status": "active",
  "registered_at": "2026-09-11T06:45:00Z"
}
```

`payment_method` is `transfer` or `cash`. Bank fields are required for transfer, optional/not applicable for cash. Account number is a string so leading zeroes are preserved. Return bank/account details only to authorized company users who need to administer payments; do not expose them to unrelated workers.

### Attendance and geofence evidence

```json
{
  "id": "att_3001",
  "worker_id": "worker_9001",
  "site_id": "wa_2001",
  "work_area_id": "wa_2001",
  "date": "2026-09-11",
  "clock_in": {
    "timestamp": "2026-09-11T06:55:00Z",
    "latitude": 6.60181,
    "longitude": 3.35153,
    "accuracy": 12,
    "distance_m": 4,
    "status": "verified"
  },
  "clock_out": {
    "timestamp": "2026-09-11T14:30:00Z",
    "latitude": 6.60179,
    "longitude": 3.35155,
    "accuracy": 10,
    "distance_m": 5,
    "status": "verified"
  },
  "clock_in_time": "06:55 AM",
  "clock_out_time": "02:30 PM",
  "clock_in_status": "verified",
  "clock_out_status": "verified",
  "hours_worked": 7.58,
  "hours_worked_minutes": 455,
  "status": "completed"
}
```

Allowed geofence statuses: `verified`, `rejected`, `flagged`, `unverified`, `unable_to_verify`. Attendance status examples: `no_clock_in`, `clocked_in`, `completed`, `incomplete`, `rejected_geofence`. Persist official timestamps and derived results on the server.

### Payout and slip

```json
{
  "id": "pay_4001",
  "worker_id": "worker_9001",
  "staff_id": "staff_7f42",
  "worker_name": "Musa Ibrahim",
  "worker": { "id": "worker_9001", "staff_id": "staff_7f42", "name": "Musa Ibrahim", "role": "Mason" },
  "attendance_id": "att_3001",
  "site_id": "wa_2001",
  "work_area_id": "wa_2001",
  "site_name": "Ikeja Construction Site",
  "date": "2026-09-11",
  "daily_wage": 7000,
  "hourly_rate": 875,
  "payable_hours": 7.58,
  "hours_worked": 7.58,
  "amount": 6632.5,
  "status": "pending",
  "reference": "TB-PAY-20260911-4821",
  "payment_method": "transfer",
  "bank_name": "Example Bank",
  "account_number": "0123456789",
  "account_name": "Musa Ibrahim",
  "attendance": {},
  "generated_at": "2026-09-11T14:31:00Z",
  "approved_at": null,
  "approved_by": null,
  "paid_at": null,
  "paid_by": null,
  "payment_reference": null
}
```

Payout status is `pending`, `approved`, or `paid`. The backend owns the amount, payable hours, rounding, full-day threshold, minimum-hours rules, and all wage calculation; it must load the effective worker/customer configuration rather than trusting a client amount. Return a stable unique payout `reference`.

## 4. Endpoints

### 4.1 Work-area/site list

```http
GET /api/v1/sites?page=1&limit=25&search=Ikeja&status=active
```

Returns the compatibility projection of existing Work Areas described above. **Do not back this route with a separate payout sites table.** Work Area creation should take place in Work Areas, not this list endpoint.

### 4.2 Register a worker for today's work

```http
POST /api/v1/workers
```

Request:

```json
{
  "staff_id": "staff_7f42",
  "name": "Musa Ibrahim",
  "phone": "+2348031234567",
  "role": "Mason",
  "site_id": "wa_2001",
  "daily_wage": 7000,
  "standard_hours": 8,
  "payment_method": "transfer",
  "bank_name": "Example Bank",
  "account_number": "0123456789",
  "account_name": "Musa Ibrahim"
}
```

`staff_id` is required when selected from the existing staff directory. For a transition period, the endpoint may accept a legacy same-day worker with no `staff_id` if the company policy allows it; the new staff-linked UI should always supply `staff_id`. Accept `site_id` as the existing client field and/or `work_area_id` as its canonical alias. Exactly one Work Area must be resolved. Do not accept a new client-supplied worker ID, registration date, status, attendance result, or payout amount. Server sets the worker ID, company, current registration time, and active-for-day status.

Validation: selected staff exists, belongs to this company and is eligible; Work Area exists, is active and accessible; `daily_wage > 0`; `standard_hours > 0`; `payment_method` is `cash` or `transfer`; transfer requires bank name and a valid account number; duplicate active worker registration for the same staff and workday should return the existing record or a clear `409` according to the product's idempotency policy (do not create duplicates).

Success: `201 Created`, response body is the Daily worker model, including server-generated `id`, `registered_at`, and linked `staff_id`/Work Area ID.

### 4.3 List workers and inspect one worker

```http
GET /api/v1/workers?page=1&limit=25&search=Musa&site_id=wa_2001&status=active
GET /api/v1/workers/{worker_id}
```

List filters: `page`, `limit`, `search` (name, phone, worker ID, staff ID), `site_id`/`work_area_id`, `status`, and optionally `date` for the daily worker roster. List returns the standard collection envelope with Daily worker records. Detail returns one Daily worker record. Search/filter must be company-scoped.

### 4.4 Read attendance history

Daily attendance used by a worker portal:

```http
GET /api/v1/attendance/{worker_id}/{date}
```

Returns one Attendance model. If no attendance exists, return `200` with the worker/date and `status: "no_clock_in"`, or return `404` consistently if the client is updated to treat that as an empty state. Do not fabricate an attendance record or timestamp.

Admin attendance board and history:

```http
GET /api/v1/attendance?page=1&limit=25&date=2026-09-11&from=2026-09-01&to=2026-09-30&site_id=wa_2001&worker_id=worker_9001&status=completed&search=Musa
GET /api/v1/workers/{worker_id}/attendance?page=1&limit=25&from=2026-09-01&to=2026-09-30
```

The first endpoint returns the standard collection envelope of Attendance models and supports `date` (exact day), `from`, `to`, `site_id`/`work_area_id`, `worker_id`, `status`, `search`, `page`, and `limit`. `date` takes precedence over a range when both are provided. The second is a worker-specific history shortcut; worker authorization must restrict it to that worker's own ID. Return only server-recorded evidence.

### 4.5 Clock in

```http
POST /api/v1/attendance/clock-in
```

Request:

```json
{
  "worker_id": "worker_9001",
  "site_id": "wa_2001",
  "latitude": 6.60181,
  "longitude": 3.35153,
  "accuracy": 12
}
```

`site_id` is the linked Work Area ID; `work_area_id` is an accepted canonical alias. Client-provided date/time and geofence status are not accepted as authoritative inputs. Server verifies authenticated worker/authorized supervisor, worker active status and company, assignment to that Work Area, current workday, valid coordinate ranges, GPS accuracy policy, Work Area's complete location boundaries and rules, and no existing valid clock-in. Server stores its own timestamp, received coordinates/accuracy, computed distance and geofence status.

Success: `201 Created` with the updated Attendance model. An outside-boundary or unverifiable result follows configured policy (`rejected`, `flagged`, or `unable_to_verify`) and is returned explicitly. Duplicate valid clock-in returns `409` with code `ATTENDANCE_ALREADY_CLOCKED_IN`; invalid assignment returns `403` or `422`.

### 4.6 Clock out

```http
POST /api/v1/attendance/clock-out
```

Request uses the same fields as clock-in:

```json
{
  "worker_id": "worker_9001",
  "site_id": "wa_2001",
  "latitude": 6.60179,
  "longitude": 3.35155,
  "accuracy": 10
}
```

Require a valid clock-in for this workday; reject duplicate clock-out and a timestamp earlier than clock-in. Validate the same assigned Work Area and geofence rules. Record the server timestamp and geofence evidence and calculate elapsed hours/minutes on the server. Success returns the completed Attendance model. A missing clock-in returns `409` (`CLOCK_IN_REQUIRED`); an incomplete attendance must remain ineligible for payout.

### 4.7 Calculate payout

```http
POST /api/v1/payouts/calculate
```

Request:

```json
{
  "worker_id": "worker_9001",
  "attendance_id": "att_3001"
}
```

No amount, rate, payable hours, or status is accepted from the caller. Require a completed attendance with valid/approved clock events under company policy. Calculate full-day or partial-day pay using the effective customer configuration:

- `hourly_rate = daily_wage / standard_hours`
- Partial-day pay is the hourly rate multiplied by approved hours, using configured rounding.
- Full-day pay is daily wage once the configured full-day threshold is met.
- Minimum hours, break deductions, overtime, and rounding are configurable; do not hard-code them as universal rules.

Success: `201 Created` for a new payout, or `200 OK` returning the existing payout for an idempotent repeat for the same worker/attendance. Return the Payout model, including authoritative `amount`, `hourly_rate`, `payable_hours`, `status: "pending"`, unique reference, and associated attendance. Missing clock-in, missing clock-out, rejected evidence not authorized for review, or incomplete attendance must return `409`/`422` and must not create an approvable payout.

### 4.8 List payouts and payout history

```http
GET /api/v1/payouts?page=1&limit=25&date=2026-09-11&from=2026-09-01&to=2026-09-30&site_id=wa_2001&worker_id=worker_9001&status=approved&payment_method=transfer&search=Musa
GET /api/v1/workers/{worker_id}/payouts?page=1&limit=25&from=2026-09-01&to=2026-09-30
```

Filters: `page`, `limit`, `date` (exact day), `from`, `to` (inclusive), `site_id`/`work_area_id`, `worker_id`, `status`, `payment_method` (`cash` or `transfer`), and `search` (worker name/ID, staff ID, reference). `date` takes precedence over a date range. Return a standard collection envelope with Payout models and attendance summary/evidence needed by the dashboard. Honor status transitions and scope every record to the authenticated company. Worker payout history must be restricted to the signed-in worker.

### 4.9 Payout dashboard summary

The payslip dashboard displays counts and totals for a selected date or range. Provide an aggregate endpoint so paginated results do not produce misleading totals:

```http
GET /api/v1/payouts/summary?from=2026-09-01&to=2026-09-30&site_id=wa_2001&payment_method=transfer
```

Optional filters: `date`, `from`, `to`, `site_id`/`work_area_id`, `status`, `payment_method`. Response:

```json
{
  "data": {
    "from": "2026-09-01",
    "to": "2026-09-30",
    "currency": "NGN",
    "total_records": 84,
    "pending_count": 8,
    "approved_count": 12,
    "paid_count": 64,
    "pending_amount": 56000,
    "approved_amount": 82000,
    "paid_amount": 476000,
    "approved_and_paid_amount": 558000,
    "by_payment_method": {
      "transfer": { "count": 70, "pending_amount": 35000, "approved_amount": 62000, "paid_amount": 420000 },
      "cash": { "count": 14, "pending_amount": 21000, "approved_amount": 20000, "paid_amount": 56000 }
    },
    "monthly": [
      { "month": "2026-09", "record_count": 84, "approved_amount": 82000, "paid_amount": 476000 }
    ]
  }
}
```

Totals must use the same filters and company scope as the payout list. `approved_and_paid_amount` is the sum of approved and paid payout amounts; `paid_amount` includes only actually recorded payments. If this endpoint is not available at first, the UI may derive counts from a complete unpaginated list, but that is not suitable for a production paginated dashboard.

### 4.10 Approve a payout

```http
POST /api/v1/payouts/{payout_id}/approve
```

No request body is required; an optional body may contain `{ "note": "Attendance reviewed" }`. Take approver identity and timestamp from the authenticated session/server clock. Only authorized reviewers may approve. Require `status: "pending"` and eligible attendance; do not approve incomplete/invalid attendance. On success return the updated Payout model with `status: "approved"`, `approved_by`, and `approved_at`. Repeated/invalid state transitions return `409`.

### 4.11 Record a manual payment (no automatic bank transfer)

```http
POST /api/v1/payouts/{payout_id}/paid
```

This endpoint records that a company administrator has already paid the worker manually. It must **not** initiate a bank transfer or cash disbursement.

Transfer request:

```json
{
  "payment_method": "transfer",
  "payment_reference": "BANK-TRX-88201",
  "note": "Paid from company account"
}
```

Cash request:

```json
{
  "payment_method": "cash",
  "payment_reference": "CASH-VOUCHER-108",
  "note": "Cash handed to worker"
}
```

`payment_reference` may be omitted for cash if there is no voucher/reference; record any required audit note per company policy. For a transfer, require a reference when available/required by the company. The confirmed method should match the worker's registered method unless an authorized administrator is allowed to override it; if an override is allowed, retain both the registered and actual method in the audit record. Require `status: "approved"`; disallow marking a pending payout paid. Server sets `paid_at`, `paid_by`, and final `payment_reference`; amount is immutable. Return updated Payout model with `status: "paid"`. Record an audit trail for actor, timestamp, payout, method, reference, and note. A repeat request should not duplicate a payment; return the current record idempotently or `409` with `PAYOUT_ALREADY_PAID`.

### 4.12 Retrieve an individual payout slip

```http
GET /api/v1/payouts/{payout_id}/slip
```

Returns the generated/retrievable slip data as JSON (the client renders/downloads an individual PDF):

```json
{
  "data": {
    "company_name": "Example Construction Ltd",
    "payout_id": "pay_4001",
    "payout_reference": "TB-PAY-20260911-4821",
    "worker_name": "Musa Ibrahim",
    "worker_id": "worker_9001",
    "staff_id": "staff_7f42",
    "role": "Mason",
    "site_name": "Ikeja Construction Site",
    "work_area_id": "wa_2001",
    "work_date": "2026-09-11",
    "clock_in": { "timestamp": "2026-09-11T06:55:00Z", "status": "verified", "distance_m": 4 },
    "clock_out": { "timestamp": "2026-09-11T14:30:00Z", "status": "verified", "distance_m": 5 },
    "hours_worked": 7.58,
    "daily_wage": 7000,
    "standard_hours": 8,
    "hourly_rate": 875,
    "workday_type": "partial_day",
    "amount": 6632.5,
    "currency": "NGN",
    "payment_method": "transfer",
    "status": "approved",
    "payment_reference": null,
    "generated_at": "2026-09-11T14:31:00Z",
    "approved_at": "2026-09-11T15:00:00Z",
    "paid_at": null
  }
}
```

If the slip is generated before payment, represent `payment_reference`/`paid_at` as `null`. Return the latest authoritative payout state. Protect account details under the same access rules as worker records; the standard slip does not need to expose the full bank account number.

### 4.13 Export filtered payout records (recommended for large histories)

Current screens can download a client-generated PDF summary and a CSV file that opens in Excel. Those downloads do not require a separate backend endpoint while all matching data is present in the client. For large/paginated histories, add:

```http
GET /api/v1/payouts/export?format=csv&from=2026-09-01&to=2026-09-30&status=approved&site_id=wa_2001
GET /api/v1/payouts/export?format=xlsx&from=2026-09-01&to=2026-09-30
```

Supported formats: `csv` and `xlsx`. Apply the same company authorization and filters as `GET /payouts`; stream a file with a matching `Content-Type` and `Content-Disposition`. Export columns should include payout reference, worker/staff ID and name, role, Work Area, work date, hours, wage, payable amount, payment method, status, payment reference, approved time, and paid time. Do not export authentication credentials. A batch PDF export is client-rendered by the current screen and is not a required server endpoint.

## 5. Business rules and acceptance checks

1. Registering a daily worker links an existing company staff record (`staff_id`) and an existing Work Area ID; it must not create a second staff account or a second geofence.
2. `site_id` and `work_area_id`, if both are returned during migration, identify the same Work Area. All clock-in/out decisions use its live server-side location boundaries and rules.
3. Server timestamps, geofence evidence, elapsed hours, wage configuration, calculations, payout status, approver, and payment confirmation are authoritative. Never accept a client-computed status, amount, or official timestamp.
4. A worker can clock in only once per workday and can clock out only after a valid clock-in. A missing clock-out is incomplete and cannot be calculated/approved/paid.
5. A payout can be approved only after valid attendance and calculated amount exist. It can be marked paid only after approval and after manual disbursement actually occurred.
6. Payout generation and payment confirmation are idempotent. Duplicate clock events and invalid status transitions produce explicit errors without duplicating records.
7. Attendance/payout searches and totals are filterable by worker, Work Area, reference, date/range, status and payment method; all pagination totals match the filters.
8. Record authorized manual overrides with actor, reason, timestamp and relevant before/after values. Do not treat geofence verification as proof of work quality.
9. Keep customer-configurable full-day threshold, minimum-hours, break, overtime and rounding rules server-side and auditable.
10. Ensure no payout list, summary, slip, export, or staff link can return data outside the authenticated company. Workers may see only their own records.

## 6. Endpoint checklist

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/{company_id}/all_staffs` | Existing staff choices; reuse current User Roles & Permissions directory | Existing endpoint |
| GET | `/work-areas` | Existing source for available areas/geofences | Existing Work Areas API |
| GET | `/work-areas/{work_area_id}` | Existing detail and authoritative locations/rules | Existing Work Areas API |
| POST | `/work-areas` | Create area/geofence through existing Work Areas flow | Existing Work Areas API |
| GET | `/sites` | Compatibility projection of Work Areas (same IDs, no second store) | Required during client migration |
| POST | `/sites` | Optional legacy adapter that creates a Work Area, never a separate site | Temporary compatibility only |
| POST | `/workers` | Register daily worker linked to existing staff and Work Area | Required |
| GET | `/workers` | Filtered/paginated roster | Required |
| GET | `/workers/{worker_id}` | Worker detail | Required |
| GET | `/attendance/{worker_id}/{date}` | Daily attendance status | Required |
| GET | `/attendance` | Admin attendance history/board | Required for admin history |
| GET | `/workers/{worker_id}/attendance` | Worker attendance history | Required for worker history |
| POST | `/attendance/clock-in` | Verify geofence and record clock-in | Required |
| POST | `/attendance/clock-out` | Verify geofence, record clock-out, calculate hours | Required |
| POST | `/payouts/calculate` | Server-side daily/partial pay calculation | Required |
| GET | `/payouts` | Filtered/paginated payout and payslip records | Required |
| GET | `/workers/{worker_id}/payouts` | Worker payout history | Required for worker history |
| GET | `/payouts/summary` | Accurate dashboard counts/totals for date range | Recommended for production pagination |
| POST | `/payouts/{payout_id}/approve` | Approve eligible payout | Required |
| POST | `/payouts/{payout_id}/paid` | Record completed manual payment | Required |
| GET | `/payouts/{payout_id}/slip` | Retrieve authoritative single-slip data | Required |
| GET | `/payouts/export` | Server-side CSV/XLSX of filtered history | Recommended for large histories |

## 7. Current-client compatibility notes

- Current payout API calls use `/sites`, `site_id`, `/workers`, `/attendance/...`, and `/payouts/...`. Keep these routes/fields working during migration, while resolving site IDs to existing Work Areas.
- The current client can render a paginated payout response from `data` plus `total`, `page`, and `limit`. Prefer the standard `data`/`meta` envelope above and preserve the top-level pagination fields temporarily if needed.
- The current payslip page filters by a selected day, preset month windows, or custom `from`/`to`; it shows pending/approved/paid totals and payment method. The backend list and summary must implement these filters consistently.
- Current batch “Excel” download is CSV; an actual XLSX response is optional. Individual PDFs and the current batch PDF are rendered in the browser from the returned records/slip data.
- Current API client has offline/demo fallback behavior. Production API failures must be surfaced as errors; backend records and responses must never be replaced by demo data.
