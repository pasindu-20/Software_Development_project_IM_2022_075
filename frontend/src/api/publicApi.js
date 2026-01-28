import api from "./axios";

// ✅ Contact/Inquiry (already working in your backend)
export const createInquiryApi = (payload) => api.post("/api/inquiry", payload);

// ✅ Optional (if you already have these endpoints)
// If not, we will show fallback UI in pages
export const listPublicClassesApi = () => api.get("/api/public/classes");
export const getPublicClassApi = (id) => api.get(`/api/public/classes/${id}`);

export const listPartyPackagesApi = () => api.get("/api/public/party-packages");
