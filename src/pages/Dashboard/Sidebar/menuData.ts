// Sidebar menu and submenu structure for TraccBox dashboard
// Icons are referenced by name and imported in Sidebar.tsx or icons.tsx

export type PermissionKey = [module: string, action: string];

export interface SidebarSubmenu {
  label: string;
  to: string;
  comingSoon?: boolean;
  permission?: PermissionKey;
}

export interface SidebarMenuConfig {
  label: string;
  icon: string;
  to?: string;
  submenus?: SidebarSubmenu[];
  comingSoon?: boolean;
  permission?: PermissionKey;
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
    permission: ["order_task_management", "view_orders"],
  },
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
