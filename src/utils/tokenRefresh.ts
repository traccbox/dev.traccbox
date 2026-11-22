import axios from "axios";
import {
  getRefreshToken,
  isTokenValid,
  setAuthTokens,
} from "@/utils/authUtils";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://api.traccbox.com/api/v1";

let inflight: Promise<string | null> | null = null;

/**
 * Exchange the stored refresh token for a new access token.
 *
 * Single-flight: concurrent callers (REST interceptor, WebSocket, ...) share
 * one request, so a rotating refresh token is never used twice.
 * Resolves to the new access token, or null if the session can't be refreshed.
 * On success the tokens are stored and a `token_refreshed` event is dispatched
 * so AuthProvider updates its state.
 */
export const refreshAccessToken = (): Promise<string | null> => {
  if (inflight) return inflight;

  inflight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken || !isTokenValid(refreshToken)) return null;

    try {
      const res = await axios.post(`${API_BASE}/refresh`, {
        refresh_token: refreshToken,
      });

      if (sessionStorage.getItem("user_logged_out") === "true") return null;

      const newAccessToken: string | undefined = res.data?.access_token;
      if (!newAccessToken) return null;
      const newRefreshToken: string = res.data?.refresh_token || refreshToken;

      setAuthTokens(newAccessToken, newRefreshToken);
      window.dispatchEvent(
        new CustomEvent("token_refreshed", {
          detail: {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
          },
        }),
      );
      return newAccessToken;
    } catch (err) {
      console.error("❌ Token refresh failed:", err);
      return null;
    }
  })().finally(() => {
    inflight = null;
  });

  return inflight;
};
