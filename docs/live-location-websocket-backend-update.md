# Live Location Tracking: WebSocket Backend Update

Audience: backend team. Covers what the dashboard uses today, what the mobile app now sends, and the backend changes needed so the dashboard keeps working.

## 1. Endpoints

| Client | URL | Auth |
|---|---|---|
| Dashboard (admin) | `wss://api.traccbox.com/ws/admin/{company_id}?token={access_token}` | JWT in query string |
| Mobile app (staff) | `wss://api.traccbox.com/ws/staff/{company_id}/{staff_id}?token={access_token}` | JWT in query string |

- Dashboard `company_id` is `staff.company_id`, or `user.id` for owner accounts.
- Close code `1008` is treated by the dashboard as an auth failure and it stops reconnecting. Otherwise it retries 5 times, 3 seconds apart.

Other REST/third-party calls on the dashboard live-tracking page (for reference):

| Call | Purpose |
|---|---|
| `GET /api/v1/{company_id}/all_staffs` (Bearer token) | Staff names/details, matched to WebSocket `staff_id` |
| `GET https://nominatim.openstreetmap.org/reverse?...` | Third party; reverse-geocodes coordinates because `address` is usually missing |

## 2. Mobile app to backend (new payload)

Previous payload (no `type`, no IDs in the body):

```json
{
  "latitude": 6.5244,
  "longitude": 3.3792,
  "accuracy": 12.5,
  "altitude": 30.1,
  "heading": 180,
  "speed": 0.5,
  "timestamp": "2026-11-18T10:15:30.000Z"
}
```

New payload:

```json
{
  "type": "location",
  "employee_id": "string",
  "company_id": "string",
  "work_area_id": "string",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "accuracy": 12.5,
  "altitude": 30.1,
  "heading": 180,
  "speed": 0.5,
  "timestamp": "2026-11-18T10:15:30.000Z"
}
```

## 3. Dashboard to backend (requests)

| When | Payload |
|---|---|
| On connect, and on "refresh all" | `{"action":"get_all"}` |
| When a single staff is selected | `{"action":"get_one","staff_id":"<staff_id>"}` |

## 4. Backend to dashboard (what it parses today)

Bulk reply to `get_all`:

```json
{
  "status": "success",
  "total_online_staff": 2,
  "locations": {
    "<staff_id>": {
      "latitude": 6.5244,
      "longitude": 3.3792,
      "timestamp": "2026-11-18T10:15:30.000Z",
      "task_status": "in_progress",
      "address": "optional",
      "geofence": {
        "inside": true,
        "work_area_id": "uuid|null",
        "location_id": "uuid|null",
        "distance_from_edge": 12.5,
        "can_clock_in": true,
        "reason": null,
        "violation_opened": false
      }
    }
  }
}
```

Single update (reply to `get_one`, or an unsolicited push on every location change):

```json
{ "staff_id": "<staff_id>", "location": { "...same location object..." } }
```

Error frame:

```json
{ "status": "error", "message": "..." }
```

The dashboard keys everything by `staff_id` and merges updates. It never removes a staff entry.

## 5. Gap: new mobile payload vs. dashboard format

| Mobile sends | Dashboard needs |
|---|---|
| flat `employee_id` | `staff_id` at top level |
| flat `latitude`, `longitude`, ... | nested under `location` |
| `accuracy`, `altitude`, `heading`, `speed` | not in the dashboard type yet (will be added) |
| `work_area_id` | `location.geofence.work_area_id` |
| nothing | `task_status`, `address`, `geofence.*` (server-computed) |

## 6. Required backend changes

1. **Translate and nest before broadcasting to admins.** Example frame:
   ```json
   {
     "type": "location_update",
     "staff_id": "<employee_id>",
     "location": {
       "latitude": 6.5244,
       "longitude": 3.3792,
       "accuracy": 12.5,
       "altitude": 30.1,
       "heading": 180,
       "speed": 0.5,
       "timestamp": "2026-11-18T10:15:30.000Z",
       "task_status": "in_progress",
       "address": null,
       "geofence": {
         "inside": true,
         "work_area_id": "…",
         "location_id": "…",
         "distance_from_edge": 12.5,
         "can_clock_in": true,
         "reason": null,
         "violation_opened": false
       }
     }
   }
   ```
   Confirm `employee_id` equals the `staff_id` used in the URL and in `/all_staffs`.
2. **Push every incoming update to all admin sockets of that company** on `/ws/admin/{company_id}`. Throttling is fine (for example 1 update per staff every 2-5 seconds).
3. **`get_all` and `get_one` replies** must include the new fields (`accuracy`, `altitude`, `heading`, `speed`, `work_area_id`) in the same `location` shape, served from a last-known-location cache.
4. **Compute `geofence` and `task_status` on the server.** Mobile does not send them. Use the incoming `work_area_id` to check the point and fill `inside`, `distance_from_edge`, `can_clock_in`, `reason`, `violation_opened`.
5. **Validate the staff socket.**
   - Token must be valid and match the `company_id` and `staff_id` in the path.
   - Ignore or reject `employee_id` and `company_id` in the body if they differ from the token and path.
   - Close with `1008` on auth failure. Reply with an error frame on a malformed payload.
6. **Offline event.** When a staff socket closes, or no update arrives for N seconds, send admins `{"type":"staff_offline","staff_id":"…","last_seen":"<ts>"}`. Also drop offline staff from `get_all` and `total_online_staff`. Without this, stale pins stay on the map.
7. **Backward compatibility.** Keep the existing admin frame shapes and add `type` as an extra field. Old mobile builds send no `type`, so the staff endpoint should accept both payloads during rollout.

## 7. Recommended additions

- Add `type` to every admin frame: `locations_snapshot`, `location_update`, `staff_offline`, `error`. Add `code` to errors (for example `STAFF_OFFLINE`, `UNAUTHORIZED`).
- Heartbeat: `{"action":"ping"}` returns `{"type":"pong"}` on both sockets.
- Document units: `speed` in m/s, `heading` in degrees, `altitude` and `accuracy` in metres, `distance_from_edge` in metres, `timestamp` in UTC ISO 8601.
- Define the allowed `task_status` enum.
- List other `type` values the mobile app may send (clock-in, panic, and so on).
- Move the token out of the query string (subprotocol or first auth message). At minimum, do not log full URLs.
- Resume support: `{"action":"get_all","since":"<ts>"}`.

## 8. Questions for backend

1. Is `employee_id` identical to `staff_id`?
2. Will the server compute `geofence` and `task_status`? If not, the dashboard drops them.
3. Will `staff_offline` be sent, and after how many seconds of silence?
4. Are `get_all` / `get_one` kept as-is?
5. What is the throttle interval for admin pushes?

## 9. Frontend work (dashboard side, after backend confirms)

- Add `accuracy`, `altitude`, `heading`, `speed` to `StaffLocation` and show them on the map.
- Handle `type`, `location_update` and `staff_offline` frames.
- Remove the token-bearing URL from console logs.
- Connect only on the GPS page, and add exponential backoff.

Relevant files: `src/hooks/useLocationTracking.ts`, `src/contexts/LocationTrackingContext.tsx`, `src/pages/Dashboard/features/gps/LocationTracking.tsx`, `src/components/maps/LocationMap.tsx`.
