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
