// 📁 src/Api/workreportsApi.js
import axios from "axios";

const BASE_URL = "http://localhost:5000/api/work-reports";

// ✅ Create an Axios instance
const API = axios.create({
  baseURL: BASE_URL,
});

// ✅ Interceptor to add token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const workReportsApi = {
  // Submit a new work report
  submit: (data) =>
    API.post("/submit", data).then((res) => res.data),

  // Get only logged-in user’s reports
  getMy: () =>
    API.get("/my").then((res) => res.data),

  // Get all reports (admin/hr only)
  getAll: () =>
    API.get("/all").then((res) => res.data),

  // Add comment/review on a report
  comment: (reportId, data) =>
    API.put(`/${reportId}/comment`, data).then((res) => res.data),

  // Export all reports as CSV
  exportAll: () =>
    API.get("/export", { responseType: "blob" }).then((res) => res.data),

  // Export reports by a specific user
  exportByUser: (userId) =>
    API.get(`/export/${userId}`, { responseType: "blob" }).then((res) => res.data),
};