import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { periodLabel, ymd } from "@/api/supervisor-kpi/dates";
import { planningScore } from "@/api/supervisor-kpi/kpi";
import { useWorkforce } from "./store";
import { BASE, Empty, Panel, ScoreBadge, StatTile, cap, lower, useTerms } from "./ui";

const ACTIVE = ["assigned", "in_progress", "rework", "on_hold"];

const Overview: React.FC = () => {
  const w = useWorkforce();
  const T = useTerms();
  const now = new Date();
  const today = ymd(now);

  const m = useMemo(() => {
    const activeSups = w.supervisors.filter((s) => s.status === "active");
    const openTasks = w.tasks.filter((t) => ACTIVE.includes(t.status));
    const overdue = openTasks.filter((t) => new Date(t.dueAt) < now);
    const review = w.tasks.filter((t) => t.status === "under_review");
    const todays = w.reports.filter((r) => r.reportDate === today);
    const required = w.config.report.requiredDays.includes(now.getDay());
    const missing = required ? activeSups.filter((s) => !todays.some((r) => r.supervisorId === s.id)) : [];
    const assigned = todays.reduce((s, r) => s + r.workersAssigned, 0);
    const present = todays.reduce((s, r) => s + r.workersPresent, 0);
    const toReview = w.reports.filter((r) => r.reviewStatus === "submitted");
    const payPending = w.payroll.filter((p) => p.period === w.period && p.status === "pending");
    const invited = w.supervisors.filter((s) => s.status === "invited");
    const unplanned = openTasks.filter((t) => planningScore(t) < 100);

    const trend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const rs = w.reports.filter((r) => r.reportDate === ymd(d) && r.workersAssigned > 0);
      const a = rs.reduce((s, r) => s + r.workersAssigned, 0);
      const p = rs.reduce((s, r) => s + r.workersPresent, 0);
      return { day: d.toLocaleDateString(undefined, { weekday: "short" }), attendance: a ? Math.round((p / a) * 100) : null, reports: rs.length };
    });

    const board = activeSups
      .map((s) => ({ s, score: w.kpiFor(s.id).score }))
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

    const byLocation = w.locations
      .filter((l) => l.status === "active")
      .map((l) => ({
        l,
        sups: w.supervisors.filter((s) => s.locationIds.includes(l.id) && s.status !== "suspended").length,
        open: openTasks.filter((t) => t.locationId === l.id).length,
        late: overdue.filter((t) => t.locationId === l.id).length,
        filed: todays.some((r) => r.locationId === l.id),
      }));

    return { activeSups, openTasks, overdue, review, todays, required, missing, assigned, present, toReview, payPending, invited, unplanned, trend, board, byLocation };
  }, [w, now.getDate()]); // eslint-disable-line react-hooks/exhaustive-deps

  if (w.supervisors.length === 0) {
    return (
      <Panel bodyClassName="p-0">
        <Empty
          title={`No ${lower(T.supervisors)} yet`}
          message={`Add your first ${lower(T.supervisor)} — they get an invite to the mobile app, where they manage their ${lower(T.workers)}, log ${lower(T.task)} progress and file daily reports.`}
          action={{ label: `Add ${lower(T.supervisor)}`, to: `${BASE}/supervisors?new=1` }}
        />
      </Panel>
    );
  }

  const alerts: { tone: "bad" | "warn"; text: string; to: string }[] = [];
  if (m.overdue.length) alerts.push({ tone: "bad", text: `${m.overdue.length} overdue ${lower(m.overdue.length === 1 ? T.task : T.tasks)}`, to: `${BASE}/tasks?filter=overdue` });
  if (m.missing.length) alerts.push({ tone: "bad", text: `${m.missing.length} ${lower(m.missing.length === 1 ? T.supervisor : T.supervisors)} haven’t filed today’s report`, to: `${BASE}/reports` });
  if (m.review.length) alerts.push({ tone: "warn", text: `${m.review.length} ${lower(T.tasks)} waiting for your review`, to: `${BASE}/tasks?filter=review` });
  if (m.toReview.length) alerts.push({ tone: "warn", text: `${m.toReview.length} daily report${m.toReview.length > 1 ? "s" : ""} to review`, to: `${BASE}/reports?filter=submitted` });
  if (m.unplanned.length) alerts.push({ tone: "warn", text: `${m.unplanned.length} open ${lower(T.tasks)} are missing planning details (team, schedule or description)`, to: `${BASE}/tasks` });
  if (m.payPending.length) alerts.push({ tone: "warn", text: `${m.payPending.length} payroll record${m.payPending.length > 1 ? "s" : ""} awaiting approval for ${periodLabel(w.period)}`, to: `${BASE}/payroll` });
  if (m.invited.length) alerts.push({ tone: "warn", text: `${m.invited.length} ${lower(m.invited.length === 1 ? T.supervisor : T.supervisors)} haven’t joined the mobile app yet`, to: `${BASE}/supervisors` });

  const attendanceToday = m.assigned ? Math.round((m.present / m.assigned) * 100) : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={`Active ${lower(T.supervisors)}`} value={m.activeSups.length} hint={`${w.workers.filter((x) => x.status === "active").length} ${lower(T.workers)} in teams`} to={`${BASE}/supervisors`} />
        <StatTile label={`Open ${lower(T.tasks)}`} value={m.openTasks.length} hint={`${m.review.length} awaiting review`} to={`${BASE}/tasks`} />
        <StatTile label="Overdue" value={m.overdue.length} tone={m.overdue.length ? "bad" : "good"} hint={m.overdue.length ? "Needs attention" : "All on schedule"} to={`${BASE}/tasks?filter=overdue`} />
        <StatTile
          label="Attendance today"
          value={attendanceToday === null ? "—" : `${attendanceToday}%`}
          tone={attendanceToday === null ? "default" : attendanceToday >= 90 ? "good" : attendanceToday >= 75 ? "warn" : "bad"}
          hint={m.todays.length ? `${m.present}/${m.assigned} present · ${m.todays.length} report${m.todays.length > 1 ? "s" : ""}` : m.required ? "No reports yet" : "Not a reporting day"}
          to={`${BASE}/reports`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Needs attention" className="lg:col-span-2" bodyClassName="p-0">
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-emerald-700">
              <CheckCircle2 className="h-5 w-5" /> Everything is on track.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {alerts.map((a) => (
                <li key={a.text}>
                  <Link to={a.to} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50">
                    <AlertTriangle className={`h-4 w-4 flex-none ${a.tone === "bad" ? "text-red-500" : "text-amber-500"}`} />
                    <span className="flex-1 text-gray-800">{a.text}</span>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`${cap(T.supervisor)} ranking`} subtitle={periodLabel(w.period)} actions={<Link to={`${BASE}/kpi`} className="text-xs font-medium text-[#1658E5]">Scorecards</Link>} bodyClassName="p-0">
          <ul className="divide-y divide-gray-50">
            {m.board.slice(0, 6).map(({ s, score }, i) => (
              <li key={s.id}>
                <Link to={`${BASE}/supervisors/${s.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                  <span className="w-4 text-xs text-gray-400">{i + 1}</span>
                  <span className="flex-1 truncate text-gray-800">{s.name}</span>
                  <ScoreBadge score={score} />
                </Link>
              </li>
            ))}
            {m.board.length === 0 && <li className="px-4 py-6 text-center text-xs text-gray-400">No active {lower(T.supervisors)}.</li>}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Attendance — last 7 days" subtitle="Present ÷ assigned across submitted reports">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.trend} margin={{ left: -20, right: 4, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip formatter={(v: number | null) => (v === null ? "No reports" : `${v}%`)} />
                <Bar dataKey="attendance" fill="#1658E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={cap(T.locations)} bodyClassName="p-0">
          {m.byLocation.length === 0 ? (
            <Empty title={`No ${lower(T.locations)} yet`} action={{ label: "Add in Setup", to: `${BASE}/setup?tab=locations` }} />
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">{cap(T.location)}</th>
                  <th className="px-2 py-2.5 text-right font-medium">{cap(T.supervisors)}</th>
                  <th className="px-2 py-2.5 text-right font-medium">Open</th>
                  <th className="px-2 py-2.5 text-right font-medium">Overdue</th>
                  <th className="px-4 py-2.5 text-right font-medium">Report today</th>
                </tr>
              </thead>
              <tbody>
                {m.byLocation.map(({ l, sups, open, late, filed }) => (
                  <tr key={l.id} className="border-t border-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{l.name}</td>
                    <td className="px-2 py-2.5 text-right">{sups}</td>
                    <td className="px-2 py-2.5 text-right">{open}</td>
                    <td className={`px-2 py-2.5 text-right ${late ? "font-semibold text-red-600" : ""}`}>{late}</td>
                    <td className="px-4 py-2.5 text-right">{filed ? <span className="text-emerald-600">Filed</span> : <span className="text-gray-400">{m.required ? "Missing" : "—"}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default Overview;
