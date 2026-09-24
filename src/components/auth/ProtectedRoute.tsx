import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import Cookies from "js-cookie";
import { isTokenValid } from "@/utils/authUtils";

const ProtectedRoute: React.FC = () => {
  const { user, token } = useAuth();
  const location = useLocation();

  // Check context state OR fallback to Cookies / localStorage for newly established sessions
  const activeToken = token || Cookies.get("access_token") || localStorage.getItem("access_token");
  const storedStaff = localStorage.getItem("staff_data");
  const storedUser = localStorage.getItem("user_data");

  const isAuthenticated = Boolean(
    (user || storedStaff || storedUser) && activeToken && isTokenValid(activeToken)
  );

  if (!isAuthenticated) {
    // Check if user previously had a token that has now expired or session was marked expired
    const isSessionExpired =
      sessionStorage.getItem("session_expired") === "true" ||
      (!!activeToken && !isTokenValid(activeToken));

    const currentPath = location.pathname + location.search;
    const returnParam =
      currentPath && currentPath !== "/" && currentPath !== "/login"
        ? `?reason=expired&returnUrl=${encodeURIComponent(currentPath)}`
        : "?reason=expired";

    if (isSessionExpired) {
      sessionStorage.setItem("session_expired", "true");
      // Clean up raw expired token
      if (activeToken && !isTokenValid(activeToken)) {
        Cookies.remove("access_token");
        localStorage.removeItem("access_token");
      }
      return <Navigate to={`/login${returnParam}`} state={{ from: location, sessionExpired: true }} replace />;
    }

    // Not authenticated, normal redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated, render the child route
  return <Outlet />;
};

export default ProtectedRoute;
