import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { StaffLocations } from "@/hooks/useLocationTracking";
import { format } from "date-fns";
import { reverseGeocode } from "@/utils/reverseGeocode";

// Fix for default markers in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icon for staff
const createStaffIcon = (color: string = "#3388ff") => {
  return L.divIcon({
    className: "custom-staff-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

interface StaffInfo {
  name: string;
  role?: string;
  jobTitle?: string;
  department?: string;
}

interface LocationMapProps {
  staffLocations: StaffLocations;
  selectedStaffId?: string | null;
  showAll?: boolean;
  height?: string;
  className?: string;
  staffNames?: Record<string, string>; // Map staff IDs to names
  staffInfo?: Record<string, StaffInfo>; // Map staff IDs to full info
}

const LocationMap: React.FC<LocationMapProps> = ({
  staffLocations,
  selectedStaffId,
  showAll = true,
  height = "600px",
  className = "",
  staffNames = {},
  staffInfo = {},
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const addressesRef = useRef<Map<string, string>>(new Map()); // Cache addresses by staffId
  const [addresses, setAddresses] = useState<Record<string, string>>({});

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map with default view (can be adjusted based on locations)
    const map = L.map(mapRef.current).setView([6.5244, 3.3792], 10); // Default to Lagos, Nigeria

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const markers = markersRef.current;

    // Determine which locations to show
    const locationsToShow: StaffLocations = {};

    if (showAll) {
      Object.assign(locationsToShow, staffLocations);
    } else if (selectedStaffId && staffLocations[selectedStaffId]) {
      locationsToShow[selectedStaffId] = staffLocations[selectedStaffId];
    }

    // Remove markers that are no longer needed
    Object.keys(staffLocations).forEach((staffId) => {
      if (!locationsToShow[staffId] && markers.has(staffId)) {
        const marker = markers.get(staffId);
        if (marker) {
          map.removeLayer(marker);
          markers.delete(staffId);
        }
      }
    });

    // Fetch addresses for all visible locations (async)
    const fetchAddresses = async () => {
      const addressPromises = Object.entries(locationsToShow).map(
        async ([staffId, location]) => {
          const { latitude, longitude } = location;

          if (!latitude || !longitude) {
            console.warn(
              `⚠️ Invalid location data for staff ${staffId}:`,
              location
            );
            return;
          }

          // Fetch address if not already cached
          if (!addressesRef.current.has(staffId)) {
            try {
              const geocodeResult = await reverseGeocode(latitude, longitude);
              addressesRef.current.set(staffId, geocodeResult.displayName);
              setAddresses((prev) => ({
                ...prev,
                [staffId]: geocodeResult.displayName,
              }));
            } catch (error) {
              console.error(`❌ Error fetching address for ${staffId}:`, error);
              const fallback = `Latitude: ${latitude.toFixed(
                6
              )} | Longitude: ${longitude.toFixed(6)}`;
              addressesRef.current.set(staffId, fallback);
              setAddresses((prev) => ({
                ...prev,
                [staffId]: fallback,
              }));
            }
          }
        }
      );

      await Promise.all(addressPromises);
    };

    fetchAddresses();

    // Add or update markers for visible locations
    Object.entries(locationsToShow).forEach(([staffId, location]) => {
      const { latitude, longitude, timestamp, task_status } = location;

      if (!latitude || !longitude) {
        console.warn(
          `⚠️ Invalid location data for staff ${staffId}:`,
          location
        );
        return;
      }

      const info = staffInfo[staffId];
      const staffName = info?.name || staffNames[staffId] || staffId;
      const staffRole = info?.role;
      const staffJobTitle = info?.jobTitle;
      const formattedTime = timestamp
        ? format(new Date(timestamp), "PPp")
        : "Unknown";

      // Get address from cache or use coordinates as fallback
      const address =
        addressesRef.current.get(staffId) ||
        addresses[staffId] ||
        `Latitude: ${latitude.toFixed(6)} | Longitude: ${longitude.toFixed(6)}`;

      console.log(`🗺️ Updating marker for staff:`, {
        staffId,
        name: staffName,
        role: staffRole,
        location: { latitude, longitude },
        address,
        timestamp,
      });

      // Create popup content with enhanced information (matching the sample format)
      const popupContent = `
        <div style="min-width: 250px; padding: 12px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px; color: #1a1a1a;">${staffName}</h3>
          ${
            staffRole
              ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #4a5568; font-weight: 500;">${staffRole}${
                  staffJobTitle ? ` • ${staffJobTitle}` : ""
                }</p>`
              : ""
          }
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="margin: 6px 0; font-size: 13px; color: #374151; line-height: 1.5;">
            ${address}
          </p> 
          <p style="margin: 4px 0; font-size: 11px; color: #6b7280;">
            Latitude: ${latitude.toFixed(6)} | Longitude: ${longitude.toFixed(
        6
      )}
          </p>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            <strong>Task Status:</strong> <span style="color: ${
              task_status === "completed"
                ? "#10b981"
                : task_status === "pending"
                ? "#f59e0b"
                : "#6b7280"
            }">${task_status || "N/A"}</span>
          </p>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            <strong>Last Updated:</strong> ${formattedTime}
          </p>
          <p style="margin: 6px 0 0 0; font-size: 10px; color: #9ca3af;">
            Staff ID: ${staffId}
          </p>
        </div>
      `;

      if (markers.has(staffId)) {
        // Update existing marker
        const marker = markers.get(staffId);
        if (marker) {
          marker.setLatLng([latitude, longitude]);
          marker.setPopupContent(popupContent);
        }
      } else {
        // Create new marker
        const marker = L.marker([latitude, longitude], {
          icon: createStaffIcon(),
        })
          .addTo(map)
          .bindPopup(popupContent);

        markers.set(staffId, marker);
      }
    });

    // Fit map bounds to show all visible markers
    if (Object.keys(locationsToShow).length > 0) {
      const bounds = L.latLngBounds(
        Object.values(locationsToShow).map((loc) => [
          loc.latitude,
          loc.longitude,
        ])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
      console.log(
        `🗺️ Map bounds updated for ${
          Object.keys(locationsToShow).length
        } marker(s)`
      );
    }
  }, [
    staffLocations,
    selectedStaffId,
    showAll,
    staffNames,
    staffInfo,
    addresses,
  ]);

  return (
    <div
      ref={mapRef}
      className={`location-map ${className}`}
      style={{ height, width: "100%", borderRadius: "8px", overflow: "hidden" }}
    />
  );
};

export default LocationMap;
