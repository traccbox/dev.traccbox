// Sidebar menu and submenu structure for TraccBox dashboard
// Icons are referenced by name and imported in Sidebar.tsx or icons.tsx

export interface SidebarSubmenu {
  label: string;
  to: string;
  comingSoon?: boolean;
}

export interface SidebarMenuConfig {
  label: string;
  icon: string;
  to?: string;
  submenus?: SidebarSubmenu[];
  comingSoon?: boolean;
}

export const sidebarMenus: SidebarMenuConfig[] = [
  {
    label: "Dashboard",
    icon: "BarChart",
    to: "/dashboard",
  },

  {
    label: "Field Sales Reps",
    icon: "Users",
    submenus: [
      { label: "Manage Task", to: "/dashboard/field-reps/manage-task" },
      { label: "Task Assignment", to: "/dashboard/field-reps/create-tasks" },
      {
        label: "Location Tracking",
        to: "/dashboard/location-tracking",
      },
      // { label: "GPS Logs", to: "/dashboard/field-reps/gps-logs" },
      // { label: "Attendance Reports", to: "/dashboard/field-reps/attendance" },
    ],
  },
  // {
  //   label: "Sales & Performance",
  //   icon: "LineChart",
  //   comingSoon: true,
  //   submenus: [
  //     {
  //       label: "Sales Analytics",
  //       to: "/dashboard/sales/analytics",
  //       comingSoon: true,
  //     },
  //     {
  //       label: "AI Insights",
  //       to: "/dashboard/sales/ai-insights",
  //       comingSoon: true,
  //     },
  //     {
  //       label: "Leader-boards",
  //       to: "/dashboard/sales/leaderboards",
  //       comingSoon: true,
  //     },
  //   ],
  // },
  // {
  //   label: "Order & MOQ Intelligence",
  //   icon: "Package",
  //   comingSoon: true,
  //   submenus: [
  //     { label: "Order Logs", to: "/dashboard/order/logs", comingSoon: true },
  //     {
  //       label: "AI MOQ Suggestions",
  //       to: "/dashboard/order/ai-moq",
  //       comingSoon: true,
  //     },
  //     {
  //       label: "Leader-boards",
  //       to: "/dashboard/order/leaderboards",
  //       comingSoon: true,
  //     },
  //   ],
  // },
  // {
  //   label: "Organic & Inorganic Sales",
  //   icon: "CircleDot",
  //   comingSoon: true,
  //   submenus: [
  //     {
  //       label: "Organic Traffic",
  //       to: "/dashboard/organic/traffic",
  //       comingSoon: true,
  //     },
  //     {
  //       label: "Inorganic Channels",
  //       to: "/dashboard/organic/channels",
  //       comingSoon: true,
  //     },
  //     {
  //       label: "Attribution Reports",
  //       to: "/dashboard/organic/attribution",
  //       comingSoon: true,
  //     },
  //   ],
  // },
  // {
  //   label: "Report & Export",
  //   icon: "FileText",
  //   comingSoon: true,
  //   submenus: [
  //     {
  //       label: "Auto Reports",
  //       to: "/dashboard/report/auto-reports",
  //       comingSoon: true,
  //     },
  //     {
  //       label: "Inorganic Channels",
  //       to: "/dashboard/report/inorganic-channels",
  //       comingSoon: true,
  //     },
  //     {
  //       label: "Export Options",
  //       to: "/dashboard/report/export-options",
  //       comingSoon: true,
  //     },
  //   ],
  // },
  // {
  //   label: "Subscription & Billing",
  //   icon: "CreditCard",
  //   comingSoon: true,
  //   submenus: [
  //     {
  //       label: "Current Plan Info",
  //       to: "/dashboard/billing/plan-info",
  //       comingSoon: true,
  //     },
  //     {
  //       label: "Usage Stats",
  //       to: "/dashboard/billing/usage-stats",
  //       comingSoon: true,
  //     },
  //     {
  //       label: "Invoices & Payment Logs",
  //       to: "/dashboard/billing/invoices",
  //       comingSoon: true,
  //     },
  //   ],
  // },
  {
    label: "Settings & Integrations",
    icon: "Settings",
    submenus: [
      { label: "General Settings", to: "/dashboard/settings/general" },
      // { label: "Integrations", to: "/dashboard/settings/integrations" },
      { label: "User Roles & Permissions", to: "/dashboard/settings/roles" },
      { label: "Team", to: "/dashboard/settings/team" },
    ],
  },
];
