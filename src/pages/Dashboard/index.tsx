import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import DashboardLayout from "./DashboardLayout";
import CompanyOnboardingModal from "@/components/auth/CompanyOnboardingModal";
import { LocationTrackingProvider } from "@/contexts/LocationTrackingContext";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <LocationTrackingProvider>
      <DashboardLayout>
        {/* Only show onboarding modal if company_name is missing */}
        {!user?.company_name && <CompanyOnboardingModal />}
        <Outlet />
      </DashboardLayout>
    </LocationTrackingProvider>
  );
};

export default Dashboard;
