import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

// List of public routes where you want to redirect authenticated users away from
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify",
];

const GlobalAuthRedirect: React.FC = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !token) return;

    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get("returnUrl");

    if (location.pathname === "/login") {
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
        return;
      }
      const storedReturnUrl = localStorage.getItem("return_url");
      if (storedReturnUrl) {
        navigate(storedReturnUrl, { replace: true });
        return;
      }
    }

    if (PUBLIC_ROUTES.includes(location.pathname)) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, token, location.pathname, location.search, navigate]);

  return null;
};

export default GlobalAuthRedirect;
