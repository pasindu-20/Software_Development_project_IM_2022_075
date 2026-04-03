import api from "./axios";

export const getReceptionDashboardApi = () =>
  api.get("/api/reception/dashboard/summary");

export const listBookingsApi = () => api.get("/api/reception/bookings");

export const createManualBookingApi = (payload) =>
  api.post("/api/reception/bookings/manual", payload);

export const listCashPaymentsApi = () =>
  api.get("/api/reception/payments/cash");

export const confirmCashPaymentApi = (payment_id, note) =>
  api.post(`/api/reception/payments/cash/${payment_id}/confirm`, { note });

export const listBankTransferPaymentsApi = () =>
  api.get("/api/reception/payments/bank-transfer");

export const confirmBankTransferPaymentApi = (payment_id, note) =>
  api.post(`/api/reception/payments/bank-transfer/${payment_id}/confirm`, note);

export const listEnrollmentsApi = () =>
  api.get("/api/reception/enrollments");

export const createEnrollmentApi = (payload) =>
  api.post("/api/reception/enrollments", payload);

export const listInquiriesApi = () => api.get("/api/inquiry");

export const updateInquiryStatusApi = (id, status) =>
  api.patch(`/api/inquiry/${id}/status`, { status });

export const sendInquiryReplyApi = (id, payload) =>
  api.post(`/api/inquiry/${id}/reply`, payload);

export const listInquiryFollowupsApi = (id) =>
  api.get(`/api/inquiry/${id}/followups`);

export const getBookingPaymentDetailsApi = (bookingId) =>
  api.get(`/api/reception/payments/booking/${bookingId}`);

export const saveBookingPaymentApi = (bookingId, payload) =>
  api.post(`/api/reception/payments/booking/${bookingId}`, payload);