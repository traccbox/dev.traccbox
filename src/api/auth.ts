import axios from "axios";
import {
  RegisterRequest,
  RegisterCompanyResponse,
  LoginRequest,
  LoginResponse,
  ResendVerificationRequest,
  VerifyEmailParams,
  StaffCreateRequest,
  StaffAcceptRequest,
  StaffPermissionUpdateRequest,
  StaffDeleteRequest,
  StaffLoginRequest,
  StaffLoginResponse,
  StaffVerifyResponse,
} from "./types";
import Cookies from "js-cookie";

const API_BASE = import.meta.env.VITE_API_BASE;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// api.interceptors.request.use(
//   (config) => {
//     // Add CORS headers to the request
//     config.headers["Access-Control-Allow-Origin"] = "*";
//     config.headers["Access-Control-Allow-Methods"] =
//       "GET,PUT,POST,DELETE,PATCH,OPTIONS";
//     config.headers["Access-Control-Allow-Headers"] =
//       "Content-Type, Authorization";

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );
export async function registerCompany(data: RegisterRequest) {
  console.log("Sending regis", data);
  const res = await api.post<RegisterCompanyResponse>(
    `/companies/register`,
    data
  );
  console.log("Register res==", res);
  return res.data;
}

export async function login(data: LoginRequest) {
  console.log("Sending", data);
  const res = await api.post<LoginResponse>(`/companies/login`, data);
  console.log("Login res==", res);
  return res.data;
}

// Staff Login - Email only, triggers OTP
export async function staffLogin(data: StaffLoginRequest) {
  console.log("Request Data", data);
  try {
    const res = await api.post<StaffLoginResponse>(`/staff/login`, data);

    return res.data;
  } catch (error) {
    console.log("staff auth.ts error", error);
    throw error;
  }
}

// Staff Email Verification with OTP
export async function verifyStaffEmail(params: { id: string; token: string }) {
  console.log("verifyStaffEmail params ,,,,==", params);
  try {
    const res = await api.post<StaffVerifyResponse>(
      `/staff/verify_email?id=${params.id}&token=${params.token}`
    );
    console.log("Staff email verification res==", res);
    return res.data;
  } catch (error) {
    console.log("verifyStaffEmail error", error);
    throw error;
  }
}
export async function resendStaffVerification(data: ResendVerificationRequest) {
  try {
    const res = await api.post(`/staff/resend-verification`, data);
    return res.data;
  } catch (error) {
    console.log("resendVerification error", error);
    throw error;
  }
}

export async function resendVerification(data: ResendVerificationRequest) {
  try {
    const res = await api.post(`/resend-verification`, data);
    return res.data;
  } catch (error) {
    console.log("resendVerification error", error);
    throw error;
  }
}

export async function verifyEmail(params: VerifyEmailParams) {
  console.log("verifyEmail params ", params);
  try {
    const res = await api.post(
      `/companies/verify_email?id=${params.id}&token=${params.token}`
    );
    return res.data;
  } catch (error) {
    console.log("verifyEmail error", error);
    throw error;
  }
}

export async function forgottenPasswordRequest(email: string) {
  try {
    const res = await api.post(`/companies/forgotten_password`, null, {
      params: { email },
    });
    return res.data;
  } catch (error) {
    console.log("forgottenPasswordRequest error", error);
    throw error;
  }
}

export async function forgottenPasswordUpdate(
  email: string,
  reset_token: string,
  password: string
) {
  try {
    const res = await api.patch(`/companies/forgotten_password`, null, {
      params: { email, reset_token, password },
    });
    return res.data;
  } catch (error) {
    console.log("forgottenPasswordUpdate error", error);
    throw error;
  }
}

export async function updateCompanyInfo(
  company_id: string,
  data: {
    company_name: string;
    company_industry: string;
    phone_number: string;
    address: string;
    country: string;
    logo_url?: string;
  }
) {
  console.log(company_id, "Data Going to Backend=====", data);
  try {
    const res = await api.put(`/update/${company_id}`, data);
    console.log("reeeeee=====", res);
    return res.data;
  } catch (error) {
    console.log("Update company ERROR response=====", error);
    throw error;
  }
}

export async function getNewToken(refresh_token: string) {
  try {
    const res = await api.post(`${API_BASE}/refresh`, {
      refresh_token,
    });
    console.log("res of New token=====", res);
    return res.data;
  } catch (error) {
    console.log("getNewToken ERROR response=====", error);
    throw error;
  }
}

// Staff Management API Functions

// Get authorization header with token
const getAuthHeaders = () => {
  const token = Cookies.get("access_token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Create new staff member
export async function createStaff(data: StaffCreateRequest) {
  console.log("Data Going to Backend=====", data);
  try {
    const res = await api.post(`/onboarding/staff`, data, getAuthHeaders());
    console.log("Create staff response=====", res);
    return res.data;
  } catch (error) {
    console.log("Create staff ERROR response=====", error);
    throw error;
  }
}


// Accept staff invitation
export async function acceptStaffInvitation(data: StaffAcceptRequest) {
  console.log("Data Going to Backend=====", data);
  try {
    const res = await api.post(
      `/onboarding/staff/accept`,
      data,
      getAuthHeaders()
    );
    console.log("Accept invitation response=====", res);
    return res.data;
  } catch (error) {
    console.log("accept staff ERROR response=====", error);
    throw error;
  }
}

// Update staff permissions
export async function updateStaffPermissions(
  data: StaffPermissionUpdateRequest
) {
  const res = await api.patch(
    `/onboarding/staff/permissions`,
    data,
    getAuthHeaders()
  );
  console.log("Update permissions response=====", res);
  return res.data;
}

// Delete staff member
export async function deleteStaff(data: StaffDeleteRequest) {
  const res = await api.delete(`/api/v1/onboarding/staff/permissions`, {
    ...getAuthHeaders(),
    data: data,
  });
  console.log("Delete staff response=====", res);
  return res.data;
}
