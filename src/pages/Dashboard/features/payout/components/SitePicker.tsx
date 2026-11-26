import React, { useRef, useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { useInfiniteSites } from "@/api/payout/hooks";

interface Props {
  value: string;
  onChange: (siteId: string) => void;
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
  optionSuffix?: (site: { id: string; name: string; geofence_radius?: number }) => string;
}

export default function SitePicker({ value, onChange, includeAll = true, allLabel = "All Sites", className = "", optionSuffix }: Props) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const sitesQuery = useInfiniteSites();
  const sites = Array.from(new Map((sitesQuery.data?.pages.flatMap(page => page.data) || []).map(site => [site.id, site])).values());
  const selected = sites.find(site => site.id === value);

  const handleScroll = () => {
    const element = listRef.current;
    if (!element || !sitesQuery.hasNextPage || sitesQuery.isFetchingNextPage) return;
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 40) {
      void sitesQuery.fetchNextPage();
    }
  };

  return <div className="relative min-w-0">
    <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(v => !v)} className={`flex w-full items-center justify-between gap-2 ${className}`}>
      <span className="truncate">{value ? selected?.name || "Loading selected site…" : includeAll ? allLabel : "Select a site"}</span>
      <ChevronDown className="w-4 h-4 shrink-0" />
    </button>
    {open && <>
      <button aria-label="Close site options" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
      <div ref={listRef} role="listbox" onScroll={handleScroll} className="absolute z-40 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl text-slate-900">
        {includeAll && <button role="option" aria-selected={!value} onClick={() => { onChange(""); setOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${!value ? "font-semibold text-blue-700" : ""}`}>{allLabel}</button>}
        {sites.map((site, index) => <button key={`${site.id}-${index}`} role="option" aria-selected={value === site.id} onClick={() => { onChange(site.id); setOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${value === site.id ? "font-semibold text-blue-700" : ""}`}>
          <span className="block truncate">{site.name}</span>{optionSuffix && <span className="block text-xs text-slate-500">{optionSuffix(site)}</span>}
        </button>)}
        {sitesQuery.isLoading && <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin"/>Loading sites…</div>}
        {sitesQuery.isError && <button onClick={() => void (sitesQuery.data ? sitesQuery.fetchNextPage() : sitesQuery.refetch())} className="w-full px-3 py-2 text-left text-xs text-red-600">Couldn’t load sites. Retry.</button>}
        {sitesQuery.isFetchingNextPage && <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin"/>Loading more sites…</div>}
        {!sitesQuery.hasNextPage && sites.length > 0 && <div className="px-3 py-2 text-center text-[10px] text-slate-400">All sites loaded</div>}
      </div>
    </>}
  </div>;
}
