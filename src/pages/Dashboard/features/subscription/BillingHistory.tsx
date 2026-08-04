import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Eye, Search } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import Pagination from "@/components/dashboard/Pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/dashboard/States";
import { fetchInvoices, Invoice } from "@/api/mock/subscription";
import { exportCSV, printHTML, tableHTML } from "@/utils/exportData";

const PAGE_SIZE = 8;
const badge: Record<Invoice["status"], string> = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Failed: "bg-rose-50 text-rose-700 border-rose-100",
};

const BillingHistory: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  const rows = (data ?? [])
    .filter((i) =>
      [i.invoiceNumber, i.plan, i.paymentMethod, i.status].join(" ").toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => (sortAsc ? a.paymentDate.localeCompare(b.paymentDate) : b.paymentDate.localeCompare(a.paymentDate)));

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const exportRows = rows.map(({ id, ...r }) => r);

  return (
    <div>
      <PageHeader
        title="Billing History"
        description="All invoices and payments on your account."
        crumbs={[{ label: "Subscription" }, { label: "Billing History" }]}
        actions={
          <>
            <button onClick={() => exportCSV(exportRows, "invoices.csv")} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => printHTML("Billing History", tableHTML(exportRows))} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1658E5] text-xs font-medium text-white hover:bg-[#1249bd]">
              Print
            </button>
          </>
        }
      />

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search invoices…" className="w-full h-10 rounded-lg border border-gray-200 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <button onClick={() => setSortAsc((s) => !s)} className="h-10 px-4 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">
            Sort by date: {sortAsc ? "Oldest" : "Newest"}
          </button>
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton />
        ) : paged.length === 0 ? (
          <EmptyState title="No invoices found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  {["Invoice Number", "Plan", "Amount", "Payment Method", "Payment Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((i) => (
                  <tr key={i.id} className="border-t border-gray-50 hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{i.invoiceNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{i.plan}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{i.amount}</td>
                    <td className="px-4 py-3 text-gray-700">{i.paymentMethod}</td>
                    <td className="px-4 py-3 text-gray-700">{i.paymentDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${badge[i.status]}`}>{i.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => exportCSV([{ ...i }], `${i.invoiceNumber}.csv`)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50">
                          <Download className="w-3.5 h-3.5" /> Invoice
                        </button>
                        <button onClick={() => printHTML(`Receipt ${i.invoiceNumber}`, tableHTML([{ ...i }]))} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50">
                          <Eye className="w-3.5 h-3.5" /> Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} />}
      </div>
    </div>
  );
};

export default BillingHistory;
