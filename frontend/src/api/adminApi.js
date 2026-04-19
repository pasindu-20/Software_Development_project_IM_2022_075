import api from "./axios";

export const adminCardsApi = () => api.get("/api/admin/dashboard/cards");
export const inquiryByStatusApi = () => api.get("/api/admin/dashboard/inquiries-by-status");
export const monthlyRevenueApi = () => api.get("/api/admin/dashboard/monthly-revenue");
export const createStaffApi = (payload) => api.post("/api/admin/staff", payload);
export const listStaffApi = () => api.get("/api/admin/staff");

export const listAdminPartyPackagesApi = () => api.get("/api/admin/party-packages");
export const listInstructorsApi = () => api.get("/api/admin/instructors");

export const downloadIncomeReportApi = (month) =>
  api.get("/api/admin/dashboard/monthly-income-report", {
    params: { month },
    responseType: "blob",
  });