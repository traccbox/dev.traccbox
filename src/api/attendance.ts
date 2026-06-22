import AxiosInstance from "./AxiosInstance";
import type {
  AttendanceCheckInRequest,
  AttendanceCheckOutRequest,
  AttendanceResponse,
  AttendanceStatus,
} from "./types";

const API_BASE = "/api/v1/attendance";

interface AttendanceStatusResponse {
  status: "CHECKED_IN" | "NOT_CHECKED_IN" | "CHECKED_OUT";
  check_in_time?: string;
  check_out_time?: string;
}

export const checkIn = async (
  data: AttendanceCheckInRequest,
): Promise<AttendanceResponse> => {
  const response = await AxiosInstance.post<AttendanceResponse>(
    `/attendance/check-in`,
    data,
  );
  return response.data;
};

export const checkOut = async (
  data: AttendanceCheckOutRequest,
): Promise<AttendanceResponse> => {
  const response = await AxiosInstance.post<AttendanceResponse>(
    `/attendance/check-out`,
    data,
  );
  return response.data;
};

export const getAttendanceStatus = async (
  staffId: string,
): Promise<AttendanceStatus> => {
  const response = await AxiosInstance.get<AttendanceStatusResponse>(
    `/attendance/status/${staffId}`,
  );

  return {
    staff_id: staffId,
    company_id: "",
    is_checked_in: response.data.status === "CHECKED_IN",
    last_check_in: response.data.check_in_time,
    last_check_out: response.data.check_out_time,
    check_in_time: response.data.check_in_time,
    status: response.data.status,
  };
};
