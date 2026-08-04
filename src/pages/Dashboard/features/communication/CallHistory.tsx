import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarPlus,
  Download,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Search,
  StickyNote,
  Timer,
  X,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import Pagination from "@/components/dashboard/Pagination";
import { CardsSkeleton, EmptyState, ErrorState, TableSkeleton } from "@/components/dashboard/States";
import { CallFilters, CallRecord, fetchCalls, formatDuration } from "@/api/mock/calls";
import { EMPLOYEES } from "@/api/mock/orgData";
import { exportCSV } from "@/utils/exportData";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 8;
const statusBadge: Record<string, string> = {
  Connected: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Missed: "bg-rose-50 text-rose-700 border-rose-100",
  Rejected: "bg-amber-50 text-amber-700 border-amber-100",
  Voicemail: "bg-blue-50 text-[#1658E5] border-blue-100",
};

const CallHistory: React.FC = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<CallFilters>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calls", filters, search],
    queryFn: () => fetchCalls({ ...filters, search }),
  });

  const rows = data?.rows ?? [];
  const s = data?.summary;
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const set = (k: keyof CallFilters, v: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v || undefined }));
  };

  const exportRows = rows.map((c) => ({
    Employee: c.employee,
    Customer: c.customer,
    "Phone Number": c.phoneNumber,
    "Call Type": c.callType,
    Duration: formatDuration(c.durationSeconds),
    Status: c.status,
    Date: new Date(c.date).toLocaleString(),
    Notes: c.notes,
  }));

  return (
    <div>
      <PageHeader
        title="Call History"
        description="Every customer call logged by your field and support teams."
        crumbs={[{ label: "Communication" }, { label: "Call History" }]}
        actions={
          <button onClick={() => exportCSV(exportRows, "call-log.csv")} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1658E5] text-xs font-medium text-white hover:bg-[#1249bd]">
            <Download className="w-4 h-4" /> Export Call Log
          </button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !s ? (
        <CardsSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard index={0} title="Total Calls" value={s.total} icon={<PhoneCall className="w-4 h-4" />} percent={8} />
          <StatCard index={1} title="Incoming" value={s.incoming} icon={<PhoneIncoming className="w-4 h-4" />} percent={3} />
          <StatCard index={2} title="Outgoing" value={s.outgoing} icon={<PhoneOutgoing className="w-4 h-4" />} percent={5} />
          <StatCard index={4} title="Missed Calls" value={s.missed} icon={<PhoneMissed className="w-4 h-4" />} percent={-6} />
          <StatCard index={3} title="Connected Calls" value={s.connected} icon={<PhoneCall className="w-4 h-4" />} percent={4} />
          <StatCard index={5} title="Average Duration" value={formatDuration(s.averageDuration)} icon={<Timer className="w-4 h-4" />} />
        </div>
      )}

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <input type="date" value={filters.date ?? ""} onChange={(e) => set("date", e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700" />
        <select value={filters.employeeId ?? ""} onChange={(e) => set("employeeId", e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700">
          <option value="">All Employees</option>
          {EMPLOYEES.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={filters.customer ?? ""} onChange={(e) => set("customer", e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700">
          <option value="">All Customers</option>
          {(data?.customers ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.status ?? ""} onChange={(e) => set("status", e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-xs text-gray-700">
          <option value="">All Statuses</option>
          {["Connected", "Missed", "Rejected", "Voicemail"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search calls…" className="w-full h-10 rounded-lg border border-gray-200 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
        {isLoading ? (
          <TableSkeleton />
        ) : paged.length === 0 ? (
          <EmptyState title="No calls found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  {["Employee", "Customer", "Phone Number", "Call Type", "Duration", "Status", "Date", "Notes"].map((h) => (
                    <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => (
                  <tr key={c.id} onClick={() => { setSelected(c); setNote(""); setFollowUp(c.followUpDate ?? ""); }} className="border-t border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={c.employeePhoto} alt={c.employee} className="w-7 h-7 rounded-full" loading="lazy" />
                        <span className="font-medium text-gray-900">{c.employee}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.customer}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{c.phoneNumber}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        {c.callType === "Incoming" ? <PhoneIncoming className="w-3.5 h-3.5 text-emerald-500" /> : <PhoneOutgoing className="w-3.5 h-3.5 text-[#1658E5]" />}
                        {c.callType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatDuration(c.durationSeconds)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${statusBadge[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{new Date(c.date).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} />}
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <aside className="relative w-full max-w-md h-full bg-white shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-sm font-semibold text-gray-900">Call Details</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-5">
              <section>
                <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Customer Details</p>
                <div className="rounded-xl border border-gray-100 p-3 text-xs space-y-1">
                  <p className="font-semibold text-gray-900">{selected.customer}</p>
                  <p className="text-gray-500">{selected.customerCompany}</p>
                  <p className="text-gray-500">{selected.customerEmail}</p>
                  <p className="text-gray-500">{selected.phoneNumber}</p>
                </div>
              </section>
              <section>
                <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Employee Details</p>
                <div className="rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                  <img src={selected.employeePhoto} alt={selected.employee} className="w-10 h-10 rounded-full" />
                  <div className="text-xs">
                    <p className="font-semibold text-gray-900">{selected.employee}</p>
                    <p className="text-gray-500">{selected.employeeRole}</p>
                  </div>
                </div>
              </section>
              <section>
                <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Call Notes</p>
                <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3">{selected.notes}</p>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add a note…" className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100" />
                <button
                  onClick={() => { toast({ title: "Note added" }); setNote(""); }}
                  disabled={!note.trim()}
                  className="mt-2 inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-[#1658E5] text-xs font-medium text-white disabled:opacity-40"
                >
                  <StickyNote className="w-4 h-4" /> Add Note
                </button>
              </section>
              <section>
                <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Follow-up</p>
                <div className="flex gap-2">
                  <input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-xs" />
                  <button onClick={() => toast({ title: "Follow-up scheduled", description: followUp })} disabled={!followUp} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50">
                    <CalendarPlus className="w-4 h-4" /> Schedule
                  </button>
                </div>
              </section>
              <section>
                <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Timeline</p>
                <ol className="relative border-l border-gray-100 ml-2 space-y-3">
                  {selected.timeline.map((t, i) => (
                    <li key={i} className="ml-4">
                      <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-[#1658E5]" />
                      <p className="text-xs font-medium text-gray-800">{t.label}</p>
                      <p className="text-[11px] text-gray-400">{new Date(t.time).toLocaleString()}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
