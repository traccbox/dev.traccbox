import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeReport } from "@/api/performance-logs/apiPerformance";
import { GetEmployeeReportParams } from "@/api/performance-logs/types";
import { ErrorState } from "@/components/dashboard/States";
import Spinner from "@/components/ui/Spinner";
import GenericReportView from "./GenericReportView";
import Modal from "./Modal";

/** Per-employee report (GET /performance/employees/{id}/report). */
const EmployeeReportModal: React.FC<{
  employeeId: string;
  name: string;
  params: GetEmployeeReportParams;
  onClose: () => void;
}> = ({ employeeId, name, params, onClose }) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["employee-report", employeeId, params],
    queryFn: () => getEmployeeReport(employeeId, params),
  });

  return (
    <Modal
      title={`${name} — Performance Report`}
      subtitle={params.period ? `Period: ${params.period}` : undefined}
      onClose={onClose}
    >
      {isLoading ? (
        <div className="h-40 flex items-center justify-center">
          <Spinner />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <GenericReportView data={data?.data} />
      )}
    </Modal>
  );
};

export default EmployeeReportModal;
