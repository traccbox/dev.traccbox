# Complete the unfinished Supervisor KPI and workforce operations module

## Existing coverage to preserve

Keep the current Daily Attendance & Payout, Work Areas/geofences, Field Sales CRM tasks, and general Performance Reports unchanged. The two uploaded documents are duplicate copies of the same MVP specification. The existing CRM tasks and generic performance reports do not provide the operational task lifecycle, append-only output updates, inspection/rework, daily supervisor reports, weighted supervisor KPIs, or supervisor salary/bonus payroll.

## What to build

Add a distinct Workforce & Supervisor module with static sample data, leaving current modules and their APIs untouched:
- An operational dashboard summarizing site workforce, attendance exceptions, active/overdue tasks, inspection queue, productivity, daily reports, supervisor rankings, and payroll approvals.
- Operational task management: site/supervisor/team assignment, targets and units, dates/priority/resources, append-only progress entries, evidence/notes, submit-for-inspection, approve or return for rework with a reason, and task history.
- Daily progress reports with workforce/task counts, target versus actual, delays, material/equipment, quality/safety notes, and review/return status.
- Supervisor KPI dashboards calculated from eligible sample records using the document’s 25/30/20/15/10 weights, weighted scoring, N/A redistribution, and auditable underlying records.
- Supervisor salary/allowance and bonus configuration, period payroll review, payslip details, and payment recording; worker attendance/payroll remains in the existing payout module.
- Filters, empty/loading/error/retry states where relevant, responsive layouts, and static-data interactions that do not imply server persistence.

## Technical approach

Keep the new feature isolated under `src/pages/Dashboard/features/supervisor-kpi/` with typed static data and KPI calculations in `src/api/supervisor-kpi/`. Add protected dashboard routing and navigation using established project patterns. Use the existing design system and reusable controls; do not change attendance, payout, geofencing, CRM task, or general performance behavior. Add focused KPI calculation tests. Fix the currently reported Sidebar `onNavigate` type error so the preview is clean.

## Verification

Check the KPI tests, current build diagnostics, module navigation and key task/report/KPI/payroll interactions, and narrow/wide viewports. Audit the completed screens against the uploaded MVP and report clearly that records and changes are static samples until APIs are available.
