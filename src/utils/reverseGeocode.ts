// Reverse geocoding utility using OpenStreetMap Nominatim API
// Free service, no API key required
// Note: Nominatim has a rate limit of 1 request per second

export interface ReverseGeocodeResult {
  address: string;
  displayName: string;
}

const addressCache = new Map<string, ReverseGeocodeResult>();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> => {
  const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  
  // Check cache first
  if (addressCache.has(cacheKey)) {
    console.log("📍 Using cached address for:", cacheKey);
    return addressCache.get(cacheKey)!;
  }

  try {
    console.log("🌍 Reverse geocoding:", { latitude, longitude });
    
    // Rate limiting: ensure at least 1 second between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();
    
    // Using OpenStreetMap Nominatim API (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TraccBox Location Tracking App', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("🌍 Reverse geocode response:", data);

    // Format the address from the response
    const address = data.address || {};
    let displayName = "";
    let addressParts: string[] = [];

    // Build address string from most specific to least specific
    if (address.road) addressParts.push(address.road);
    if (address.suburb || address.neighbourhood) {
      addressParts.push(address.suburb || address.neighbourhood);
    }
    if (address.city || address.town || address.village) {
      addressParts.push(address.city || address.town || address.village);
    }
    if (address.state) addressParts.push(address.state);
    if (address.country) addressParts.push(address.country);

    displayName = addressParts.length > 0 
      ? addressParts.join(", ")
      : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    const result: ReverseGeocodeResult = {
      address: displayName,
      displayName: displayName,
    };

    // Cache the result
    addressCache.set(cacheKey, result);
    
    // Limit cache size to prevent memory issues
    if (addressCache.size > 100) {
      const firstKey = addressCache.keys().next().value;
      addressCache.delete(firstKey);
    }

    console.log("✅ Reverse geocode result:", result);
    return result;
  } catch (error) {
    console.error("❌ Reverse geocoding error:", error);
    // Return coordinates as fallback
    const fallback: ReverseGeocodeResult = {
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      displayName: `Latitude: ${latitude.toFixed(6)} | Longitude: ${longitude.toFixed(6)}`,
    };
    return fallback;
  }
};

