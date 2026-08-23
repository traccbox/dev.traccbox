import { Loader2 } from "lucide-react";
import {
  useCommunities,
  useCountries,
  useLgas,
  useStates,
  useWards,
} from "@/api/geoFencing/hooksGeoFencing";

export interface GeoSelection {
  countryCode?: string;
  countryName?: string;
  stateId?: string;
  stateName?: string;
  lgaId?: string;
  lgaName?: string;
  wardId?: string;
  wardName?: string;
  communityId?: string;
  communityName?: string;
  center?: [number, number];
  zoom?: number;
}

interface Props {
  value: GeoSelection;
  onChange: (next: GeoSelection) => void;
}

function Field({
  label,
  value,
  onChange,
  options,
  loading,
  error,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
        {label}
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
      </label>
      <select
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-600 mt-1">Could not load {label.toLowerCase()}.</p>
      )}
      {!loading && !error && !disabled && options.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">No options available.</p>
      )}
    </div>
  );
}

export default function GeoCascade({ value, onChange }: Props) {
  const countries = useCountries();
  const states = useStates(value.countryCode);
  const lgas = useLgas(value.stateId);
  const wards = useWards(value.lgaId);
  const communities = useCommunities(value.wardId);

  return (
    <div className="space-y-3">
      <Field
        label="Country *"
        placeholder="Select country"
        value={value.countryCode || ""}
        loading={countries.isLoading}
        error={countries.isError}
        options={(countries.data || []).map((c) => ({ id: c.code, name: c.name }))}
        onChange={(code) => {
          const country = (countries.data || []).find((c) => c.code === code);
          onChange({
            countryCode: code || undefined,
            countryName: country?.name,
            center: country?.center,
            zoom: country?.zoom,
          });
        }}
      />

      <Field
        label="State *"
        placeholder={value.countryCode ? "Select state" : "Select a country first"}
        disabled={!value.countryCode}
        value={value.stateId || ""}
        loading={states.isFetching}
        error={states.isError}
        options={(states.data || []).map((s) => ({ id: s.id, name: s.name }))}
        onChange={(id) => {
          const region = (states.data || []).find((s) => s.id === id);
          onChange({
            ...value,
            stateId: id || undefined,
            stateName: region?.name,
            lgaId: undefined,
            lgaName: undefined,
            wardId: undefined,
            wardName: undefined,
            communityId: undefined,
            communityName: undefined,
            center: region?.center ?? value.center,
            zoom: region?.zoom ?? value.zoom,
          });
        }}
      />

      <Field
        label="LGA *"
        placeholder={value.stateId ? "Select LGA" : "Select a state first"}
        disabled={!value.stateId}
        value={value.lgaId || ""}
        loading={lgas.isFetching}
        error={lgas.isError}
        options={(lgas.data || []).map((s) => ({ id: s.id, name: s.name }))}
        onChange={(id) => {
          const region = (lgas.data || []).find((s) => s.id === id);
          onChange({
            ...value,
            lgaId: id || undefined,
            lgaName: region?.name,
            wardId: undefined,
            wardName: undefined,
            communityId: undefined,
            communityName: undefined,
            center: region?.center ?? value.center,
            zoom: region?.zoom ?? value.zoom,
          });
        }}
      />

      <Field
        label="Ward"
        placeholder={value.lgaId ? "Select ward" : "Select an LGA first"}
        disabled={!value.lgaId}
        value={value.wardId || ""}
        loading={wards.isFetching}
        error={wards.isError}
        options={(wards.data || []).map((s) => ({ id: s.id, name: s.name }))}
        onChange={(id) => {
          const region = (wards.data || []).find((s) => s.id === id);
          onChange({
            ...value,
            wardId: id || undefined,
            wardName: region?.name,
            communityId: undefined,
            communityName: undefined,
            center: region?.center ?? value.center,
            zoom: region?.zoom ?? value.zoom,
          });
        }}
      />

      <Field
        label="Community"
        placeholder={value.wardId ? "Select community" : "Select a ward first"}
        disabled={!value.wardId}
        value={value.communityId || ""}
        loading={communities.isFetching}
        error={communities.isError}
        options={(communities.data || []).map((s) => ({ id: s.id, name: s.name }))}
        onChange={(id) => {
          const region = (communities.data || []).find((s) => s.id === id);
          onChange({
            ...value,
            communityId: id || undefined,
            communityName: region?.name,
            center: region?.center ?? value.center,
            zoom: region?.zoom ?? value.zoom,
          });
        }}
      />
    </div>
  );
}
