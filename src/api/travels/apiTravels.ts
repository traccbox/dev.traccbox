import api from "../AxiosInstance";
import {
  GetTravelSummaryParams,
  GetTravelSummaryResponse,
  GetTravelTripsParams,
  GetTravelTripsResponse,
  GetTripRouteParams,
  GetTripRouteResponse,
} from "./types";

export async function getTravelSummary(
  params?: GetTravelSummaryParams,
): Promise<GetTravelSummaryResponse> {
  const response = await api.get<GetTravelSummaryResponse>("/travel/summary", {
    params,
  });

  return response.data;
}

export async function getTravelTrips(
  params?: GetTravelTripsParams,
): Promise<GetTravelTripsResponse> {
  const response = await api.get<GetTravelTripsResponse>("/travel/trips", {
    params,
  });

  return response.data;
}

export async function getTripRoute(
  tripId: string,
  params?: GetTripRouteParams,
): Promise<GetTripRouteResponse> {
  const response = await api.get<GetTripRouteResponse>(
    `/travel/trips/${tripId}/route`,
    { params },
  );

  return response.data;
}
