import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { login as apiLogin, staffLogin as apiStaffLogin } from "@/api/auth";
import type { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { isTokenValid } from "@/utils/authUtils";

export interface User {
  id: string;
  email: string;
  company_name: string | null;
  company_industry: string | null;
  address: string | null;
  country: string | null;
  created_at: string | null;
  phone_number: string | null;
  profile_pic: string | null;
  subscription: string | null;
  verified_email: boolean;
}

export type PermissionsMap = Record<string, Record<string, boolean>>;

export interface StaffData {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  job_title?: string | null;
  department?: string | null;
  profile_pic?: string | null;
  role: string;
  company_id: string;
  permissions: PermissionsMap;
  access_token: string;
  refresh_token: string;
}

interface StaffAuthResponse {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  job_title?: string | null;
  department?: string | null;
  profile_pic?: string | null;
  role: string;
  company_id: string;
  permissions: PermissionsMap;
  access_token: string;
  refresh_token: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  staff: StaffData | null;
  isStaff: boolean;
  permissions: PermissionsMap;
  hasPermission: (module: string, action: string) => boolean;
  token: string | null;
  refreshToken: string | null;
  TOKEN_KEY: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  staffLogin: (email: string) => Promise<{
    success: boolean;
    status: number;
    needsVerification: boolean;
    id?: string | number;
  }>;
  authenticateStaff: (response: StaffAuthResponse) => void;

  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getUserFromToken = (token: string): User | null => {
  try {
    const decoded = jwtDecode<User>(token);
    return {
      id: decoded.id,
      email: decoded.email,
      company_name: decoded.company_name ?? null,
      company_industry: decoded.company_industry ?? null,
      address: decoded.address ?? null,
      country: decoded.country ?? null,
      created_at: decoded.created_at ?? null,
      phone_number: decoded.phone_number ?? null,
      profile_pic: decoded.profile_pic ?? null,
      subscription: decoded.subscription ?? null,
      verified_email: decoded.verified_email ?? false,
    };
  } catch {
    return null;
  }
};

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN = "refresh_token";
const STAFF_KEY = "staff_data";

const loadStaffFromStorage = (): StaffData | null => {
  try {
    const raw = localStorage.getItem(STAFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StaffData;
    if (!parsed?.access_token || !isTokenValid(parsed.access_token)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [staff, setStaff] = useState<StaffData | null>(() => loadStaffFromStorage());
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    return storedToken && isTokenValid(storedToken) ? storedToken : null;
  });
  const [refreshToken, setRefreshToke] = useState<string | null>(() => {
    const storedRefresh = Cookies.get(REFRESH_TOKEN) || localStorage.getItem(REFRESH_TOKEN);
    return storedRefresh || null;
  });
  const [user, setUser] = useState<User | null>(() => {
    const storedStaff = loadStaffFromStorage();
    if (storedStaff) {
      return {
        id: storedStaff.id,
        email: storedStaff.email,
        company_name: null,
        company_industry: null,
        address: null,
        country: null,
        created_at: null,
        phone_number: storedStaff.phone_number ?? null,
        profile_pic: storedStaff.profile_pic ?? null,
        subscription: null,
        verified_email: true,
      };
    }
    const storedToken = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (!storedToken || !isTokenValid(storedToken)) return null;
    return getUserFromToken(storedToken);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && refreshToken && isTokenValid(token)) {
      Cookies.set(TOKEN_KEY, token, { expires: 7 });
      Cookies.set(REFRESH_TOKEN, refreshToken, { expires: 7 });
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(REFRESH_TOKEN, refreshToken);

      // Only overwrite user from JWT for company-admin flow (no staff session)
      if (!staff) {
        const userData = getUserFromToken(token);
        setUser(userData);
        if (userData) {
          try {
            localStorage.setItem("user_data", JSON.stringify(userData));
            localStorage.setItem("user_data_timestamp", Date.now().toString());
          } catch (err) {
            console.error("Error saving user to localStorage:", err);
          }
        }
      }
    } else {
      Cookies.remove(TOKEN_KEY);
      Cookies.remove(REFRESH_TOKEN);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN);
      localStorage.removeItem("user_data");
      localStorage.removeItem("user_data_timestamp");
      if (!staff) setUser(null);
    }
  }, [token, refreshToken, staff]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === "user_data" || event.key === STAFF_KEY) {
        const staffData = loadStaffFromStorage();
        setStaff(staffData);
        const storedToken = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
        if (storedToken && isTokenValid(storedToken)) {
          setToken(storedToken);
          if (!staffData) setUser(getUserFromToken(storedToken));
        } else {
          setToken(null);
          if (!staffData) setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin({ email, password });
      // Clear any staff session on admin login
      setStaff(null);
      localStorage.removeItem(STAFF_KEY);
      setToken(res.access_token);
      setRefreshToke(res.refresh_token);
      setUser(getUserFromToken(res.access_token));
      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(REFRESH_TOKEN, res.refresh_token);
      const userData = getUserFromToken(res.access_token);
      if (userData) {
        localStorage.setItem("user_data", JSON.stringify(userData));
        localStorage.setItem("user_data_timestamp", Date.now().toString());
      }
      setLoading(false);
      return true;
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail || "Login failed");
      setLoading(false);
      return false;
    }
  };

  const staffLogin = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiStaffLogin({ email });
      return { success: true, status: 200, needsVerification: false, id: res.id };
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      setError(
        typeof axiosError.response?.data?.detail === "string"
          ? axiosError.response.data.detail
          : JSON.stringify(axiosError.response?.data?.detail) ||
              "Staff login failed"
      );
      setLoading(false);
      return {
        success: false,
        status: axiosError.response?.status || 500,
        needsVerification: false,
      };
    }
  };

  const authenticateStaff = useCallback((res: StaffAuthResponse) => {
    const staffData: StaffData = {
      id: res.id,
      full_name: res.full_name,
      email: res.email,
      phone_number: res.phone_number ?? null,
      job_title: res.job_title ?? null,
      department: res.department ?? null,
      profile_pic: res.profile_pic ?? null,
      role: res.role,
      company_id: res.company_id,
      permissions: res.permissions || {},
      access_token: res.access_token,
      refresh_token: res.refresh_token,
    };
    localStorage.setItem(STAFF_KEY, JSON.stringify(staffData));
    setStaff(staffData);
    setToken(res.access_token);
    setRefreshToke(res.refresh_token);
    Cookies.set(TOKEN_KEY, res.access_token, { expires: 7 });
    Cookies.set(REFRESH_TOKEN, res.refresh_token, { expires: 7 });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(REFRESH_TOKEN, res.refresh_token);
    setUser({
      id: staffData.id,
      email: staffData.email,
      company_name: null,
      company_industry: null,
      address: null,
      country: null,
      created_at: null,
      phone_number: staffData.phone_number ?? null,
      profile_pic: staffData.profile_pic ?? null,
      subscription: null,
      verified_email: true,
    });
  }, []);

  const logout = () => {
    setToken(null);
    setRefreshToke(null);
    setUser(null);
    setStaff(null);
    localStorage.removeItem(STAFF_KEY);
  };

  const permissions: PermissionsMap = staff?.permissions ?? {};

  const hasPermission = useCallback(
    (module: string, action: string) => {
      // Company admin (no staff session) has full access
      if (!staff) return true;
      return Boolean(permissions?.[module]?.[action]);
    },
    [staff, permissions]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        staff,
        isStaff: !!staff,
        permissions,
        hasPermission,
        token,
        TOKEN_KEY,
        refreshToken,
        loading,
        error,
        login,
        staffLogin,
        authenticateStaff,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider ");
  return context;
};
