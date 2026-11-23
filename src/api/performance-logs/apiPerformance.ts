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
