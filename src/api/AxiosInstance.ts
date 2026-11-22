import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { refreshAccessToken } from "@/utils/tokenRefresh";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.traccbox.com/api/v1";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add access token to every request
api.interceptors.request.use((config) => {
  const accessToken =
    Cookies.get("access_token") ||
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1] ||
    localStorage.getItem("access_token");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Handle 401 Unauthorized response with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry) {
      const requestUrl = originalRequest.url || "";
      const isAuthEndpoint =
        requestUrl.includes("/companies/login") ||
        requestUrl.includes("/staff/login") ||
        requestUrl.includes("/companies/register") ||
        requestUrl.includes("/refresh") ||
        requestUrl.includes("/staff/verify_email") ||
        requestUrl.includes("/companies/verify_email");

      if (!isAuthEndpoint) {
        // Shared single-flight refresh (also used by the WebSocket)
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          originalRequest._retry = true;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }

        // User explicitly logged out while the refresh was in flight
        if (sessionStorage.getItem("user_logged_out") === "true") {
          return Promise.reject(error);
        }

        // If no valid refresh_token exists or refresh failed, force logout & redirect to login
        console.warn("🔒 Unable to refresh token. Session expired.");
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("staff_data");
        localStorage.removeItem("user_data");
        localStorage.removeItem("user_data_timestamp");

        sessionStorage.setItem("session_expired", "true");

        if (!window.location.pathname.startsWith("/login")) {
          const currentPath = window.location.pathname + window.location.search;
          const returnParam =
            currentPath && currentPath !== "/" && currentPath !== "/login"
              ? `&returnUrl=${encodeURIComponent(currentPath)}`
              : "";
          window.location.href = `/login?reason=expired${returnParam}`;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
