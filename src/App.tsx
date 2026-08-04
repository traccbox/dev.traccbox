import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Verification from "./pages/Verification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import ClockIn from "./pages/ClockIn";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GlobalAuthRedirect from "@/components/auth/GlobalAuthRedirect";
import GeneralSettings from "./pages/Dashboard/features/settings/GeneralSettings";
import UserRoles from "./pages/Dashboard/features/settings/UserRoles";
import TeamManagment from "./pages/Dashboard/features/settings/TeamManagment";
import StaffVerification from "./pages/StaffVerification";
import TraccBoxStaffPortal from "./pages/TraccBoxStaffPortal";
import { useEffect } from "react";
import TaskAssignment from "./pages/Dashboard/features/task/TaskAssignment";
import ManageTask from "./pages/Dashboard/features/task/ManageTask";
import LocationTracking from "./pages/Dashboard/features/gps/LocationTracking";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Home from "./pages/Dashboard/Home";
import TermsAndCondition from "./pages/TermsAndCondition";
import PrivacyPolicies from "./pages/PrivacyPolicies";
import UserRolesLayout from "./pages/Dashboard/features/settings/UserRolesLayout";
import BulkUpload from "./pages/Dashboard/features/settings/BulkUpload";
import WorkAreas from "./pages/Dashboard/features/work-areas/WorkAreas";
import RequirePermission from "@/components/auth/RequirePermission";
import PerformanceLogs from "./pages/Dashboard/features/performance/PerformanceLogs";
import Reports from "./pages/Dashboard/features/performance/Reports";
import TravelMonitoring from "./pages/Dashboard/features/travel/TravelMonitoring";
import CurrentPlan from "./pages/Dashboard/features/subscription/CurrentPlan";
import BillingHistory from "./pages/Dashboard/features/subscription/BillingHistory";
import PlanComparison from "./pages/Dashboard/features/subscription/PlanComparison";
import TrialConfiguration from "./pages/Dashboard/features/subscription/TrialConfiguration";
import CallHistory from "./pages/Dashboard/features/communication/CallHistory";

const gate = (mod: string, act: string, element: React.ReactNode) => (
  <RequirePermission module={mod} action={act}>{element}</RequirePermission>
);



const queryClient = new QueryClient();
const PageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", "AW-18061056579", {
        page_path: location.pathname,
      });
    }
  }, [location]);

  return null;
};
const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalAuthRedirect />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/company$&-admin-signup" element={<Signup />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/company$&-admin-login" element={<Login />} />
            <Route path="/login" element={<Login />} />

            <Route path="/verify" element={<Verification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="/clock-in/:companyId/:staffId/:managerId?" element={<ClockIn />} />
            <Route path="/sales-rep-demo" element={<TraccBoxStaffPortal />} />
            <Route path="/staff-verify" element={<StaffVerification />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={gate("core_dashboard_report", "view_dashboard", <Home />)} />
                <Route path="settings/general" element={gate("user_role_management", "view_users", <GeneralSettings />)} />
                 <Route path="settings/roles" element={<UserRolesLayout />}>
                  <Route index element={gate("user_role_management", "assign_roles", <UserRoles />)} />
                  <Route path="bulk-upload" element={gate("user_role_management", "add_edit_users", <BulkUpload />)} />
                </Route>
                <Route path="settings/team" element={gate("user_role_management", "manage_users", <TeamManagment />)} />
                <Route
                  path="field-reps/create-tasks"
                  element={gate("order_task_management", "assign_tasks", <TaskAssignment />)}
                />
                <Route path="field-reps/manage-task" element={gate("order_task_management", "view_orders", <ManageTask />)} />
                <Route
                  path="location-tracking"
                  element={gate("core_dashboard_report", "view_dashboard", <LocationTracking />)}
                />
                <Route path="work-areas" element={gate("order_task_management", "view_orders", <WorkAreas />)} />
              </Route>
            </Route>
            {/* Terms and conditions */}
            <Route
              path="terms-and-conditions"
              element={<TermsAndCondition />}
            />
            <Route path="privacy-policies" element={<PrivacyPolicies />} />
            {/* Not found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
