import React, { useRef } from "react";
import { X, Download, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface IDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    department?: string;
    job_title?: string;
    profile_pic?: string;
    created_at?: string;
    phone_number?: string;
    is_active?: boolean;
  };
  company_id: string;
  qrCodeData?: string;
}

export const IDCardModal: React.FC<IDCardModalProps> = ({
  isOpen,
  onClose,
  staff,
  company_id,
  qrCodeData,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      // ID card standard size: 3.375 x 2.125 inches
     const pdf = new jsPDF({
  orientation: "portrait",
  unit: "in",
  format: [2.125, 3.375], 
});
     pdf.addImage(imgData, "PNG", 0, 0, 2.125, 3.375);
    pdf.save(`${staff.full_name}-id-card.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handlePrint = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <html>
            <head>
              <title>Print ID Card</title>
              <style>
                body { margin: 0; padding: 0; }
                img { width: 100%; height: auto; display: block; }
              </style>
            </head>
            <body>
              <img id="print-card" src="${imgData}" />
            </body>
          </html>
        `);
        printWindow.document.close();

        const img = printWindow.document.getElementById("print-card") as HTMLImageElement | null;
        if (img) {
          img.onload = () => {
            printWindow.focus();
            printWindow.print();
          };
        } else {
          printWindow.focus();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error("Error printing:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
<div className="bg-gray-200 rounded-2xl p-8 max-w-2xl w-full shadow-xl my-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {staff.full_name}'s ID Card
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ID Card Preview */}
        <div className="flex flex-col items-center gap-6 mb-6">
          <p className="text-sm text-gray-600">
            ID Card Preview (Standard 3.375" x 2.125")
          </p>

<div
  ref={cardRef}
  style={{
    width: "260px",
    height: "390px",
    background: "#ffffff",
    borderRadius: "14px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial, sans-serif",
  }}
>
  {/* Blue Header with diagonal cut */}
  <div style={{
    background: "#1A2FBB",
    padding: "18px 16px 28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    clipPath: "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)",
    height: "110px",
    flexShrink: 0,
  }}>
    {/* Lanyard hole */}
    <div style={{
      width: "28px", height: "12px",
      background: "rgba(255,255,255,0.25)",
      borderRadius: "6px",
      marginBottom: "8px",
      border: "2px solid rgba(255,255,255,0.5)",
    }} />
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{
        width: "32px", height: "32px", background: "white",
        borderRadius: "50%", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#1A2FBB",
      }}> <img
        src="/icon.png"
        alt="Traccbox Logo"
        width={44}
        height={44}
        style={{ objectFit: "contain" }}
      /></div>
      <span style={{ color: "white", fontSize: "13px", fontWeight: 700 }}>TRACCBOX</span>
      {/* logo */}
     
    </div>
  </div>

  {/* White Body */}
  <div style={{
    flex: 1, background: "#ffffff", display: "flex",
    flexDirection: "column", alignItems: "center",
    padding: "40px 16px 14px",
  }}>
   {/* QR Code (replaces photo) */}
<div style={{
  width: "80px", height: "80px", borderRadius: "4px",
  border: "3px solid #1A2FBB", overflow: "hidden",
  marginBottom: "10px", background: "#f0f0f0",
  display: "flex", alignItems: "center", justifyContent: "center",
}}>
  {qrCodeData
    ? <img src={qrCodeData} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="QR Code" />
    : <span style={{ fontSize: "10px", color: "#999", textAlign: "center" }}>No QR</span>
  }
</div>

    <div style={{ fontSize: "15px", fontWeight: 700, color: "#1A2FBB", letterSpacing: "0.5px", marginBottom: "2px" }}>
      {staff.full_name.toUpperCase()}
    </div>
    <div style={{
      fontSize: "11px", fontWeight: 600, color: "#1A2FBB",
      borderBottom: "1.5px solid #1A2FBB", paddingBottom: "8px",
      marginBottom: "10px", width: "80%", textAlign: "center",
    }}>
      {staff.job_title || staff.role}
    </div>

    {/* Details */}
    {[
      ["Id NO :", staff.id.slice(0, 13).toUpperCase()],
      ["Join Date :", staff.created_at ? new Date(staff.created_at).toLocaleDateString("en-GB") : "N/A"],
      ["Department :", staff.department || "N/A"],
    ].map(([label, value]) => (
      <div key={label} style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "10.5px", marginBottom: "5px" }}>
        <span style={{ fontWeight: 700, color: "#222" }}>{label}</span>
        <span style={{ color: "#444" }}>{value}</span>
      </div>
    ))}
  </div>

  {/* Blue Footer with reverse diagonal */}
  <div style={{
    background: "#1A2FBB", height: "32px",
    display: "flex", alignItems: "center", justifyContent: "center",
    clipPath: "polygon(0 30%, 50% 0, 100% 30%, 100% 100%, 0 100%)",
    flexShrink: 0,
  }}>
    <span style={{ color: "white", fontSize: "10px", fontWeight: 600, paddingTop: "6px" }}>
      {staff.email}
    </span>
  </div>
</div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-5 h-5" />
            <span>Print Card</span>
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">Printing Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Use high-quality cardstock (300gsm recommended)</li>
            <li>Print on both sides for professional appearance</li>
            <li>Cut carefully along the card edges</li>
            <li>Use a laminator for durability</li>
          </ul>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
