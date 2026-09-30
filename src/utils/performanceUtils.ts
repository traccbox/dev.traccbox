import { PerformanceReportData } from "@/api/performance-logs/types";
import { PeriodType } from "@/pages/Dashboard/features/performance/Reports";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PerformanceLogExportItem {
  employee_name: string;
  employee_id: string;
  activity: string;
  time: string;
  //   gps: {
  //     address?: string;
  //     lat?: number;
  //     lng?: number;
  //   } | null;
  branch: string | null;
  department: string | null;
  status: string;
  device: string | null;
}

type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable: { finalY: number };
};

export function downloadPerformanceReport(
  report: PerformanceLogExportItem[],
  format: "pdf" | "csv" = "pdf",
) {
  const headers = [
    "Employee",
    "Activity",
    "Time",
    "Location",

    "Branch",
    "Department",
    "Device",
    "Status",
  ];

  const rows = report.map((item) => [
    item.employee_name,
    item.activity,
    new Date(item.time).toLocaleString(),
    // item.gps?.address ?? "-",
    // item.gps
    //   ? `${item.gps.lat?.toFixed(4) ?? "-"}, ${item.gps.lng?.toFixed(4) ?? "-"}`
    //   : "-",
    item.branch ?? "-",
    item.department ?? "-",
    item.device ?? "-",
    item.status,
  ]);

  // CSV Download
  if (format === "csv") {
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `performance-report.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    return;
  }

  // PDF Download
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Performance Logs Report", 14, 18);

  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);

  if (report.length === 0) {
    doc.setFontSize(14);
    doc.text("Nothing to report yet.", 14, 45);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text("There are currently no performance log records.", 14, 55);

    doc.save(`performance-report.pdf`);

    return;
  }

  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: rows,
    styles: {
      fontSize: 8,
    },
    headStyles: {
      fillColor: [15, 37, 87],
    },
  });

  doc.save(`performance-report.pdf`);
}

export function downloadMonthlyWeeklyReport(
  report: PerformanceReportData,
  period: PeriodType,
  format: "pdf" | "csv" = "pdf",
) {
  const periodLabel = period === "weekly" ? "Weekly" : "Monthly";

  const performanceData =
    period === "weekly"
      ? report.weekly_performance
      : report.monthly_performance;

  const performanceHeaders = ["Period", "Visits", "Orders", "Tasks"];

  const performanceRows = performanceData.map((item) => [
    item.label,
    item.visits,
    item.orders,
    item.tasks,
  ]);

  const summaryHeaders = [
    "Total Employees",
    "Attendance Rate",
    "Active Employees",
    "Customer Visits",
    "Orders Created",
    "Tasks Completed",
    "Distance Covered (km)",
    "Working Hours",
    "Productivity Score",
  ];

  const summaryRow = [
    report.summary.total_employees,
    `${report.summary.attendance_rate}%`,
    report.summary.active_employees,
    report.summary.customer_visits,
    report.summary.orders_created,
    report.summary.tasks_completed,
    report.summary.distance_covered_km,
    report.summary.working_hours,
    report.summary.productivity_score,
  ];

  const attendanceHeaders = ["Day", "Present", "Absent", "Late"];

  const attendanceRows = report.daily_attendance.map((item) => [
    item.label,
    item.present,
    item.absent,
    item.late,
  ]);

  // CSV Download
  if (format === "csv") {
    const csvSections = [
      // Summary
      "SUMMARY",
      summaryHeaders.join(","),
      summaryRow
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),

      "",

      // Weekly / Monthly performance
      `${periodLabel.toUpperCase()} PERFORMANCE`,
      performanceHeaders.join(","),
      ...performanceRows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      ),

      "",

      // Daily attendance
      "DAILY ATTENDANCE",
      attendanceHeaders.join(","),
      ...attendanceRows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      ),
    ];

    const csv = csvSections.join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${period}-performance-report.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    return;
  }

  // PDF Download
  const doc = new jsPDF("landscape") as JsPDFWithAutoTable;

  doc.setFontSize(18);
  doc.text(`${periodLabel} Performance Report`, 14, 18);

  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);

  // Summary
  doc.setFontSize(13);
  doc.text("Performance Summary", 14, 38);

  autoTable(doc, {
    startY: 43,
    head: [summaryHeaders],
    body: [summaryRow],
    styles: {
      fontSize: 8,
    },
    headStyles: {
      fillColor: [15, 37, 87],
    },
  });

  let currentY = doc.lastAutoTable.finalY + 12;

  // Weekly / Monthly Performance
  doc.setFontSize(13);
  doc.text(`${periodLabel} Performance`, 14, currentY);

  if (performanceRows.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`No ${period} performance data available.`, 14, currentY + 8);

    currentY += 20;
  } else {
    autoTable(doc, {
      startY: currentY + 5,
      head: [performanceHeaders],
      body: performanceRows,
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [15, 37, 87],
      },
    });

    currentY = doc.lastAutoTable.finalY + 12;
  }

  // Daily Attendance
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("Daily Attendance", 14, currentY);

  if (attendanceRows.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("No attendance data available.", 14, currentY + 8);
  } else {
    autoTable(doc, {
      startY: currentY + 5,
      head: [attendanceHeaders],
      body: attendanceRows,
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [15, 37, 87],
      },
    });
  }

  doc.save(`${period}-performance-report.pdf`);
}
