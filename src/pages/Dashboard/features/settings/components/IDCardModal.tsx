import React, { useRef, useState } from "react";
import { X, Download, Printer, Palette, Check } from "lucide-react";
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
  companyName?: string | null;
  companyLogoUrl?: string | null;
  qrCodeData?: string;
}

/* -------------------------------------------------------------------------- */
/*  Color utilities                                                          */
/* -------------------------------------------------------------------------- */

const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const normalizeHex = (hex: string) => {
  let h = hex.trim();
  if (!h.startsWith("#")) h = `#${h}`;
  if (h.length === 4) {
    // expand shorthand #abc -> #aabbcc
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h.toLowerCase();
};

const hexToRgb = (hex: string) => {
  const clean = normalizeHex(hex).replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
};

const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255,
  };
};

const getLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const getContrastRatio = (hexA: string, hexB: string) => {
  const l1 = getLuminance(hexA);
  const l2 = getLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

/** Picks whichever of pure white / pure black reads best against a background. */
const getBestTextColor = (bgHex: string) => {
  const whiteRatio = getContrastRatio(bgHex, "#ffffff");
  const blackRatio = getContrastRatio(bgHex, "#000000");
  return whiteRatio >= blackRatio ? "#ffffff" : "#000000";
};

/**
 * Takes a color and, if it wouldn't be readable as text on a white card body,
 * nudges its lightness down (or up, for near-black colors) until it clears a
 * minimum contrast ratio - while keeping its hue/saturation intact.
 */
const ensureReadableOnWhite = (hex: string, minRatio = 3) => {
  const clean = normalizeHex(hex);
  if (getContrastRatio(clean, "#ffffff") >= minRatio) return clean;

  const { r, g, b } = hexToRgb(clean);
  const { h, s, l } = rgbToHsl(r, g, b);

  let lightness = l;
  let candidate = clean;
  let attempts = 0;

  // Walk lightness down toward 0 (darker = more contrast against white)
  while (attempts < 40) {
    lightness = Math.max(0, lightness - 2.5);
    const { r: nr, g: ng, b: nb } = hslToRgb(h, s, lightness);
    candidate = rgbToHex(nr, ng, nb);
    if (getContrastRatio(candidate, "#ffffff") >= minRatio || lightness <= 0) {
      break;
    }
    attempts++;
  }
  return candidate;
};

const isValidHex = (hex: string) => HEX_PATTERN.test(hex.trim());

/* -------------------------------------------------------------------------- */

const COLOR_PRESETS = [
  "#1A2FBB", // brand blue
  "#DC2626", // red
  "#EA580C", // orange
  "#D97706", // amber
  "#059669", // emerald
  "#0891B2", // cyan
  "#2563EB", // blue
  "#7C3AED", // violet
  "#DB2777", // pink
  "#111827", // near-black
];

export const IDCardModal: React.FC<IDCardModalProps> = ({
  isOpen,
  onClose,
  staff,
  company_id,
  companyName,
  companyLogoUrl,
  qrCodeData,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Card background color
  const [cardColor, setCardColor] = useState("#1A2FBB");
  const [cardHexInput, setCardHexInput] = useState("#1A2FBB");
  const [cardHexError, setCardHexError] = useState(false);

  // Text color mode: "auto" derives readable colors from cardColor,
  // "custom" lets the user pick their own text color explicitly.
  const [textColorMode, setTextColorMode] = useState<"auto" | "custom">("auto");
  const [customTextColor, setCustomTextColor] = useState("#1A2FBB");
  const [textHexInput, setTextHexInput] = useState("#1A2FBB");
  const [textHexError, setTextHexError] = useState(false);

  const [showCustomizer, setShowCustomizer] = useState(true);

  // Text that sits ON TOP of the colored header/footer bands
  const headerFooterTextColor =
    textColorMode === "auto" ? getBestTextColor(cardColor) : customTextColor;

  // Accent text/borders that sit on the white card body (name, title, QR frame)
  const bodyAccentColor =
    textColorMode === "auto" ? ensureReadableOnWhite(cardColor) : customTextColor;

  const handleCardColorChange = (hex: string) => {
    setCardColor(hex);
    setCardHexInput(hex);
    setCardHexError(false);
  };

  const handleCardHexInput = (value: string) => {
    setCardHexInput(value);
    const normalized = normalizeHex(value);
    if (isValidHex(normalized)) {
      setCardColor(normalized);
      setCardHexError(false);
    } else {
      setCardHexError(true);
    }
  };

  const handleTextColorChange = (hex: string) => {
    setCustomTextColor(hex);
    setTextHexInput(hex);
    setTextHexError(false);
  };

  const handleTextHexInput = (value: string) => {
    setTextHexInput(value);
    const normalized = normalizeHex(value);
    if (isValidHex(normalized)) {
      setCustomTextColor(normalized);
      setTextHexError(false);
    } else {
      setTextHexError(true);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
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
        useCORS: true,
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

        const img = printWindow.document.getElementById(
          "print-card"
        ) as HTMLImageElement | null;
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

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* ID Card Preview */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
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
              {/* Header with diagonal cut */}
              <div
                style={{
                  background: cardColor,
                  padding: "18px 16px 28px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  clipPath: "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)",
                  height: "110px",
                  flexShrink: 0,
                }}
              >
                {/* Lanyard hole */}
                <div
                  style={{
                    width: "28px",
                    height: "12px",
                    background: "rgba(255,255,255,0.25)",
                    borderRadius: "6px",
                    marginBottom: "8px",
                    border: "2px solid rgba(255,255,255,0.5)",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: cardColor,
                    }}
                  >
                    <img
                      src={companyLogoUrl || "/icon.png"}
                      alt={companyLogoUrl ? `${companyName || "Company"} logo` : "Traccbox Logo"}
                      width={44}
                      height={44}
                      crossOrigin={companyLogoUrl ? "anonymous" : undefined}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <span
                    style={{
                      color: headerFooterTextColor,
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {companyName || "TRACCBOX"}
                  </span>
                </div>
              </div>

              {/* White Body */}
              <div
                style={{
                  flex: 1,
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "40px 16px 14px",
                }}
              >
                {/* QR Code (replaces photo) */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "4px",
                    border: `3px solid ${bodyAccentColor}`,
                    overflow: "hidden",
                    marginBottom: "10px",
                    background: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {qrCodeData ? (
                    <img
                      src={qrCodeData}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      alt="QR Code"
                    />
                  ) : (
                    <span style={{ fontSize: "10px", color: "#999", textAlign: "center" }}>
                      No QR
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: bodyAccentColor,
                    letterSpacing: "0.5px",
                    marginBottom: "2px",
                  }}
                >
                  {staff.full_name.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: bodyAccentColor,
                    borderBottom: `1.5px solid ${bodyAccentColor}`,
                    paddingBottom: "8px",
                    marginBottom: "10px",
                    width: "80%",
                    textAlign: "center",
                  }}
                >
                  {staff.job_title || staff.role}
                </div>

                {/* Details */}
                {[
                  ["Id NO :", staff.id.slice(0, 13).toUpperCase()],
                  [
                    "Join Date :",
                    staff.created_at
                      ? new Date(staff.created_at).toLocaleDateString("en-GB")
                      : "N/A",
                  ],
                  ["Department :", staff.department || "N/A"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "10.5px",
                      marginBottom: "5px",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#222" }}>{label}</span>
                    <span style={{ color: "#444" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Footer with reverse diagonal */}
              <div
                style={{
                  background: cardColor,
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  clipPath: "polygon(0 30%, 50% 0, 100% 30%, 100% 100%, 0 100%)",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: headerFooterTextColor,
                    fontSize: "10px",
                    fontWeight: 600,
                    paddingTop: "6px",
                  }}
                >
                  {staff.email}
                </span>
              </div>
            </div>
          </div>

          {/* Customizer Panel */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setShowCustomizer((v) => !v)}
              className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 mb-3 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium text-gray-900">
                <Palette className="w-4 h-4 text-purple-600" />
                Customize Colors
              </span>
              <span className="text-xs text-gray-400">
                {showCustomizer ? "Hide" : "Show"}
              </span>
            </button>

            {showCustomizer && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-5">
                {/* Card color */}
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-2">Card Color</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleCardColorChange(preset)}
                        style={{ background: preset }}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0"
                        aria-label={`Set card color to ${preset}`}
                      >
                        {normalizeHex(cardColor) === preset && (
                          <Check
                            className="w-4 h-4"
                            style={{ color: getBestTextColor(preset) }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={isValidHex(normalizeHex(cardColor)) ? normalizeHex(cardColor) : "#1a2fbb"}
                      onChange={(e) => handleCardColorChange(e.target.value)}
                      className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0"
                      aria-label="Pick custom card color"
                    />
                    <input
                      type="text"
                      value={cardHexInput}
                      onChange={(e) => handleCardHexInput(e.target.value)}
                      placeholder="#1A2FBB"
                      className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${
                        cardHexError ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {cardHexError && (
                    <p className="text-xs text-red-500 mt-1">
                      Enter a valid hex code, e.g. #1A2FBB or #1AB
                    </p>
                  )}
                </div>

                {/* Text color mode */}
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-2">Text Color</p>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setTextColorMode("auto")}
                      className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
                        textColorMode === "auto"
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Auto-match
                    </button>
                    <button
                      onClick={() => setTextColorMode("custom")}
                      className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
                        textColorMode === "custom"
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {textColorMode === "auto" ? (
                    <p className="text-xs text-gray-500">
                      Text automatically switches between light and dark shades so it
                      always stays readable against your chosen card color.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {["#ffffff", "#000000", ...COLOR_PRESETS].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => handleTextColorChange(preset)}
                            style={{
                              background: preset,
                              borderColor: preset === "#ffffff" ? "#d1d5db" : preset,
                            }}
                            className="w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0"
                            aria-label={`Set text color to ${preset}`}
                          >
                            {normalizeHex(customTextColor) === preset && (
                              <Check
                                className="w-4 h-4"
                                style={{ color: getBestTextColor(preset) }}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={
                            isValidHex(normalizeHex(customTextColor))
                              ? normalizeHex(customTextColor)
                              : "#1a2fbb"
                          }
                          onChange={(e) => handleTextColorChange(e.target.value)}
                          className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0"
                          aria-label="Pick custom text color"
                        />
                        <input
                          type="text"
                          value={textHexInput}
                          onChange={(e) => handleTextHexInput(e.target.value)}
                          placeholder="#1A2FBB"
                          className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${
                            textHexError ? "border-red-400" : "border-gray-300"
                          }`}
                        />
                      </div>
                      {textHexError && (
                        <p className="text-xs text-red-500 mt-1">
                          Enter a valid hex code, e.g. #1A2FBB or #1AB
                        </p>
                      )}
                      <p className="text-xs text-amber-600 mt-2">
                        Heads up: with a custom color you control readability yourself -
                        pick something with enough contrast against both the header band
                        and the white body.
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleCardColorChange("#1A2FBB");
                    setTextColorMode("auto");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Reset to default
                </button>
              </div>
            )}
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