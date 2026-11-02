import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { getRefreshToken, isTokenValid, setAuthTokens } from "@/utils/authUtils";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.traccbox.com/api/v1";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
        const refreshToken = getRefreshToken();

        if (refreshToken && isTokenValid(refreshToken)) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            console.log("🔄 Access token expired. Attempting automatic token refresh...");
            const refreshResponse = await axios.post(`${API_BASE}/refresh`, {
              refresh_token: refreshToken,
            });

            if (sessionStorage.getItem("user_logged_out") === "true") {
              const logoutError = new Error("Session was logged out.");
              processQueue(logoutError, null);
              isRefreshing = false;
              return Promise.reject(logoutError);
            }

            const resData = refreshResponse.data;
            const newAccessToken = resData?.access_token;
            const newRefreshToken = resData?.refresh_token || refreshToken;

            if (newAccessToken) {
              console.log("✅ Token refreshed successfully!");
              setAuthTokens(newAccessToken, newRefreshToken);

              // Notify AuthProvider state
              window.dispatchEvent(
                new CustomEvent("token_refreshed", {
                  detail: { access_token: newAccessToken, refresh_token: newRefreshToken },
                })
              );

              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              processQueue(null, newAccessToken);
              isRefreshing = false;

              return api(originalRequest);
            }
          } catch (refreshError) {
            console.error("❌ Automatic token refresh failed:", refreshError);
            processQueue(refreshError, null);
            isRefreshing = false;
          }
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
