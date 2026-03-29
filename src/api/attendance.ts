import AxiosInstance from "./AxiosInstance";
import type {
  AttendanceCheckInRequest,
  AttendanceCheckOutRequest,
  AttendanceResponse,
  AttendanceStatus,
} from "./types";

const API_BASE = "/api/v1/attendance";

export const checkIn = async (
  data: AttendanceCheckInRequest,
): Promise<AttendanceResponse> => {
  const response = await AxiosInstance.post<AttendanceResponse>(
    `${API_BASE}/check-in`,
    data,
  );
  return response.data;
};

export const checkOut = async (
  data: AttendanceCheckOutRequest,
): Promise<AttendanceResponse> => {
  const response = await AxiosInstance.post<AttendanceResponse>(
    `${API_BASE}/check-out`,
    data,
  );
  return response.data;
};

export const getAttendanceStatus = async (
  staffId: string,
): Promise<AttendanceStatus> => {
  const response = await AxiosInstance.get<AttendanceStatus>(
    `${API_BASE}/status/${staffId}`,
  );
  return response.data;
};
