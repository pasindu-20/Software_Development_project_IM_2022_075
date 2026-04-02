import api from "./axios";

export const getInstructorDashboardApi = (instructorId) =>
  api.get("/api/instructor/dashboard", {
    params: instructorId ? { instructorId } : undefined,
  });

export const getMyAssignedClassesApi = (instructorId) =>
  api.get("/api/instructor/classes", {
    params: instructorId ? { instructorId } : undefined,
  });

export const getEnrolledChildrenApi = (classId, date, instructorId) =>
  api.get(`/api/instructor/classes/${classId}/children`, {
    params: {
      ...(date ? { date } : {}),
      ...(instructorId ? { instructorId } : {}),
    },
  });

export const markAttendanceApi = (classId, date, records, instructorId) =>
  api.post(`/api/instructor/classes/${classId}/attendance`, {
    date,
    records,
    ...(instructorId ? { instructorId } : {}),
  });

export const getAttendanceRecordsApi = (classId, from, to, instructorId) =>
  api.get(`/api/instructor/classes/${classId}/attendance`, {
    params: {
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(instructorId ? { instructorId } : {}),
    },
  });