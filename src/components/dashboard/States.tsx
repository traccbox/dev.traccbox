import React from "react";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 6,
  cols = 6,
}) => (
  <div className="p-4 space-y-3 animate-pulse">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-3">
        {Array.from({ length: cols }).map((__, c) => (
          <div key={c} className="h-4 flex-1 rounded bg-gray-100" />
        ))}
      </div>
    ))}
  </div>
);

export const CardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-[110px] rounded-2xl bg-gray-100" />
    ))}
  </div>
);

export const EmptyState: React.FC<{ title?: string; message?: string }> = ({
  title = "Nothing here yet",
  message = "Try adjusting your filters or search terms.",
}) => (
  <div className="flex flex-col items-center justify-center py-14 text-center">
    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
      <Inbox className="w-6 h-6 text-[#1658E5]" />
    </div>
    <p className="font-semibold text-gray-900">{title}</p>
    <p className="text-sm text-gray-500 mt-1 max-w-sm">{message}</p>
  </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = "Something went wrong while loading this data.",
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-14 text-center">
    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
      <AlertTriangle className="w-6 h-6 text-red-500" />
    </div>
    <p className="font-semibold text-gray-900">Unable to load</p>
    <p className="text-sm text-gray-500 mt-1 max-w-sm">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1658E5] text-white text-sm font-medium hover:bg-[#1249bd]"
      >
        <RotateCw className="w-4 h-4" /> Retry
      </button>
    )}
  </div>
);
