import api from "./axios";

export const registerApi = (payload) => api.post("/api/auth/register", payload);
export const loginApi = (payload) => api.post("/api/auth/login", payload);

// Add later when backend endpoints are ready:
export const forgotPasswordApi = (payload) => api.post("/api/auth/forgot-password", payload);
export const resetPasswordApi = (payload) => api.post("/api/auth/reset-password", payload);
