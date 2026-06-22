import api from "../AxiosInstance";

// Get QR code for a staff member
export async function getStaffQRCode(
  company_id: string,
  staff_id: string,
  format: "json" | "image" = "json",
  manager_id?: string
) {
  try {
    const params = new URLSearchParams();
    params.append("format", format);
    if (manager_id) {
      params.append("manager_id", manager_id);
    }

    const res = await api.get(
      `/staffs/${company_id}/${staff_id}/qr-code?${params.toString()}`,
      {
        responseType: format === "image" ? "blob" : "json",
      }
    );

    if (format === "json") {
      if (res.data?.qr_code) {
        return `data:image/png;base64,${res.data.qr_code}`;
      }

      if (typeof res.data === "string") {
        return res.data.startsWith("data:")
          ? res.data
          : `data:image/png;base64,${res.data}`;
      }
    }

    return res.data;
  } catch (error) {
    console.log("getStaffQRCode error", error);
    throw error;
  }
}

// Clock in a staff member via QR code
export async function qrClockIn(
  company_id: string,
  staff_id: string,
  manager_id?: string
) {
  try {
    const endpoint = `/clock-in/${company_id}/${staff_id}${
      manager_id ? `?manager_id=${encodeURIComponent(manager_id)}` : ""
    }`;
    const res = await api.post(endpoint);
    return res.data;
  } catch (error) {
    console.log("qrClockIn error", error);
    throw error;
  }
}
