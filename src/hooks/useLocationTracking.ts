import { useState, useEffect, useRef, useCallback } from "react";
import { getAccessToken, isTokenValid } from "@/utils/authUtils";
import { refreshAccessToken } from "@/utils/tokenRefresh";

export interface GeofenceInfo {
  inside: boolean;
  work_area_id?: string | null;
  location_id?: string | null;
  distance_from_edge?: number | null;
  can_clock_in?: boolean;
  reason?: string | null;
  violation_opened?: boolean;
}

export interface StaffLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number | null; // metres
  altitude?: number | null; // metres
  heading?: number | null; // degrees
  speed?: number | null; // metres/second
  work_area_id?: string | null;
  task_status?: "ongoing" | "pending" | "completed" | "overdue" | null;
  address?: string | null;
  geofence?: GeofenceInfo;
}

export interface StaffLocations {
  [staffId: string]: StaffLocation;
}

export interface LocationTrackingResponse {
  status: string;
  total_online_staff?: number;
  locations: StaffLocations;
}

// Pushed by the backend when a staff socket disconnects or goes silent (15 min)
export interface StaffOfflineEvent {
  type: "staff_offline";
  staff_id: string;
  last_seen: string;
}

// Single staff location update format
export interface SingleLocationUpdate {
  staff_id: string;
  location: StaffLocation;
}

interface UseLocationTrackingOptions {
  companyId: string | null;
  token?: string | null;
  enabled?: boolean;
}

// Tagged logs: filter the browser console on "[WS]" to see only socket traffic.
const maskToken = (url: string) => url.replace(/token=[^&]+/, "token=<hidden>");
const wsLogRequest = (message: object) =>
  console.log("[WS] ➡️ REQUEST", JSON.stringify(message, null, 2));
const wsLogResponse = (raw: unknown) => {
  let parsed: unknown = raw;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    /* not JSON, log as-is */
  }
  console.log("[WS] ⬅️ RESPONSE", parsed);
};

const getWsBaseUrl = (): string => {
  const envBase = import.meta.env.VITE_API_BASE;
  if (envBase) {
    try {
      const url = new URL(envBase);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${url.host}`;
    } catch {
      // fallback if invalid URL format
    }
  }
  return "wss://api.traccbox.com";
};

export const useLocationTracking = ({
  companyId,
  token,
  enabled = true,
}: UseLocationTrackingOptions) => {
  const [staffLocations, setStaffLocations] = useState<StaffLocations>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // base delay, doubles each attempt (max 30s)
  const connectSeqRef = useRef(0); // invalidates in-flight async connects
  const authRetryRef = useRef(false); // one refresh-and-retry per auth failure
  const connectedTokenRef = useRef<string | null>(null);

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      wsLogRequest(message);
      wsRef.current.send(messageStr);
      console.log(
        "✅ Message sent successfully (response will come via onmessage handler)",
      );
    } else {
      const readyState = wsRef.current?.readyState;
      console.warn("⚠️ WebSocket is not connected. Ready state:", readyState);
      console.warn(
        "⚠️ WebSocket states: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED",
      );
      setError("WebSocket is not connected");
    }
  }, []);

  const requestAllStaff = useCallback(() => {
    const message = { action: "get_all" };
    console.log("📤 Requesting All Staff Locations:", message);
    sendMessage(message);
  }, [sendMessage]);

  const connect = useCallback(async (overrideToken?: string) => {
    if (!companyId || !enabled) return;

    const seq = ++connectSeqRef.current;
    let activeToken = overrideToken || token || getAccessToken();

    // Expired (or about to expire) access token: refresh before connecting
    if (!activeToken || !isTokenValid(activeToken)) {
      const fresh = await refreshAccessToken();
      if (seq !== connectSeqRef.current) return; // superseded / disconnected
      if (fresh) activeToken = fresh;
    }

    if (!activeToken) {
      console.warn("⚠️ No access token available for WebSocket connection");
      setError("No access token available for location tracking connection.");
      setIsConnected(false);
      return;
    }

    // Already connected/connecting with this exact token: nothing to do
    if (
      wsRef.current &&
      connectedTokenRef.current === activeToken &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // Close existing connection; detach handlers so its onclose doesn't
    // schedule a competing reconnect
    if (wsRef.current) {
      const old = wsRef.current;
      old.onopen = old.onmessage = old.onerror = old.onclose = null;
      old.close();
    }
    connectedTokenRef.current = activeToken;

    try {
      const wsBase = getWsBaseUrl();
      const wsUrl = `${wsBase}/ws/admin/${companyId}?token=${encodeURIComponent(activeToken)}`;
      console.log("[WS] 🔌 CONNECT", maskToken(wsUrl));
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ WebSocket Connected Successfully");
        console.log("🏢 Company ID:", companyId);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        authRetryRef.current = false;

        // Request all staff locations on connect
        console.log("📤 Auto-requesting all staff locations on connect");
        if (ws.readyState === WebSocket.OPEN) {
          const message = { action: "get_all" };
          wsLogRequest(message);
          ws.send(JSON.stringify(message));
        }
      };

      ws.onmessage = (event) => {
        try {
          wsLogResponse(event.data);
          const rawData = JSON.parse(event.data);

          // Staff went offline: stop showing the pin as live
          if (rawData.type === "staff_offline" && rawData.staff_id) {
            const offline = rawData as StaffOfflineEvent;
            setStaffLocations((prev) => {
              if (!(offline.staff_id in prev)) return prev;
              const updated = { ...prev };
              delete updated[offline.staff_id];
              return updated;
            });
            return;
          }

          // Check if it's an error frame (e.g., invalid token, unauthorized, or staff not online)
          if (rawData.status === "error" || rawData.type === "error") {
            console.warn("⚠️ WebSocket Error Frame Received:", rawData.message);
            setError(rawData.message || "Error received from location service");
            return;
          }

          // Check if it's a single staff location update format (handles get_one reply and unsolicited push)
          if (rawData.staff_id && rawData.location) {
            const singleUpdate = rawData as SingleLocationUpdate;
            console.log("📥 Single Staff Location Update Received:", {
              staff_id: singleUpdate.staff_id,
              location: singleUpdate.location,
              full_response: singleUpdate,
            });

            setStaffLocations((prev) => {
              const updated = { ...prev };
              updated[singleUpdate.staff_id] = singleUpdate.location;
              console.log(`📍 Location update for ${singleUpdate.staff_id}:`, {
                latitude: singleUpdate.location.latitude,
                longitude: singleUpdate.location.longitude,
                timestamp: singleUpdate.location.timestamp,
                task_status: singleUpdate.location.task_status,
                geofence: singleUpdate.location.geofence,
              });
              return updated;
            });
          }
          // Check if it's a bulk locations response format
          else if (rawData.status === "success" && rawData.locations) {
            const data = rawData as LocationTrackingResponse;
            console.log("📥 Bulk Locations Response Received:", {
              status: data.status,
              total_online_staff: data.total_online_staff,
              locations_count: data.locations
                ? Object.keys(data.locations).length
                : 0,
              staff_ids: data.locations ? Object.keys(data.locations) : [],
              full_response: data,
            });

            // The snapshot lists only online staff, so replace the state
            setStaffLocations({ ...data.locations });
          } else {
            console.warn("⚠️ Unknown WebSocket message format:", rawData);
          }
        } catch (err) {
          console.error("❌ Error parsing WebSocket message:", err);
          console.error("❌ Raw message data:", event.data);
          setError("Failed to parse location data");
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        console.error("❌ Error details:", {
          type: err.type,
          target: err.target,
        });
        setError("WebSocket connection error");
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log("[WS] 🔌 CLOSED", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        console.log("🔌 Close event details:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        setIsConnected(false);

        // Code 1008 = auth failure (usually an expired access token).
        // Refresh the token once and reconnect; never loop.
        if (event.code === 1008) {
          if (!authRetryRef.current) {
            authRetryRef.current = true;
            console.warn("🔄 WebSocket auth failed (1008). Refreshing token...");
            refreshAccessToken().then((fresh) => {
              if (seq !== connectSeqRef.current) return;
              if (fresh) {
                connect(fresh);
              } else {
                setError("Session expired. Please log in again.");
              }
            });
            return;
          }
          console.error(
            "❌ WebSocket closed with 1008 again after token refresh. Stopping.",
          );
          setError(
            "Not authorized to view live locations (Close code 1008).",
          );
          return;
        }

        // Attempt to reconnect if enabled and not manually closed
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            reconnectDelay * 2 ** (reconnectAttemptsRef.current - 1),
            30000,
          );
          console.log(
            `🔄 Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`,
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `🔄 Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`,
            );
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error(
            "❌ Max reconnection attempts reached. Manual refresh required.",
          );
          setError("Failed to reconnect. Please refresh the page.");
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Error creating WebSocket:", err);
      setError("Failed to establish WebSocket connection");
      setIsConnected(false);
    }
  }, [companyId, token, enabled]);

  const disconnect = useCallback(() => {
    console.log("🔌 Disconnecting WebSocket...");
    connectSeqRef.current += 1; // cancel any in-flight async connect
    connectedTokenRef.current = null;
    if (reconnectTimeoutRef.current) {
      console.log("⏹️ Clearing reconnection timeout");
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      console.log("🔌 Closing WebSocket connection");
      wsRef.current.onclose = null; // intentional close: no auto-reconnect
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
    authRetryRef.current = false;
    console.log("✅ WebSocket disconnected");
  }, []);

  const requestSingleStaff = useCallback(
    (staffId: string) => {
      const message = { action: "get_one", staff_id: staffId };
      console.log("📤 Requesting Single Staff Location:", message);
      sendMessage(message);
    },
    [sendMessage],
  );

  // Connect on mount and when companyId, token, or enabled changes
  useEffect(() => {
    console.log("🔄 Location Tracking Hook Effect:", {
      companyId,
      enabled,
      hasToken: !!(token || getAccessToken()),
      shouldConnect: companyId && enabled && !!(token || getAccessToken()),
    });

    if (companyId && enabled) {
      console.log("✅ Conditions met - Connecting WebSocket");
      connect();
    } else {
      console.log("❌ Conditions not met - Disconnecting WebSocket");
      disconnect();
    }

    return () => {
      console.log("🧹 Cleanup: Disconnecting WebSocket on unmount");
      disconnect();
    };
  }, [companyId, token, enabled, connect, disconnect]);

  return {
    staffLocations,
    isConnected,
    error,
    requestAllStaff,
    requestSingleStaff,
    disconnect,
    reconnect: connect,
  };
};

