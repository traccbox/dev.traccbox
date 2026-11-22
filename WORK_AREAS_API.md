# Work Areas (Geofencing) — API Specification

Base path: `/api/v1`
Auth: `Authorization: Bearer <access_token>` on every request.
All timestamps ISO-8601 UTC. All IDs are UUID strings.

## Shared objects

### Boundary
```json
{ "kind": "circle", "center": [6.5244, 3.3792], "radius": 200 }
```
```json
{ "kind": "polygon", "points": [[6.52,3.37],[6.53,3.38],[6.51,3.39]] }
```
`center`/`points` are `[latitude, longitude]`. `radius` in meters.

### Location (a work area can have many)
```json
{
  "id": "loc_01",
  "name": "Ikeja HQ",
  "method": "draw",              // draw | admin | manual
  "boundary": { "kind": "circle", "center": [6.6018, 3.3515], "radius": 300 },
  "address": "12 Alausa Way, Ikeja",
  "country": "Nigeria",
  "state": "Lagos",
  "lga": "Ikeja",
  "ward": "Ward A - Alausa",
  "community": "Alausa Secretariat"
}
```

### Rules
```json
{
  "working_days": ["Mon","Tue","Wed","Thu","Fri"],
  "working_hours": { "start": "08:00", "end": "17:00" },
  "allow_clock_in": true,
  "allow_clock_out": true,
  "gps_accuracy": 50,
  "allow_offline": false,
  "grace_period": 10,
  "auto_check_in": false,
  "auto_check_out": false,
  "entry_notification": true,
  "exit_notification": true,
  "violation_alerts": true
}
```

---

## 1. List work areas
`GET /work-areas?search=&type=&status=&page=1&limit=20`

Response 200
```json
{
  "data": [
    {
      "id": "wa_01",
      "name": "Lagos HQ Office",
      "description": "Head office",
      "type": "office",
      "status": "active",
      "locations": [ /* Location[] */ ],
      "employee_count": 24,
      "inside_count": 18,
      "created_at": "2026-01-10T09:00:00Z",
      "updated_at": "2026-01-12T09:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 37, "total_pages": 2 }
}
```

## 2. Work area stats (cards)
`GET /work-areas/stats`
```json
{
  "total_areas": 12,
  "active_areas": 10,
  "inactive_areas": 2,
  "employees_assigned": 148,
  "employees_inside": 96,
  "violations_today": 4
}
```

## 3. Get single work area
`GET /work-areas/{id}`
```json
{
  "id": "wa_01",
  "name": "Lagos HQ Office",
  "description": "Head office",
  "type": "office",
  "status": "active",
  "locations": [ /* Location[] */ ],
  "rules": { /* Rules */ },
  "employees": [
    { "id": "emp_1", "name": "Ada Obi", "email": "ada.obi@traccbox.com", "role": "Sales Rep", "department": "Sales", "team": "Alpha", "avatar": null, "status": "inside" }
  ],
  "created_at": "2026-01-10T09:00:00Z",
  "updated_at": "2026-01-12T09:00:00Z"
}
```

## 4. Create work area
`POST /work-areas`
```json
{
  "name": "Lagos HQ Office",
  "description": "Head office",
  "type": "office",
  "status": "active",
  "locations": [
    {
      "name": "Ikeja HQ",
      "method": "draw",
      "boundary": { "kind": "circle", "center": [6.6018, 3.3515], "radius": 300 },
      "address": "12 Alausa Way",
      "country": "Nigeria", "state": "Lagos", "lga": "Ikeja",
      "ward": "Ward A - Alausa", "community": "Alausa Secretariat"
    }
  ],
  "employee_ids": ["emp_1", "emp_2"],
  "rules": { /* Rules */ }
}
```
Response 201: full work area object (same shape as #3).

## 5. Update work area (partial)
`PATCH /work-areas/{id}`
Body: any subset of the create payload. Response 200: full work area object.

## 6. Replace work area
`PUT /work-areas/{id}` — same body as create. Response 200: full object.

## 7. Toggle status
`PATCH /work-areas/{id}/status`
```json
{ "status": "inactive" }
```
Response 200 `{ "id": "wa_01", "status": "inactive" }`

## 8. Delete work area
`DELETE /work-areas/{id}` → 204 (or `{ "success": true }`)

---

## Locations sub-resource

### 9. List locations
`GET /work-areas/{id}/locations` → `{ "data": [ /* Location[] */ ] }`

### 10. Add location
`POST /work-areas/{id}/locations`
```json
{
  "name": "Abuja Annex",
  "method": "admin",
  "boundary": { "kind": "circle", "center": [9.0579, 7.4951], "radius": 1000 },
  "country": "Nigeria", "state": "FCT", "lga": "Abuja Municipal",
  "ward": "Garki", "community": "Area 11"
}
```
Response 201: Location object.

### 11. Update location
`PATCH /work-areas/{id}/locations/{locationId}` → 200 Location object.

### 12. Delete location
`DELETE /work-areas/{id}/locations/{locationId}` → 204

---

## Employees sub-resource

### 13. Assign employees
`POST /work-areas/{id}/employees`
```json
{ "employee_ids": ["emp_3", "emp_4"] }
```
Response 200 `{ "assigned": 2, "employees": [ /* Employee[] */ ] }`

### 14. Remove employee
`DELETE /work-areas/{id}/employees/{employeeId}` → 204

### 15. Assignable employees (picker)
`GET /work-areas/employees?search=&department=&team=&page=1&limit=50`
```json
{
  "data": [
    { "id": "emp_1", "name": "Ada Obi", "email": "ada.obi@traccbox.com", "role": "Sales Rep", "department": "Sales", "team": "Alpha", "avatar": null }
  ],
  "meta": { "page": 1, "limit": 50, "total": 120 }
}
```

---

## Rules

### 16. Get rules
`GET /work-areas/{id}/rules` → Rules object

### 17. Update rules
`PATCH /work-areas/{id}/rules` — body: partial Rules → 200 Rules object

---

## Administrative hierarchy (for the Location wizard)

### 18. Countries
`GET /geo/countries`
```json
{ "data": [ { "code": "NG", "name": "Nigeria", "center": [9.082, 8.6753], "zoom": 6 } ] }
```

### 19. States
`GET /geo/states?country=NG`
```json
{ "data": [ { "id": "NG-LA", "name": "Lagos", "center": [6.5244, 3.3792], "zoom": 10 } ] }
```

### 20. LGAs
`GET /geo/lgas?state=NG-LA`
```json
{ "data": [ { "id": "NG-LA-IKJ", "name": "Ikeja", "center": [6.6018, 3.3515], "zoom": 13 } ] }
```

### 21. Wards
`GET /geo/wards?lga=NG-LA-IKJ`
```json
{ "data": [ { "id": "w_01", "name": "Ward A - Alausa", "center": [6.6194, 3.3597], "zoom": 15 } ] }
```

### 22. Communities
`GET /geo/communities?ward=w_01`
```json
{ "data": [ { "id": "c_01", "name": "Alausa Secretariat", "center": [6.6206, 3.3583], "zoom": 16 } ] }
```

### 23. Place search / geocode (map search box)
`GET /geo/search?q=alausa+ikeja`
```json
{ "data": [ { "label": "Alausa, Ikeja, Lagos", "lat": 6.6206, "lng": 3.3583, "type": "locality" } ] }
```

---

## Attendance / analytics per work area

### 24. Live presence
`GET /work-areas/{id}/presence`
```json
{
  "inside": 18, "near": 3, "outside": 2, "offline": 1,
  "employees": [
    { "id": "emp_1", "name": "Ada Obi", "status": "inside", "lat": 6.6019, "lng": 3.3512, "last_seen": "2026-01-14T10:22:00Z" }
  ]
}
```

### 25. Attendance summary
`GET /work-areas/{id}/attendance?from=2026-01-01&to=2026-01-14`
```json
{
  "total_check_ins": 320,
  "total_check_outs": 310,
  "avg_hours": 7.8,
  "punctuality_rate": 0.92,
  "daily": [ { "date": "2026-01-14", "check_ins": 22, "late": 3, "absent": 1 } ]
}
```

### 26. Violations
`GET /work-areas/{id}/violations?page=1&limit=20`
```json
{
  "data": [
    { "id": "v_1", "employee_id": "emp_2", "employee_name": "John Ade", "type": "exit_during_hours",
      "occurred_at": "2026-01-14T11:02:00Z", "lat": 6.61, "lng": 3.35, "resolved": false }
  ],
  "meta": { "page": 1, "limit": 20, "total": 8 }
}
```

---

## Mobile / device endpoints

### 27. Geofence check (does this coordinate fall inside an assigned area?)
`POST /work-areas/check`
```json
{ "employee_id": "emp_1", "lat": 6.6019, "lng": 3.3512, "accuracy": 12 }
```
```json
{
  "inside": true,
  "work_area_id": "wa_01",
  "location_id": "loc_01",
  "distance_from_edge": 45,
  "can_clock_in": true,
  "reason": null
}
```

### 28. Areas assigned to current staff
`GET /work-areas/mine` → same shape as #1 filtered to the authenticated staff.

---

## Errors
```json
{ "success": false, "message": "Work area not found", "code": "WORK_AREA_NOT_FOUND", "errors": { "name": ["Name is required"] } }
```
Codes: 400 validation, 401 unauthenticated, 403 no permission (`work_areas.view/create/edit/delete`), 404 not found, 409 duplicate name, 422 invalid boundary.
