import React, { useState } from "react";
import { X, Building2, MapPin, Compass, Loader2 } from "lucide-react";
import { useCreateSite } from "@/api/payout/hooks";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateSiteModal({ open, onClose }: Props) {
  const createSiteMutation = useCreateSite();
  const [name, setName] = useState("");
  const [project, setProject] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("6.6018");
  const [longitude, setLongitude] = useState("3.3515");
  const [geofenceRadius, setGeofenceRadius] = useState("100");
  const [gettingGps, setGettingGps] = useState(false);

  if (!open) return null;

  const handleFetchCurrentGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGettingGps(false);
        toast.success("GPS location captured!");
      },
      (err) => {
        setGettingGps(false);
        toast.error(`GPS location error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Site name is required");
      return;
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseInt(geofenceRadius, 10);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Valid latitude and longitude required");
      return;
    }

    createSiteMutation.mutate(
      {
        name,
        project,
        address,
        latitude: lat,
        longitude: lng,
        geofence_radius: rad || 100,
      },
      {
        onSuccess: () => {
          onClose();
          setName("");
          setProject("");
          setAddress("");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base tracking-wide">Register Site & Geofence</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Site / Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ikeja Construction Site"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Project Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Lagos Housing Project Phase II"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Address / Location Landmark
            </label>
            <input
              type="text"
              placeholder="e.g. Mobolaji Bank Anthony Way, Ikeja"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          {/* Coordinates Header & Auto Fetch */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Site GPS Coordinates
              </span>
              <button
                type="button"
                onClick={handleFetchCurrentGps}
                disabled={gettingGps}
                className="text-blue-600 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {gettingGps ? <Loader2 className="w-3 h-3 animate-spin" /> : <Compass className="w-3 h-3" />}
                Capture Device Location
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="6.6018"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="3.3515"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Geofence Radius (Meters)
            </label>
            <div className="flex items-center gap-2">
              {[50, 100, 150, 200].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setGeofenceRadius(r.toString())}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    geofenceRadius === r.toString()
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  {r}m
                </button>
              ))}
              <input
                type="number"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(e.target.value)}
                className="w-24 px-3 py-1.5 border rounded-lg text-xs font-bold text-center bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSiteMutation.isPending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {createSiteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Site & Boundary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
