import api from "./axios";

export const acceptPaymentApi = (payload) => api.post("/api/payments", payload); // staff: admin/reception
