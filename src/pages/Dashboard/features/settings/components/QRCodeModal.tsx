import React, { useState } from "react";
import { X, Download, Eye } from "lucide-react";
import { useStaffQRCode } from "@/api/settingsApi/hooks/useQRCode";
import { getStaffQRCode } from "@/api/settingsApi/QRCodeServices";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    job_title?: string;
  };
  company_id: string;
  manager_id?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  staff,
  company_id,
  manager_id,
}) => {
  const [view, setView] = useState<"preview" | "download">("preview");

  // Get QR code as base64 JSON
  const { data: qrCodeData, isLoading: qrLoading } = useStaffQRCode(
    company_id,
    staff.id,
    "json",
    manager_id
  );

  // Get QR code as image for downloading
  const downloadQRCode = async () => {
    try {
      const qrBlob = await getStaffQRCode(
        company_id,
        staff.id,
        "image",
        manager_id
      );

      const url = window.URL.createObjectURL(qrBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${staff.full_name}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading QR code:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {staff.full_name}'s QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setView("preview")}
            className={`pb-2 px-2 font-medium transition-colors ${
              view === "preview"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
          <button
            onClick={() => setView("download")}
            className={`pb-2 px-2 font-medium transition-colors ${
              view === "download"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download
          </button>
        </div>

        {/* Content */}
        {view === "preview" && (
          <div className="flex flex-col items-center gap-4">
            {qrLoading ? (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : qrCodeData ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <img
                  src={qrCodeData}
                  alt="QR Code"
                  className="w-64 h-64 object-contain"
                />
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Failed to load QR code
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full text-sm text-blue-700">
              <p className="font-medium mb-1">How to use:</p>
              <p>
                Scanner this QR code to clock in/out the staff member. The QR
                encodes the staff ID and company information.
              </p>
            </div>
          </div>
        )}

        {view === "download" && (
          <div className="flex flex-col gap-4">
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-600 mb-4">
                Download the QR code as a PNG image to print on ID cards.
              </p>
              <button
                onClick={downloadQRCode}
                disabled={qrLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {qrLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download QR Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              <p className="font-medium mb-1">Supported formats:</p>
              <p>PNG format - High quality for printing</p>
            </div>
          </div>
        )}

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
