import api from "../AxiosInstance";

// Get all staff members for a company
export async function getAllStaff(company_id: string) {
  try {
    const res = await api.get(`/${company_id}/all_staffs`);
    return res.data;
  } catch (error) {
    console.log("getAllStaff error", error);
    throw error;
  }
}

