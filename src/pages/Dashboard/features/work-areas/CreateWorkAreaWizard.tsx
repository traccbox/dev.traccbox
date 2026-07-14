import React, { useState } from "react";
import {
  X, Check, ChevronRight, ChevronLeft, MapPin, Building2, Users, Settings, ClipboardCheck,
  PenTool, Globe, Type, Circle, Hexagon, Trash2,
} from "lucide-react";
import WorkAreaMap from "./WorkAreaMap";
import {
  WorkArea, WorkAreaType, WORK_AREA_TYPE_OPTIONS, DEFAULT_RULES, BoundaryShape, WorkAreaRules,
} from "./types";
import { MOCK_EMPLOYEES } from "./mockData";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (wa: WorkArea) => void;
}

const STEPS = [
  { id: 1, label: "Basic Info", icon: Building2 },
  { id: 2, label: "Boundary", icon: MapPin },
  { id: 3, label: "Employees", icon: Users },
  { id: 4, label: "Work Rules", icon: Settings },
  { id: 5, label: "Review", icon: ClipboardCheck },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CreateWorkAreaWizard({ open, onClose, onCreate }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<WorkAreaType>("office");
  const [method, setMethod] = useState<"draw" | "admin" | "manual" | null>(null);
  const [drawMode, setDrawMode] = useState<"circle" | "polygon">("circle");
  const [radius, setRadius] = useState(200);
  const [shape, setShape] = useState<BoundaryShape | null>(null);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [rules, setRules] = useState<WorkAreaRules>(DEFAULT_RULES);
  const [empSearch, setEmpSearch] = useState("");

  if (!open) return null;

  const reset = () => {
    setStep(1); setName(""); setDescription(""); setType("office");
    setMethod(null); setShape(null); setRadius(200);
    setAddress(""); setLat(""); setLng(""); setCountry(""); setState(""); setLga("");
    setSelectedEmployees([]); setRules(DEFAULT_RULES);
  };

  const close = () => { reset(); onClose(); };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) {
      if (method === "manual") return !!(lat && lng);
      if (method === "admin") return !!(country && state);
      return !!shape;
    }
    return true;
  };

  const finalShape = (): BoundaryShape => {
    if (shape) return shape;
    if (method === "manual" && lat && lng) {
      return { kind: "circle", center: [parseFloat(lat), parseFloat(lng)], radius: radius || 200 };
    }
    return { kind: "circle", center: [6.5244, 3.3792], radius: 200 };
  };

  const handleSave = () => {
    const wa: WorkArea = {
      id: `wa-${Date.now()}`,
      name,
      description,
      type,
      status: "active",
      boundary: finalShape(),
      address,
      country, state, lga,
      employees: MOCK_EMPLOYEES.filter((e) => selectedEmployees.includes(e.id)),
      rules,
      createdAt: new Date().toISOString(),
    };
    onCreate(wa);
    close();
  };

  const applyManualPreview = () => {
    if (lat && lng) {
      setShape({ kind: "circle", center: [parseFloat(lat), parseFloat(lng)], radius: radius || 200 });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Work Area</h2>
            <p className="text-xs text-gray-500">Set up a new virtual work location</p>
          </div>
          <button onClick={close} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 border-b bg-white overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isDone = step > s.id;
              const isActive = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      isDone ? "bg-green-500 text-white" :
                      isActive ? "bg-[#1658E5] text-white shadow-lg shadow-blue-500/30" :
                      "bg-gray-100 text-gray-400"
                    }`}>
                      {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? "text-[#1658E5]" : isDone ? "text-green-600" : "text-gray-400"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 w-8 ${step > s.id ? "bg-green-500" : "bg-gray-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-1.5">Work Area Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lagos HQ Office"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} placeholder="Short description..."
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Work Area Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {WORK_AREA_TYPE_OPTIONS.map((o) => (
                    <button key={o.value} type="button" onClick={() => setType(o.value)}
                      className={`px-3 py-2.5 text-sm rounded-lg border-2 text-left transition-all ${
                        type === o.value
                          ? "border-[#1658E5] bg-blue-50 text-[#1658E5] font-semibold"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && !method && (
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { id: "draw", icon: PenTool, title: "Draw on Map", desc: "Search a location and draw your work area directly on the map.", rec: true },
                { id: "admin", icon: Globe, title: "Administrative Area", desc: "Create using Country, State and Local Government." },
                { id: "manual", icon: Type, title: "Manual Entry", desc: "Create using an address or GPS coordinates." },
              ].map((c: any) => {
                const Icon = c.icon;
                return (
                  <div key={c.id} className="border-2 rounded-2xl p-5 hover:border-[#1658E5] hover:shadow-lg transition-all cursor-pointer relative"
                    onClick={() => setMethod(c.id)}>
                    {c.rec && <span className="absolute top-3 right-3 text-[10px] bg-blue-100 text-[#1658E5] font-semibold px-2 py-0.5 rounded-full">RECOMMENDED</span>}
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-[#1658E5]" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
                    <p className="text-xs text-gray-500 mb-4">{c.desc}</p>
                    <button className="w-full bg-[#1658E5] text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">Select</button>
                  </div>
                );
              })}
            </div>
          )}

          {step === 2 && method === "draw" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <input placeholder="Search location..." className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
                  <button onClick={() => setDrawMode("circle")} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${drawMode === "circle" ? "bg-white shadow text-[#1658E5]" : "text-gray-600"}`}>
                    <Circle className="w-3.5 h-3.5" /> Circle
                  </button>
                  <button onClick={() => setDrawMode("polygon")} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${drawMode === "polygon" ? "bg-white shadow text-[#1658E5]" : "text-gray-600"}`}>
                    <Hexagon className="w-3.5 h-3.5" /> Polygon
                  </button>
                </div>
                <button onClick={() => setShape(null)} className="p-2 border rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600" title="Delete shape">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setMethod(null)} className="text-xs text-gray-500 hover:underline ml-auto">Change method</button>
              </div>
              <div className="rounded-xl overflow-hidden border">
                <WorkAreaMap
                  areas={[]}
                  height={380}
                  interactiveDraw={{
                    shape,
                    onChange: (s) => setShape(s),
                    mode: drawMode,
                    radius,
                  }}
                />
              </div>
              {drawMode === "circle" && shape?.kind === "circle" && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Radius:</span>
                  <input type="range" min={50} max={5000} step={50} value={radius}
                    onChange={(e) => { const r = parseInt(e.target.value); setRadius(r); setShape({ ...shape, radius: r }); }}
                    className="flex-1" />
                  <input type="number" value={radius}
                    onChange={(e) => { const r = parseInt(e.target.value) || 0; setRadius(r); setShape({ ...shape, radius: r }); }}
                    className="w-24 px-2 py-1 border rounded text-sm" />
                  <span className="text-xs text-gray-500">meters</span>
                </div>
              )}
              {drawMode === "polygon" && shape?.kind === "polygon" && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-gray-700">{shape.points.length} points placed</span>
                  <button className="text-sm bg-[#1658E5] text-white px-3 py-1.5 rounded-md">Save Boundary</button>
                </div>
              )}
              {!shape && (
                <p className="text-xs text-center text-gray-500">Click on the map to {drawMode === "circle" ? "place the circle center" : "add polygon points"}</p>
              )}
            </div>
          )}

          {step === 2 && method === "admin" && (
            <div className="space-y-4 max-w-xl">
              <button onClick={() => setMethod(null)} className="text-xs text-gray-500 hover:underline">← Change method</button>
              {[
                { label: "Country *", val: country, set: setCountry, opts: ["Nigeria", "Ghana", "Kenya", "South Africa"] },
                { label: "State *", val: state, set: setState, opts: ["Lagos", "Abuja", "Rivers", "Kano"] },
                { label: "Local Government", val: lga, set: setLga, opts: ["Ikeja", "Eti-Osa", "Apapa", "Surulere"] },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-sm font-medium mb-1.5">{f.label}</label>
                  <select value={f.val} onChange={(e) => f.set(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Select...</option>
                    {f.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
                Once selected, the map will zoom to the boundary. You can use the full administrative area or draw a custom boundary inside it.
              </div>
            </div>
          )}

          {step === 2 && method === "manual" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <button onClick={() => setMethod(null)} className="text-xs text-gray-500 hover:underline">← Change method</button>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Latitude</label>
                    <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="6.5244"
                      className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Longitude</label>
                    <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="3.3792"
                      className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Radius (m)</label>
                  <input type="number" value={radius} onChange={(e) => setRadius(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button onClick={applyManualPreview} className="w-full bg-[#1658E5] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">
                  Generate Preview
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Preview</label>
                <div className="rounded-xl overflow-hidden border">
                  <WorkAreaMap areas={[]} height={320}
                    interactiveDraw={{ shape, onChange: setShape, mode: "circle", radius }}
                    centerOverride={lat && lng ? [parseFloat(lat), parseFloat(lng)] : undefined}
                    zoomOverride={14} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input value={empSearch} onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search employees..."
                  className="md:col-span-2 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <select className="px-3 py-2 border rounded-lg text-sm bg-white">
                  <option>All Departments</option><option>Sales</option><option>Engineering</option>
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm bg-white">
                  <option>All Teams</option><option>Alpha</option><option>Beta</option>
                </select>
              </div>
              <div className="border rounded-xl divide-y max-h-80 overflow-y-auto">
                {MOCK_EMPLOYEES
                  .filter((e) => e.name.toLowerCase().includes(empSearch.toLowerCase()))
                  .map((e) => {
                    const checked = selectedEmployees.includes(e.id);
                    return (
                      <label key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={checked}
                          onChange={() => setSelectedEmployees((prev) =>
                            prev.includes(e.id) ? prev.filter((id) => id !== e.id) : [...prev, e.id],
                          )}
                          className="w-4 h-4 accent-[#1658E5]" />
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                          {e.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{e.name}</div>
                          <div className="text-xs text-gray-500">{e.role} · {e.team}</div>
                        </div>
                      </label>
                    );
                  })}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-[#1658E5]">{selectedEmployees.length}</span> employee(s) selected
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <label className="block text-sm font-medium mb-2">Working Days</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((d) => {
                    const active = rules.workingDays.includes(d);
                    return (
                      <button key={d} onClick={() => setRules({
                        ...rules,
                        workingDays: active ? rules.workingDays.filter((x) => x !== d) : [...rules.workingDays, d],
                      })}
                        className={`px-3 py-1.5 rounded-lg text-sm border-2 ${active ? "border-[#1658E5] bg-blue-50 text-[#1658E5] font-semibold" : "border-gray-200 text-gray-600"}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Start Time</label>
                  <input type="time" value={rules.workingHours.start}
                    onChange={(e) => setRules({ ...rules, workingHours: { ...rules.workingHours, start: e.target.value } })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">End Time</label>
                  <input type="time" value={rules.workingHours.end}
                    onChange={(e) => setRules({ ...rules, workingHours: { ...rules.workingHours, end: e.target.value } })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">GPS Accuracy (m)</label>
                  <input type="number" value={rules.gpsAccuracy}
                    onChange={(e) => setRules({ ...rules, gpsAccuracy: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Grace Period (min)</label>
                  <input type="number" value={rules.gracePeriod}
                    onChange={(e) => setRules({ ...rules, gracePeriod: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-2 pt-2">
                {([
                  ["allowClockIn", "Allow Clock In"],
                  ["allowClockOut", "Allow Clock Out"],
                  ["allowOffline", "Allow Offline"],
                  ["autoCheckIn", "Auto Check In"],
                  ["autoCheckOut", "Auto Check Out"],
                  ["entryNotification", "Entry Notification"],
                  ["exitNotification", "Exit Notification"],
                  ["violationAlerts", "Violation Alerts"],
                ] as const).map(([k, label]) => (
                  <label key={k} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <span className="text-sm text-gray-700">{label}</span>
                    <input type="checkbox" checked={rules[k] as boolean}
                      onChange={(e) => setRules({ ...rules, [k]: e.target.checked })}
                      className="w-4 h-4 accent-[#1658E5]" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <SummaryBlock title="Basic Information">
                <SummaryRow label="Name" value={name} />
                <SummaryRow label="Type" value={WORK_AREA_TYPE_OPTIONS.find((o) => o.value === type)?.label || type} />
                {description && <SummaryRow label="Description" value={description} />}
              </SummaryBlock>
              <SummaryBlock title="Boundary">
                {shape?.kind === "circle" && <SummaryRow label="Circle" value={`Center [${shape.center[0].toFixed(4)}, ${shape.center[1].toFixed(4)}] · r=${shape.radius}m`} />}
                {shape?.kind === "polygon" && <SummaryRow label="Polygon" value={`${shape.points.length} points`} />}
                {!shape && method === "admin" && <SummaryRow label="Administrative" value={`${country} / ${state} / ${lga}`} />}
                {!shape && method === "manual" && <SummaryRow label="Coordinates" value={`${lat}, ${lng}`} />}
              </SummaryBlock>
              <SummaryBlock title="Assigned Employees">
                <SummaryRow label="Count" value={`${selectedEmployees.length} employee(s)`} />
              </SummaryBlock>
              <SummaryBlock title="Work Rules">
                <SummaryRow label="Working Days" value={rules.workingDays.join(", ")} />
                <SummaryRow label="Hours" value={`${rules.workingHours.start} – ${rules.workingHours.end}`} />
                <SummaryRow label="Grace Period" value={`${rules.gracePeriod} min`} />
              </SummaryBlock>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button onClick={() => (step === 1 ? close() : setStep(step - 1))}
            className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-4 h-4" /> {step === 1 ? "Cancel" : "Back"}
          </button>
          <div className="text-xs text-gray-500">Step {step} of {STEPS.length}</div>
          {step < 5 ? (
            <button disabled={!canProceed()} onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 px-5 py-2 bg-[#1658E5] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave}
              className="flex items-center gap-1 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
              <Check className="w-4 h-4" /> Save Work Area
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-xl p-4 bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-sm">
      <span className="text-gray-500 w-40">{label}</span>
      <span className="text-gray-900 font-medium flex-1">{value}</span>
    </div>
  );
}
