import React, { createContext, useContext, ReactNode } from "react";
import {
  useLocationTracking,
  StaffLocations,
} from "@/hooks/useLocationTracking";
import { useAuth } from "@/components/auth/AuthProvider";

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
  const { user } = useAuth();
  const companyId = user?.id || null;

  console.log("🌐 LocationTrackingProvider initialized:", {
    companyId,
    enabled: !!companyId,
    userEmail: user?.email,
  });
 
  const {
    staffLocations,
    isConnected, 
    error,
    requestAllStaff,
    requestSingleStaff,
  } = useLocationTracking({
    companyId,
    enabled: !!companyId, // Only connect when user is logged in
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
