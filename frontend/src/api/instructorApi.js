import api from "./axios";

export const getInstructorDashboardApi = () => api.get("/api/instructor/dashboard");

export const getMyAssignedClassesApi = () => api.get("/api/instructor/classes");

export const getEnrolledChildrenApi = (classId, date) =>
  api.get(`/api/instructor/classes/${classId}/children`, {
    params: date ? { date } : undefined,
  });

export const markAttendanceApi = (classId, date, records) =>
  api.post(`/api/instructor/classes/${classId}/attendance`, {
    date,
    records,
  });

export const getAttendanceRecordsApi = (classId, from, to) =>
  api.get(`/api/instructor/classes/${classId}/attendance`, {
    params: { from, to },
  });