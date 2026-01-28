import api from "./axios";

/**
 * BOOKINGS
 */
export const listBookingsApi = () => api.get("/api/reception/bookings");
export const createManualBookingApi = (payload) =>
  api.post("/api/reception/bookings/manual", payload);

/**
 * CASH PAYMENTS (reception updates cash payment status)
 */
export const listCashPaymentsApi = () => api.get("/api/reception/payments/cash");
export const confirmCashPaymentApi = (payment_id, note) =>
  api.post(`/api/reception/payments/cash/${payment_id}/confirm`, { note });

/**
 * ENROLLMENT (kids/class enrollment at counter)
 */
export const listEnrollmentsApi = () => api.get("/api/reception/enrollments");
export const createEnrollmentApi = (payload) => api.post("/api/reception/enrollments", payload);

/**
 * INQUIRIES (reception can view & update status if you allow)
 */
export const listInquiriesApi = () => api.get("/api/inquiry");
export const updateInquiryStatusApi = (id, status) =>
  api.patch(`/api/inquiry/${id}`, { status });
