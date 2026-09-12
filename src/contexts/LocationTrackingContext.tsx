import React, { createContext, useContext, ReactNode } from "react";
import {
  useLocationTracking,
  StaffLocations,
} from "@/hooks/useLocationTracking";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAccessToken } from "@/utils/authUtils";

interface LocationTrackingContextType {
  staffLocations: StaffLocations;
  isConnected: boolean;
  error: string | null;
  requestAllStaff: () => void;
  requestSingleStaff: (staffId: string) => void;
}

const LocationTrackingContext = createContext<
  LocationTrackingContextType | undefined
>(undefined);

export const LocationTrackingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, staff, token } = useAuth();
  const companyId = staff?.company_id || user?.id || null;
  const authToken = token || getAccessToken();

  console.log("🌐 LocationTrackingProvider initialized:", {
    companyId,
    enabled: !!companyId && !!authToken,
    userEmail: user?.email || staff?.email,
  });

  const {
    staffLocations,
    isConnected,
    error,
    requestAllStaff,
    requestSingleStaff,
  } = useLocationTracking({
    companyId,
    token: authToken,
    enabled: !!companyId && !!authToken,
  });

  return (
    <LocationTrackingContext.Provider
      value={{
        staffLocations,
        isConnected,
        error,
        requestAllStaff,
        requestSingleStaff,
      }}
    >
      {children}
    </LocationTrackingContext.Provider>
  );
};

export const useLocationTrackingContext = () => {
  const context = useContext(LocationTrackingContext);
  if (!context) {
    throw new Error(
      "useLocationTrackingContext must be used within LocationTrackingProvider"
    );
  }
  return context;
};
