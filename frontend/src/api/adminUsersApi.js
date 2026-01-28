import api from "./axios";

// Backend: POST /api/admin/staff  body: { full_name, email, phone, role }
export const createStaffUserApi = (payload) => api.post("/api/admin/staff", payload);

// Backend: GET /api/admin/staff
export const listStaffUsersApi = () => api.get("/api/admin/staff");
