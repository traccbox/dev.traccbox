# Daily Worker Attendance & Payout

## Goal
Add the specification's MVP payout workflow to the existing authenticated TraccBOX dashboard without changing existing attendance or work-area behavior.

## Build
- Add a dedicated dashboard module with a daily payout board, attendance and payout history, site/geofence setup, same-day worker registration, worker search/history, and payout-slip viewer.
- Add the worker-facing daily attendance experience: today's status, geofenced clock-in/out, result, earnings, slip, and payout history.
- Reuse the existing API client, authentication, dashboard layout, permissions, maps, dialogs, form controls, and design tokens.
- Add typed API functions for the specification's worker, site, attendance, payout, approval/payment, and slip endpoints; no local mock records or client-side authority over geofence decisions, official timestamps, or wage calculations.
- Include filters, validation, loading/empty/error/retry/success states, confirmations, and status-appropriate actions. Hold incomplete or invalid attendance from payout actions.

## Technical details
- Add the feature under `src/pages/Dashboard/features/payout/` and typed API support under `src/api/payout/`; register protected dashboard routes and navigation entries.
- Treat the uploaded document as the product source of truth. Use the suggested `/workers`, `/sites`, `/attendance`, and `/payouts` endpoint families and keep server-calculated wage and geofence results authoritative.
- The specification defines endpoint purposes but not complete response schemas. Normalize documented fields in the client and handle standard API errors; confirm integration against live backend responses when available.

## Verification
- Check dashboard route and navigation, responsive worker/admin views, form and action states, and the newest build diagnostics.
- Audit every suggested endpoint against the new API layer and every MVP screen/flow against the acceptance criteria.
