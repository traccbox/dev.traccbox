import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
// Get all staff members for a company
export async function getAllStaff(company_id: string) {
    console.log("company_id in getAllStaff==", company_id);
  try {
    const res = await api.get(`/${company_id}/all_staffs`);
    console.log("getAllStaff res==", res.data);
    return res.data;
  } catch (error) {
    console.log("getAllStaff error", error);
    throw error;
  }
}
