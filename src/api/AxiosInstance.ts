import axios, { AxiosInstance } from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;
const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
export default api;
