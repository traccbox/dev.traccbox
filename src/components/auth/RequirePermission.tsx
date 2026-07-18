import React from "react";
import { useAuth } from "./AuthProvider";
import { ShieldAlert } from "lucide-react";

interface RequirePermissionProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AccessDenied: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
      <ShieldAlert className="w-8 h-8 text-red-500" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 mb-2">
      Access restricted
    </h2>
    <p className="text-gray-500 max-w-sm">
      You don't have permission to view this page
      {label ? ` (${label})` : ""}. Please contact your administrator if you
      believe this is a mistake.
    </p>
  </div>
);

const RequirePermission: React.FC<RequirePermissionProps> = ({
  module,
  action,
  children,
  fallback,
}) => {
  const { hasPermission } = useAuth();
  if (!hasPermission(module, action)) {
    return <>{fallback ?? <AccessDenied label={`${module}.${action}`} />}</>;
  }
  return <>{children}</>;
};

export default RequirePermission;
