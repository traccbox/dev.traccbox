import React from "react";
import { EmptyState } from "@/components/dashboard/States";

/**
 * Renders a report payload whose exact shape isn't documented:
 *  - primitive fields           -> stat tiles
 *  - objects of primitives      -> a titled group of tiles
 *  - arrays of objects          -> a titled table
 * so new backend fields show up without a frontend change.
 */

export const prettyKey = (k: string) =>
  k
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bKm\b/, "km")
    .replace(/\bId\b/, "ID");

const isPrimitive = (v: unknown): v is string | number | boolean =>
  ["string", "number", "boolean"].includes(typeof v);

const fmt = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const Tiles: React.FC<{ data: Obj }> = ({ data }) => {
  const entries = Object.entries(data).filter(([, v]) => isPrimitive(v));
  if (entries.length === 0) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {entries.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-gray-100 bg-white p-3">
          <p className="text-[11px] text-gray-500">{prettyKey(k)}</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 break-words">
            {fmt(v)}
          </p>
        </div>
      ))}
    </div>
  );
};

const Table: React.FC<{ rows: Obj[] }> = ({ rows }) => {
  const cols = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r).filter((k) => isPrimitive(r[k])))),
  );
  if (cols.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            {cols.map((c) => (
              <th key={c} className="text-left font-medium px-3 py-2 whitespace-nowrap">
                {prettyKey(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-gray-50">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                  {fmt(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const GenericReportView: React.FC<{ data: unknown }> = ({ data }) => {
  if (!isObj(data) || Object.keys(data).length === 0) {
    return <EmptyState title="No data for this period" />;
  }

  const groups = Object.entries(data).filter(([, v]) => isObj(v));
  const tables = Object.entries(data).filter(
    ([, v]) => Array.isArray(v) && v.length > 0 && v.every(isObj),
  );

  return (
    <div className="space-y-5">
      <Tiles data={data} />
      {groups.map(([k, v]) => (
        <section key={k}>
          <h3 className="text-xs font-semibold text-gray-900 mb-2">
            {prettyKey(k)}
          </h3>
          <Tiles data={v as Obj} />
        </section>
      ))}
      {tables.map(([k, v]) => (
        <section key={k}>
          <h3 className="text-xs font-semibold text-gray-900 mb-2">
            {prettyKey(k)}
          </h3>
          <Table rows={v as Obj[]} />
        </section>
      ))}
    </div>
  );
};

export default GenericReportView;
