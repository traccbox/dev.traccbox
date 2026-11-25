import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPerformanceLog,
  updatePerformanceLogStatus,
} from "@/api/performance-logs/apiPerformance";
import { ErrorState } from "@/components/dashboard/States";
import Spinner from "@/components/ui/Spinner";
import Modal from "./Modal";

const FALLBACK_STATUSES = ["Completed", "Pending", "Flagged"];

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-[11px] text-gray-500">{label}</p>
    <p className="text-xs text-gray-900 break-words">{value || "—"}</p>
  </div>
);

/** Log detail (GET /performance/logs/{id}) + status change (PATCH .../status). */
const LogDetailModal: React.FC<{
  logId: string;
  statuses?: string[];
  onClose: () => void;
}> = ({ logId, statuses, onClose }) => {
  const qc = useQueryClient();
  const options = statuses?.length ? statuses : FALLBACK_STATUSES;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["performance-log", logId],
    queryFn: () => getPerformanceLog(logId),
  });
  const log = data?.data;

  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (log) {
      setStatus(log.status);
      setReason(log.flag_reason ?? "");
    }
  }, [log]);

  const flagging = status.toLowerCase() === "flagged";
  const dirty =
    !!log &&
    (status !== log.status || (flagging && reason !== (log.flag_reason ?? "")));

  const save = useMutation({
    mutationFn: () =>
      updatePerformanceLogStatus(logId, {
        status,
        flag_reason: flagging ? reason.trim() || null : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["performance-log", logId] });
      qc.invalidateQueries({ queryKey: ["performance-logs"] });
      qc.invalidateQueries({ queryKey: ["performance-logs-summary"] });
    },
  });

  return (
    <Modal
      title={log ? `${log.employee_name} — ${log.activity}` : "Activity Log"}
      subtitle={log ? new Date(log.time).toLocaleString() : undefined}
      onClose={onClose}
    >
      {isLoading ? (
        <div className="h-40 flex items-center justify-center">
          <Spinner />
        </div>
      ) : isError || !log ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Row label="Employee ID" value={log.employee_id} />
            <Row label="Branch" value={log.branch} />
            <Row label="Department" value={log.department} />
            <Row label="Team" value={log.team} />
            <Row label="Device" value={log.device} />
            <Row label="Location" value={log.gps} />
          </div>

          {log.note && (
            <div>
              <p className="text-[11px] text-gray-500 mb-1">Note</p>
              <p className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                {log.note}
              </p>
            </div>
          )}

          {log.attachments?.length > 0 && (
            <div>
              <p className="text-[11px] text-gray-500 mb-1">
                Attachments ({log.attachments.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {log.attachments.map((url, i) => (
                  <a key={url + i} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt={`Attachment ${i + 1}`}
                      className="w-24 h-24 rounded-lg object-cover border border-gray-100"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-900 mb-2">Status</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs"
              >
                {Array.from(new Set([log.status, ...options])).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {flagging && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for flagging"
                  rows={2}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs"
                />
              )}
              <button
                onClick={() => save.mutate()}
                disabled={!dirty || save.isPending}
                className="h-10 px-4 rounded-lg bg-[#1658E5] text-xs font-medium text-white disabled:opacity-40"
              >
                {save.isPending ? "Saving…" : "Update status"}
              </button>
            </div>
            {save.isError && (
              <p className="mt-2 text-xs text-rose-600">
                Couldn't update the status. Please try again.
              </p>
            )}
            {save.isSuccess && !dirty && (
              <p className="mt-2 text-xs text-emerald-600">Status updated.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LogDetailModal;
