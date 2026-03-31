import api from "./axios";

export const createInquiryApi = (payload) => api.post("/api/inquiry", payload);

export const listPublicClassesApi = () => api.get("/api/public/classes");
export const listPublicEventsApi = () => api.get("/api/public/events");
export const listPublicPlayAreasApi = () => api.get("/api/public/play-areas");

export const getPlayAreaAvailabilityApi = (params) =>
  api.get("/api/public/play-areas/availability", { params });

export const listPublicPartyPackagesApi = () => api.get("/api/public/party-packages");