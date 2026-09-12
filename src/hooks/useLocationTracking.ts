import { useState, useEffect, useRef, useCallback } from "react";
import { getAccessToken } from "@/utils/authUtils";

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
  task_status?: string;
  address?: string;
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
  const reconnectDelay = 3000; // 3 seconds

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      console.log("📤 Sending WebSocket Message:", message);
      console.log("📤 Message String:", messageStr);
      console.log("📤 WebSocket Ready State:", wsRef.current.readyState);
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

  const connect = useCallback(() => {
    if (!companyId || !enabled) return;

    const activeToken = token || getAccessToken();
    if (!activeToken) {
      console.warn("⚠️ No access token available for WebSocket connection");
      setError("No access token available for location tracking connection.");
      setIsConnected(false);
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const wsBase = getWsBaseUrl();
      const wsUrl = `${wsBase}/ws/admin/${companyId}?token=${encodeURIComponent(activeToken)}`;
      console.log("🔌 Attempting WebSocket connection to:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ WebSocket Connected Successfully");
        console.log("📡 WebSocket URL:", wsUrl);
        console.log("🏢 Company ID:", companyId);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Request all staff locations on connect
        console.log("📤 Auto-requesting all staff locations on connect");
        if (ws.readyState === WebSocket.OPEN) {
          const message = { action: "get_all" };
          console.log("📤 Sending initial get_all request:", message);
          ws.send(JSON.stringify(message));
        }
      };

      ws.onmessage = (event) => {
        try {
          console.log("📥 WebSocket Message Received (raw):", event.data);
          const rawData = JSON.parse(event.data);

          // Check if it's an error frame (e.g., invalid token, unauthorized, or staff not online)
          if (rawData.status === "error") {
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

            setStaffLocations((prev) => {
              const updated = { ...prev };
              Object.keys(data.locations).forEach((staffId) => {
                const location = data.locations[staffId];
                updated[staffId] = location;
              });
              return updated;
            });
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
        console.log("🔌 WebSocket Disconnected");
        console.log("🔌 Close event details:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        setIsConnected(false);

        // Code 1008 indicates Policy Violation / Auth Failure
        if (event.code === 1008) {
          console.error(
            "❌ WebSocket closed with code 1008 (Policy Violation / Auth Failure). Stopping reconnect attempts.",
          );
          setError(
            "Authentication failed or unauthorized to view live locations (Close code 1008).",
          );
          return;
        }

        // Attempt to reconnect if enabled and not manually closed
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `🔄 Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${reconnectDelay}ms`,
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `🔄 Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`,
            );
            connect();
          }, reconnectDelay);
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
    if (reconnectTimeoutRef.current) {
      console.log("⏹️ Clearing reconnection timeout");
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      console.log("🔌 Closing WebSocket connection");
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
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

