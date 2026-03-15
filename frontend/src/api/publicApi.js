import api from "./axios";

export const createInquiryApi = (payload) => api.post("/api/inquiry", payload);

export const listPublicClassesApi = () => api.get("/api/public/classes");
export const listPublicEventsApi = () => api.get("/api/public/events");
export const listPublicPlayAreasApi = () => api.get("/api/public/play-areas");
