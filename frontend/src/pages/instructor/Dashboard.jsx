import { useEffect, useState } from "react";
import {
  getInstructorDashboardApi,
  getMyAssignedClassesApi,
} from "../../api/instructorApi";

export default function InsDashboard() {
  const [stats, setStats] = useState({
    assignedClasses: 0,
    totalEnrollments: 0,
    classesMarkedToday: 0,
    pendingAttendanceToday: 0,
  });
  const [classes, setClasses] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [statsRes, classesRes] = await Promise.all([
        getInstructorDashboardApi(),
        getMyAssignedClassesApi(),
      ]);

      setStats({
        assignedClasses: Number(statsRes.data?.assignedClasses || 0),
        totalEnrollments: Number(statsRes.data?.totalEnrollments || 0),
        classesMarkedToday: Number(statsRes.data?.classesMarkedToday || 0),
        pendingAttendanceToday: Number(statsRes.data?.pendingAttendanceToday || 0),
      });
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
    } catch (e) {
      setClasses([]);
      setErr(e?.response?.data?.message || "Failed to load instructor dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Instructor Dashboard</h2>

      {err ? <div style={{ color: "crimson" }}>{err}</div> : null}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <Card title="Assigned Items" value={stats.assignedClasses} />
            <Card title="Total Enrollments" value={stats.totalEnrollments} />
            <Card title="Classes Marked Today" value={stats.classesMarkedToday} />
            <Card title="Pending Attendance" value={stats.pendingAttendanceToday} />
          </div>

          <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>My Assigned Classes and Events</h3>

            {classes.length === 0 ? (
              <div style={{ color: "#666" }}>No assigned classes found.</div>
            ) : (
              <table width="100%" cellPadding="8" border="1">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Enrolled</th>
                    <th>Today Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => (
                    <tr key={c.id}>
                      <td>{c.item_type || "-"}</td>
                      <td>{c.title || `Class #${c.id}`}</td>
                      <td>{c.event_date ? String(c.event_date).slice(0, 10) : "-"}</td>
                      <td>
                        {c.start_time ? String(c.start_time).slice(0, 5) : "-"}
                        {c.end_time ? ` - ${String(c.end_time).slice(0, 5)}` : ""}
                      </td>
                      <td>{Number(c.enrolled_count || 0)}</td>
                      <td>{c.item_type === "CLASS" ? Number(c.today_attendance_count || 0) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ background: "white", padding: 14, borderRadius: 12 }}>
      <div style={{ fontSize: 13, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
    </div>
  );
}