import api from "./axios";

// bookings
export const createBookingApi = (payload) => api.post("/api/parent/bookings", payload);
export const listMyBookingsApi = () => api.get("/api/parent/bookings");

// profile
export const getMeApi = () => api.get("/api/parent/me");

// children
export const addChildApi = (payload) => api.post("/api/parent/children", payload);
export const listChildrenApi = () => api.get("/api/parent/children");

// classes
export const listClassesApi = () => api.get("/api/public/classes");

// enrollments
export const enrollApi = (payload) => api.post("/api/parent/enroll", payload);
export const listMyEnrollmentsApi = () => api.get("/api/parent/enrollments");

// payments
export const listMyPaymentsApi = () => api.get("/api/parent/payments");
export const createPaymentApi = (payload) => api.post("/api/parent/payments", payload);

// stripe card payments
export const createStripePaymentIntentApi = (payload) =>
  api.post("/api/parent/payments/stripe/create-intent", payload);

export const finalizeStripePaymentApi = (payload) =>
  api.post("/api/parent/payments/stripe/finalize", payload);