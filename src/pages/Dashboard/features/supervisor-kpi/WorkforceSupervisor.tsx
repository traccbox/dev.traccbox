import React from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import PageHeader from "@/components/dashboard/PageHeader";
import { WorkforceProvider, useWorkforce } from "./store";
import { BASE, cap } from "./ui";
import Onboarding from "./Onboarding";
import Overview from "./Overview";
import Supervisors from "./Supervisors";
import SupervisorDetail from "./SupervisorDetail";
import Tasks from "./Tasks";
import Reports from "./Reports";
import KpiPage from "./KpiPage";
import Payroll from "./Payroll";
import Setup from "./Setup";

const Shell: React.FC = () => {
  const { setupDone, config } = useWorkforce();
  const T = config.terms;

  if (!setupDone) {
    return (
      <div className="p-4 md:p-6">
        <Onboarding />
      </div>
    );
  }

  const tabs: [string, string][] = [
    ["", "Overview"],
    ["supervisors", cap(T.supervisors)],
    ["tasks", cap(T.tasks)],
    ["reports", "Daily reports"],
    ["kpi", "Scorecards"],
    ["payroll", "Payroll"],
    ["setup", "Setup"],
  ];

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Workforce & Supervisor"
        description={`Manage ${T.supervisors.toLowerCase()}, assign ${T.tasks.toLowerCase()}, review daily reports and pay on performance.`}
        crumbs={[{ label: "Workforce & Supervisor" }]}
      />
      <nav className="mb-5 flex flex-wrap gap-1 border-b border-gray-100 pb-3">
        {tabs.map(([to, label]) => (
          <NavLink
            key={to || "overview"}
            end={to === ""}
            to={to ? `${BASE}/${to}` : BASE}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? "bg-blue-50 text-[#1658E5]" : "text-gray-600 hover:bg-gray-50"}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="supervisors" element={<Supervisors />} />
        <Route path="supervisors/:id" element={<SupervisorDetail />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="reports" element={<Reports />} />
        <Route path="kpi" element={<KpiPage />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </div>
  );
};

const WorkforceSupervisor: React.FC = () => (
  <WorkforceProvider>
    <Shell />
  </WorkforceProvider>
);

export default WorkforceSupervisor;
