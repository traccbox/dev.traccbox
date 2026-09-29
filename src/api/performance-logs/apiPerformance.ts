// api/performance/apiPerformance.ts

import api from "../AxiosInstance";
import {
  GetPerformanceFiltersResponse,
  GetPerformanceLogsParams,
  GetPerformanceLogsResponse,
  GetPerformanceReportParams,
  GetPerformanceReportResponse,
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

  console.log(response.data, "Testing performance logs");
  return response.data;
}
