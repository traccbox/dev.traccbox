# Task Management API

This module provides comprehensive task management functionality for the TRACCBOX application, including task creation, assignment, updates, and status management.

## Features

- ✅ Task creation with full form validation
- ✅ Task assignment to sales representatives
- ✅ Task status management (pending, completed, overdue)
- ✅ Place suggestions integration with coordinates
- ✅ Interactive Leaflet map previews
- ✅ Real-time staff data fetching
- ✅ Comprehensive error handling
- ✅ Loading states and user feedback

## API Services

### TaskService

Located in `TaskService.ts`, provides the following endpoints:

- `createTask(taskData: TaskCreate)` - Create a new task
- `getCompanyTasks(companyId: string)` - Get all tasks for a company
- `getStaffTasks(companyId: string, staffId: string)` - Get tasks for a specific staff member
- `updateTask(companyId, staffId, taskId, taskData)` - Update an existing task
- `deleteTask(companyId, staffId, taskId)` - Delete a task
- `changeTaskStatus(companyId, staffId, taskId, statusData)` - Change task status

### PlacesService

Provides location-based functionality:

- `suggestPlaces(input: string, language?: string)` - Get place suggestions based on user input

## React Query Hooks

### Mutation Hooks (`useTaskMutations.ts`)

- `useCreateTask()` - Create new tasks with automatic cache invalidation
- `useUpdateTask()` - Update existing tasks
- `useDeleteTask()` - Delete tasks
- `useChangeTaskStatus()` - Change task status

### Query Hooks (`useTaskQueries.ts`)

- `useCompanyTasks(companyId)` - Fetch company tasks with caching
- `useStaffTasks(companyId, staffId)` - Fetch staff-specific tasks

### Place Hooks (`usePlaces.ts`)

- `usePlaceSuggestions(input, language)` - Fetch place suggestions



## Data Types

### TaskCreate

```typescript
interface TaskCreate {
  company_id?: string | null;
  staff_id?: string | null;
  task_title: string;
  task_type: string;
  customer_name: string;
  customer_phone: string;
  description?: string | null;
  location?: string | null;
  date: string; // YYYY-MM-DD format
  time?: string | null; // HH:MM:SS format
  priority?: "important" | "normal" | "low";
  attachment?: string[] | null;
  status?: "pending" | "completed" | "overdue" | null;
  latitude?: number;
  longitude?: number;
}
```

### TaskResponse

```typescript
interface TaskResponse {
  id: string;
  task_title: string;
  task_type: string;
  customer_name: string;
  customer_phone: string;
  description?: string | null;
  location?: string | null;
  date: string;
  time?: string | null;
  priority: string;
  attachment?: string[] | null;
  status: "pending" | "completed" | "overdue";
  latitude?: number;
  longitude?: number;
}
```
