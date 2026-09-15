import { useQuery, useMutation } from "@tanstack/react-query";
import { placesService } from "../TaskService";

// Hook for fetching place suggestions
export const usePlaceSuggestions = (input: string, language: string = "en") => {
  console.log("Location Input", input);
  return useQuery({
    queryKey: ["place-suggestions", input, language],
    queryFn: () => placesService.suggestPlaces(input, language),
    enabled: !!input && input.length > 2,
    staleTime: 5 * 60 * 1000, 
    gcTime: 30 * 60 * 1000, 
  });
};

// Hook for fetching coordinates of a selected place_id
export const usePlaceCoordinates = () => {
  return useMutation({
    mutationFn: (placeId: string) => placesService.getPlaceCoordinates(placeId),
    onError: (error) => {
      console.error("Failed to get place coordinates:", error);
    },
  });
};

