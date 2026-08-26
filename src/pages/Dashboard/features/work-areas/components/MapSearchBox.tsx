import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlaceSuggestions, usePlaceCoordinates } from "@/api/geoFencing/hooksGeoFencing";

interface Props {
  onPick: (result: { label: string; lat: number; lng: number }) => void;
  placeholder?: string;
}

export default function MapSearchBox({
  onPick,
  placeholder = "Search a place…",
}: Props) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(term, 400);
  
  const { data: suggestionRes, isFetching, isError } = usePlaceSuggestions(debounced);
  const suggestions = suggestionRes?.suggestions || [];
  
  const resolveCoords = usePlaceCoordinates();

  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
      />
      {(isFetching || resolveCoords.isPending) && (
        <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
      )}

      {open && debounced.trim().length > 1 && (
        <div className="absolute z-[500] mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {isError && (
            <div className="px-3 py-2 text-xs text-red-600">
              Search failed. Try again.
            </div>
          )}
          {!isError && !isFetching && suggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">No places found.</div>
          )}
          {suggestions.map((r, i) => (
            <button
              key={`${r.place_id}-${i}`}
              type="button"
              disabled={resolveCoords.isPending}
              onClick={() => {
                resolveCoords.mutate(r.place_id, {
                  onSuccess: (coords) => {
                    onPick({
                      label: r.description,
                      lat: coords.latitude,
                      lng: coords.longitude,
                    });
                    setTerm(r.description);
                    setOpen(false);
                  },
                });
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 disabled:opacity-50"
            >
              <div className="font-medium text-gray-800 truncate">{r.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
