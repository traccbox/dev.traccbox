# Clock In/Out Feature Documentation

## Overview

The Clock In/Out feature provides a simple public page where field workers can clock in/out without authentication. The page tracks attendance status and displays appropriate UI based on whether the worker has already clocked in for the day.

## Files Created

### 1. **API Service** (`src/api/attendance.ts`)

Provides three main endpoints:

- `checkIn(data)` - POST request to check in staff
- `checkOut(data)` - POST request to check out staff
- `getAttendanceStatus(staffId)` - GET request to fetch current attendance status

### 2. **API Types** (Updated `src/api/types.ts`)

Added the following interfaces:

- `AttendanceCheckInRequest` - Request body for check-in
- `AttendanceCheckOutRequest` - Request body for check-out
- `AttendanceResponse` - Response from check-in/out endpoints
- `AttendanceStatus` - Attendance status response

### 3. **Clock In Page** (`src/pages/ClockIn.tsx`)

A public page component that:

- Accepts `staffId` and `companyId` from URL parameters
- Fetches the current attendance status on load
- Displays a clock-in button if not checked in
- Displays a clock-out button if already checked in
- Shows timestamps for last check-in and check-out
- Handles loading and error states

### 4. **Routing** (Updated `src/App.tsx`)

Added route: `/clock-in/:staffId/:companyId`

## Usage

### URL Structure

```
/clock-in/{staffId}/{companyId}
```

### Example

```
/clock-in/3fa85f64-5717-4562-b3fc-2c963f66afa6/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

## Page Features

### 1. **Loading State**

- Displays a loading spinner while fetching attendance status

### 2. **Status Display**

- **Checked In**: Shows green badge with check-in time
- **Not Checked In**: Shows orange badge indicating ready to start work

### 3. **Time Information**

- Displays last check-in timestamp
- Displays last check-out timestamp
- Shows current time on the page

### 4. **Action Buttons**

- **Clock In Button** (Green): Appears when staff hasn't clocked in
- **Clock Out Button** (Red): Appears when staff has clocked in

### 5. **Error Handling**

- Displays error messages if:
  - Staff ID or Company ID is missing from URL
  - API request fails
  - Cannot fetch attendance status

## Backend Integration

### Endpoint 1: Get Attendance Status

```
GET /api/v1/attendance/status/{staff_id}
```

**Response**: `AttendanceStatus` object with `is_checked_in` boolean flag

### Endpoint 2: Check In

```
POST /api/v1/attendance/check-in
Content-Type: application/json

{
  "staff_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "company_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Response**: `AttendanceResponse` with check-in details

### Endpoint 3: Check Out

```
POST /api/v1/attendance/check-out
Content-Type: application/json

{
  "staff_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "company_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Response**: `AttendanceResponse` with check-out details

## UI Design

### Color Scheme

- **Primary**: Purple (`#9333ea`)
- **Error**: Red (`#dc2626`)
- **Success**: Green (`#16a34a`)
- **Background**: Gradient from purple-50 to purple-100

### Components Used

- Lucide React icons: `Clock`, `LogIn`, `LogOut`, `AlertCircle`
- Tailwind CSS for styling
- Toast notifications for feedback

## Future Enhancements

- Add location tracking with GPS coordinates
- Add photo capture for verification
- Add offline capability
- Add multiple clock-in/out per day support
- Add break time tracking
- Add geofencing requirements
