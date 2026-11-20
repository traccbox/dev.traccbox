import React from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { SupervisorStoreProvider } from "./store";
import Overview from "./Overview";
import Tasks from "./Tasks";
import Reports from "./Reports";
import KpiPage from "./KpiPage";
import Payroll from "./Payroll";

const tabs = [
  ["", "Overview"],
  ["tasks", "Tasks"],
  ["reports", "Daily Reports"],
  ["kpi", "Supervisor KPI"],
  ["payroll", "Payroll"],
] as const;

const WorkforceSupervisor: React.FC = () => (
  <SupervisorStoreProvider>
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Workforce &amp; Supervisor</h1>
        <p className="text-sm text-muted-foreground">
          Sample data only — changes are kept in this browser session and are not saved to a server.
        </p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {tabs.map(([to, label]) => (
          <NavLink
            key={to}
            end
            to={to ? `/dashboard/workforce-supervisor/${to}` : "/dashboard/workforce-supervisor"}
            className={({ isActive }) =>
              `rounded-md border px-3 py-1.5 text-sm ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="reports" element={<Reports />} />
        <Route path="kpi" element={<KpiPage />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </div>
  </SupervisorStoreProvider>
);

export default WorkforceSupervisor;
