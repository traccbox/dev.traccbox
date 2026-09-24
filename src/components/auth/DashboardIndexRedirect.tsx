import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { sidebarMenus } from "@/pages/Dashboard/Sidebar/menuData";
import Home from "@/pages/Dashboard/Home";
import { ShieldAlert } from "lucide-react";

export default function DashboardIndexRedirect() {
  const { hasPermission, isStaff } = useAuth();

  const canViewOverview = hasPermission("core_dashboard_report", "view_dashboard");

  const firstAccessibleRoute = useMemo(() => {
    for (const menu of sidebarMenus) {
      if (menu.to && menu.to !== "/dashboard") {
        if (!menu.permission || hasPermission(menu.permission[0], menu.permission[1])) {
          return menu.to;
        }
      }
      if (menu.submenus?.length) {
        for (const sub of menu.submenus) {
          if (!sub.permission || hasPermission(sub.permission[0], sub.permission[1])) {
            return sub.to;
          }
        }
      }
    }
    return null;
  }, [hasPermission]);

  // If user has permission for main dashboard overview, render Home directly
  if (canViewOverview) {
    return <Home />;
  }

  // If user does not have permission for dashboard overview, redirect to their first assigned route
  if (firstAccessibleRoute) {
    return <Navigate to={firstAccessibleRoute} replace />;
  }

  // Fallback if no routes are assigned at all
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No Dashboard Modules Assigned
      </h2>
      <p className="text-gray-500 max-w-sm">
        You do not currently have access to any dashboard features. Please contact your company administrator to assign permissions to your role.
      </p>
    </div>
  );
}
