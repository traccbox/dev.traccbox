/**
 * Lightweight client-side export helpers used across dashboard modules.
 * PDF/Excel use browser-native paths (print-to-PDF and Excel-readable HTML/CSV)
 * so no extra dependency is needed before the backend export API lands.
 */

type Row = Record<string, unknown>;

const escapeCsv = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const download = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export function exportCSV(rows: Row[], filename = "export.csv") {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(",")),
  ].join("\n");
  download(csv, filename, "text/csv;charset=utf-8;");
}

export function exportExcel(rows: Row[], filename = "export.xls") {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const html = `<table border="1"><thead><tr>${headers
    .map((h) => `<th>${h}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map(
      (r) =>
        `<tr>${headers.map((h) => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody></table>`;
  download(html, filename, "application/vnd.ms-excel");
}

export function exportPDF(title: string, rows: Row[]) {
  printHTML(title, tableHTML(rows));
}

export function tableHTML(rows: Row[]) {
  if (!rows.length) return "<p>No data</p>";
  const headers = Object.keys(rows[0]);
  return `<table><thead><tr>${headers
    .map((h) => `<th>${h}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${headers.map((h) => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

export function printHTML(title: string, body: string) {
  const w = window.open("", "_blank", "width=1024,height=768");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${title}</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;padding:24px;color:#111}
    h1{font-size:18px;margin:0 0 4px}
    p.meta{font-size:12px;color:#666;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #e5e7eb;padding:6px 8px;text-align:left}
    th{background:#f3f6fd;color:#1658E5}
  </style></head><body>
  <h1>${title}</h1><p class="meta">TraccBox • generated ${new Date().toLocaleString()}</p>
  ${body}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
