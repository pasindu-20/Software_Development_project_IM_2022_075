import api from "./axios";

// Assigned classes for logged-in instructor
export const getMyAssignedClassesApi = () => api.get("/api/instructor/classes");

// Enrolled children for a class
export const getEnrolledChildrenApi = (classId) =>
  api.get(`/api/instructor/classes/${classId}/children`);

// Mark attendance (bulk)
export const markAttendanceApi = (classId, date, records) =>
  api.post(`/api/instructor/classes/${classId}/attendance`, {
    date,
    records, // [{ child_id, status: "PRESENT"|"ABSENT" }]
  });

// Attendance history for a class
export const getAttendanceRecordsApi = (classId, from, to) =>
  api.get(`/api/instructor/classes/${classId}/attendance`, {
    params: { from, to },
  });
