import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Building2, Users, HardDrive, RefreshCw, ArrowUpRight, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/dashboard/PageHeader";
import { CardsSkeleton, ErrorState } from "@/components/dashboard/States";
import { fetchCurrentPlan } from "@/api/mock/subscription";

const Usage: React.FC<{ label: string; used: number; limit: number; unit?: string; color: string; icon: React.ReactNode }> = ({
  label, used, limit, unit = "", color, icon,
}) => {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600 flex items-center gap-2">{icon}{label}</span>
        <span className="text-xs font-semibold text-gray-900">{used}{unit} / {limit}{unit}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="mt-1.5 text-[11px] text-gray-400">{pct}% used</p>
    </div>
  );
};

const CurrentPlanPage: React.FC = () => {
  const { data: plan, isLoading, isError, refetch } = useQuery({
    queryKey: ["current-plan"],
    queryFn: fetchCurrentPlan,
  });

  return (
    <div>
      <PageHeader
        title="Current Plan"
        description="Your active TraccBox subscription and usage."
        crumbs={[{ label: "Subscription" }, { label: "Current Plan" }]}
        actions={
          <>
            <Link to="/dashboard/subscription/plans" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1658E5] text-xs font-medium text-white hover:bg-[#1249bd]">
              <ArrowUpRight className="w-4 h-4" /> Upgrade Plan
            </Link>
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" /> Renew Subscription
            </button>
            <Link to="/dashboard/subscription/billing" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50">
              <ReceiptText className="w-4 h-4" /> View Invoices
            </Link>
          </>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !plan ? (
        <CardsSkeleton count={4} />
      ) : (
        <>
          <div className="rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 text-white" style={{ background: "linear-gradient(135deg,#1658E5 0%,#0F3E9E 100%)" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs opacity-80">{plan.companyName}</p>
                <h2 className="text-3xl font-bold mt-1">{plan.plan} Plan</h2>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-white/15">{plan.status}</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/15">{plan.billingCycle}</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/15">Renews {plan.nextRenewal}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Billed {plan.billingCycle.toLowerCase()}</p>
                <p className="text-3xl font-bold">{plan.amount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Usage label="Employees" used={plan.employeesUsed} limit={plan.employeeLimit} color="#1658E5" icon={<Users className="w-4 h-4" />} />
            <Usage label="Branches" used={plan.branchesUsed} limit={plan.branchLimit} color="#8B5CF6" icon={<Building2 className="w-4 h-4" />} />
            <Usage label="Storage" used={plan.storageUsedGB} limit={plan.storageLimitGB} unit="GB" color="#0EA5A5" icon={<HardDrive className="w-4 h-4" />} />
            <Usage label="Billing Cycle Progress" used={18} limit={30} unit="d" color="#F59E0B" icon={<CreditCard className="w-4 h-4" />} />
          </div>
        </>
      )}
    </div>
  );
};

export default CurrentPlanPage;
