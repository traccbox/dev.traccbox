// Sidebar menu and submenu structure for TraccBox dashboard
// Icons are referenced by name and imported in Sidebar.tsx or icons.tsx

export type PermissionKey = [module: string, action: string];

export interface SidebarSubmenu {
  label: string;
  to: string;
  comingSoon?: boolean;
  permission?: PermissionKey;
  /** Set to true to hide this submenu item until its API is integrated */
  hidden?: boolean;
}

export interface SidebarMenuConfig {
  label: string;
  icon: string;
  to?: string;
  submenus?: SidebarSubmenu[];
  comingSoon?: boolean;
  permission?: PermissionKey;
  /** Set to true to hide this menu from the sidebar until its API is integrated */
  hidden?: boolean;
}

export const sidebarMenus: SidebarMenuConfig[] = [
  {
    label: "Dashboard",
    icon: "BarChart",
    to: "/dashboard",
    permission: ["core_dashboard_report", "view_dashboard"],
  },
  {
    label: "Work Areas",
    icon: "MapPinned",
    to: "/dashboard/work-areas",
    permission: ["work_area_management", "view_work_areas"],
  },

  // ─── NOT YET INTEGRATED ──────────────────────────────────────────────────
  // To enable a module: delete its `hidden: true` line.
  {
    label: "Daily Attendance & Payout",
    icon: "Banknote",
    // hidden: true, // ← remove this line to show
    submenus: [
      {
        label: "Payout Board",
        to: "/dashboard/payout",
        permission: ["work_area_management", "view_work_areas"],
      },
      {
        label: "Pay Slips & Disbursal",
        to: "/dashboard/payout/payslips",
        permission: ["work_area_management", "view_work_areas"],
      },
      {
        label: "Site Geofences",
        to: "/dashboard/payout/sites",
        permission: ["work_area_management", "view_work_areas"],
      },
      {
        label: "Same-Day Workers",
        to: "/dashboard/payout/workers",
        permission: ["work_area_management", "view_work_areas"],
      },
      {
        label: "Attendance Logs",
        to: "/dashboard/payout/attendance",
        permission: ["work_area_management", "view_work_areas"],
      },
      {
        label: "Worker Clock-In Portal",
        to: "/dashboard/payout/clock-in-portal",
        permission: ["work_area_management", "view_work_areas"],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────

  {
    label: "Field Sales Reps",
    icon: "Users",
    submenus: [
      {
        label: "Manage Task",
        to: "/dashboard/field-reps/manage-task",
        permission: ["order_task_management", "view_orders"],
      },
      {
        label: "Task Assignment",
        to: "/dashboard/field-reps/create-tasks",
        permission: ["order_task_management", "assign_tasks"],
      },
      {
        label: "Location Tracking",
        to: "/dashboard/location-tracking",
        permission: ["core_dashboard_report", "view_dashboard"],
      },
    ],
  },

  // ─── NOT YET INTEGRATED ──────────────────────────────────────────────────
  {
    label: "Performance",
    icon: "TrendingUp",
    hidden: true, // ← remove this line to show
    submenus: [
      {
        label: "Performance Logs",
        to: "/dashboard/performance/logs",
        permission: ["core_dashboard_report", "view_reports"],
      },
      {
        label: "Weekly & Monthly Reports",
        to: "/dashboard/performance/reports",
        permission: ["core_dashboard_report", "view_reports"],
      },
    ],
  },
  {
    label: "Travel Monitoring",
    icon: "Navigation",
    hidden: true, // ← remove this line to show
    to: "/dashboard/travel-monitoring",
    permission: ["core_dashboard_report", "view_dashboard"],
  },
  {
    label: "Communication",
    icon: "PhoneCall",
    hidden: true, // ← remove this line to show
    submenus: [
      {
        label: "Call History",
        to: "/dashboard/communication/calls",
        permission: ["core_dashboard_report", "view_reports"],
      },
    ],
  },
  {
    label: "Subscription",
    icon: "CreditCard",
    hidden: true, // ← remove this line to show
    submenus: [
      {
        label: "Current Plan",
        to: "/dashboard/subscription/current",
        permission: ["billing_subscription", "view_billing"],
      },
      {
        label: "Billing History",
        to: "/dashboard/subscription/billing",
        permission: ["billing_subscription", "access_invoice"],
      },
      {
        label: "Plan Comparison",
        to: "/dashboard/subscription/plans",
        permission: ["billing_subscription", "view_billing"],
      },
      {
        label: "Trial Configuration",
        to: "/dashboard/subscription/trial",
        permission: ["billing_subscription", "manage_billing"],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────

  {
    label: "Settings & Integrations",
    icon: "Settings",
    submenus: [
      {
        label: "General Settings",
        to: "/dashboard/settings/general",
        permission: ["user_role_management", "view_users"],
      },
      {
        label: "User Roles & Permissions",
        to: "/dashboard/settings/roles",
        permission: ["user_role_management", "assign_roles"],
      },
      {
        label: "Team",
        to: "/dashboard/settings/team",
        permission: ["user_role_management", "manage_users"],
      },
    ],
  },
];

/**
 * Sidebar menus with hidden items filtered out.
 * Use this export in Sidebar.tsx — swap `sidebarMenus` for `activeMenus`.
 */
export const activeMenus = sidebarMenus.filter((m) => !m.hidden);
