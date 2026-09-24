import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

const TOKEN_KEY = "access_token";

export interface DecodedUser {
  id: string;
  email: string;
  company_name: string | null;
  company_industry: string | null;
  verified_email: boolean;
  [key: string]: any;
}

const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * Get the access token from cookies or localStorage
 */
export const getAccessToken = (): string | null => {
  // Try cookies first (most reliable)
  const tokenFromCookie = Cookies.get(TOKEN_KEY);
  if (tokenFromCookie) return tokenFromCookie;

  // Fallback to localStorage
  const tokenFromStorage = localStorage.getItem(TOKEN_KEY);
  if (tokenFromStorage) return tokenFromStorage;

  return null;
};

/**
 * Get the refresh token from cookies or localStorage
 */
export const getRefreshToken = (): string | null => {
  const tokenFromCookie = Cookies.get(REFRESH_TOKEN_KEY);
  if (tokenFromCookie) return tokenFromCookie;

  const tokenFromStorage = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (tokenFromStorage) return tokenFromStorage;

  return null;
};

/**
 * Set auth tokens in cookies and localStorage
 */
export const setAuthTokens = (accessToken: string, refreshToken?: string) => {
  Cookies.set(TOKEN_KEY, accessToken, { expires: 7 });
  localStorage.setItem(TOKEN_KEY, accessToken);

  if (refreshToken) {
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 7 });
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  // Update staff_data if present
  try {
    const rawStaff = localStorage.getItem("staff_data");
    if (rawStaff) {
      const parsedStaff = JSON.parse(rawStaff);
      parsedStaff.access_token = accessToken;
      if (refreshToken) {
        parsedStaff.refresh_token = refreshToken;
      }
      localStorage.setItem("staff_data", JSON.stringify(parsedStaff));
    }
  } catch (err) {
    console.error("Error updating staff_data tokens:", err);
  }
};

/**
 * Decode the access token and get user data
 */
export const getUserFromToken = (): DecodedUser | null => {
  try {
    const token = getAccessToken();
    if (!token) return null;

    const decoded = jwtDecode<DecodedUser>(token);
    console.log("Decoded user from token:", decoded);
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Check if token is valid (not expired)
 */
export const isTokenValid = (token?: string): boolean => {
  try {
    const currentToken = token || getAccessToken();
    if (!currentToken) return false;

    const decoded = jwtDecode<any>(currentToken);
    const now = Date.now() / 1000;

    // Check if token is expired (with 60 second buffer)
    return decoded.exp && decoded.exp > now + 60;
  } catch (error) {
    return false;
  }
};

/**
 * Save user data to localStorage for cross-tab access
 */
export const saveUserToStorage = (user: DecodedUser) => {
  try {
    localStorage.setItem("user_data", JSON.stringify(user));
    localStorage.setItem("user_data_timestamp", Date.now().toString());
  } catch (error) {
    console.error("Error saving user to storage:", error);
  }
};

/**
 * Get user data from localStorage
 */
export const getUserFromStorage = (): DecodedUser | null => {
  try {
    const userData = localStorage.getItem("user_data");
    if (!userData) return null;

    const user = JSON.parse(userData);
    const timestamp = localStorage.getItem("user_data_timestamp");
    
    // Check if data is less than 1 hour old
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age > 60 * 60 * 1000) {
        // Data is too old, clear it
        localStorage.removeItem("user_data");
        localStorage.removeItem("user_data_timestamp");
        return null;
      }
    }

    return user;
  } catch (error) {
    console.error("Error getting user from storage:", error);
    return null;
  }
};

/**
 * Get current user (from token first, then localStorage)
 */
export const getCurrentUser = (): DecodedUser | null => {
  // Try to get from token first
  const userFromToken = getUserFromToken();
  if (userFromToken) {
    saveUserToStorage(userFromToken);
    return userFromToken;
  }

  // Fallback to localStorage
  return getUserFromStorage();
};
