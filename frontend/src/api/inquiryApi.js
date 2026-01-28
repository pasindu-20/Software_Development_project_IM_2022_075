import api from "./axios";

export const createInquiryApi = (payload) => api.post("/api/inquiry", payload);
export const listInquiriesApi = () => api.get("/api/inquiry"); // staff only
export const assignInquiryApi = (id, payload) => api.patch(`/api/inquiry/${id}/assign`, payload);
export const updateInquiryStatusApi = (id, payload) => api.patch(`/api/inquiry/${id}/status`, payload);
export const addFollowupApi = (id, payload) => api.post(`/api/inquiry/${id}/followups`, payload);
export const listFollowupsApi = (id) => api.get(`/api/inquiry/${id}/followups`);
