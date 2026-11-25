// api/performance/apiPerformance.ts

import api from "../AxiosInstance";
import {
  BranchPerformanceReportRow,
  EmployeePerformanceReportRow,
  GetPerformanceFiltersResponse,
  GetPerformanceLogsParams,
  GetPerformanceLogsResponse,
  GetPerformanceReportParams,
  GetPerformanceReportResponse,
  PerformanceReportRowMap,
  PerformanceReportTableParams,
  PerformanceReportTableResponse,
  PerformanceReportType,
  TeamPerformanceReportRow,
  GetPerformanceLogsSummaryParams,
  GetPerformanceLogsSummaryResponse,
  GetPerformanceLogResponse,
  PerformanceLogStatusUpdate,
  UpdatePerformanceLogStatusResponse,
  GetEmployeeReportParams,
  GetEmployeeReportResponse,
} from "./types";

export async function getPerformanceLogs(
  params?: GetPerformanceLogsParams,
): Promise<GetPerformanceLogsResponse> {
  const response = await api.get<GetPerformanceLogsResponse>(
    "/performance/logs",
    {
      params,
    },
  );

  return response.data;
}

export async function getPerformanceFilters(): Promise<GetPerformanceFiltersResponse> {
  const response = await api.get<GetPerformanceFiltersResponse>(
    "/performance/logs/filters",
  );

  return response.data;
}
export async function getPerformanceReport(
  params: GetPerformanceReportParams,
): Promise<GetPerformanceReportResponse> {
  const response = await api.get<GetPerformanceReportResponse>(
    "/performance/reports",
    {
      params,
    },
  );

  return response.data;
}


export async function getPerformanceReportTable<
  T extends PerformanceReportType,
>(
  reportType: T,
  params: PerformanceReportTableParams,
): Promise<PerformanceReportTableResponse<PerformanceReportRowMap[T]>> {
  const response = await api.get<
    PerformanceReportTableResponse<PerformanceReportRowMap[T]>
  >(`/performance/reports/${reportType}`, {
    params,
  });

  return response.data;
}

export async function getPerformanceLogsSummary(
  params?: GetPerformanceLogsSummaryParams,
): Promise<GetPerformanceLogsSummaryResponse> {
  const response = await api.get<GetPerformanceLogsSummaryResponse>(
    "/performance/logs/summary",
    { params },
  );

  return response.data;
}

export async function getPerformanceLog(
  logId: string,
): Promise<GetPerformanceLogResponse> {
  const response = await api.get<GetPerformanceLogResponse>(
    `/performance/logs/${logId}`,
  );

  return response.data;
}

export async function updatePerformanceLogStatus(
  logId: string,
  body: PerformanceLogStatusUpdate,
): Promise<UpdatePerformanceLogStatusResponse> {
  const response = await api.patch<UpdatePerformanceLogStatusResponse>(
    `/performance/logs/${logId}/status`,
    body,
  );

  return response.data;
}

export async function getEmployeeReport(
  employeeId: string,
  params?: GetEmployeeReportParams,
): Promise<GetEmployeeReportResponse> {
  const response = await api.get<GetEmployeeReportResponse>(
    `/performance/employees/${employeeId}/report`,
    { params },
  );

  return response.data;
}
